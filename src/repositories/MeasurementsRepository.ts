import { AppDataSource } from "@database";
import { LessThanOrEqual, MoreThanOrEqual, Repository, And, In } from "typeorm";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { UserType } from "@models/UserType";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils/utils";
import { stringToISO } from "@utils/dateUtils";
import { get } from "http";
import { getNetwork } from "@controllers/networkController";
import { getAllGateways, getGateway } from "@controllers/gatewayController";
import { stat } from "fs"; 
import { measureMemory } from "vm";
import { getAllSensors, getAllSensorsInNetwork, getSensor } from "@controllers/SensorController";
import { Measurement, MeasurementToJSON } from "@models/dto/Measurement";
import { Measurements } from "@models/dto/Measurements";
import { validateNetworkCode, validateGatewayMac, validateSensorMac } from "@utils/utils";
import { Stats } from "@models/dto/Stats";
import { calculateStats } from "@utils/statsUtils";
import { Sensor } from "@models/dto/Sensor";
import AppError from "@models/errors/AppError";
import { SensorDAO } from "@dao/SensorDAO";
import { SensorRepository } from "./SensorRepository";

export class MeasurementsRepository {
  private repo: Repository<MeasurementDAO>;
  private sensorRepo: SensorRepository;

  constructor() {
    this.repo = AppDataSource.getRepository(MeasurementDAO);
    this.sensorRepo = new SensorRepository();
  }

  private validateDates(startDate?: string, endDate?: string): { startDateISO: string, endDateISO: string } {
    let startDateISO: string, endDateISO: string;

    if (!startDate) {
      startDateISO = new Date(0).toISOString(); // Start of time
    } else {
      // Validate ISO 8601 format
      try {
        startDateISO = new Date(startDate).toISOString();
      } catch (error) {
        throw new AppError("Invalid startDate format. Use ISO 8601", 400);
      }
    }

    if (!endDate) {
      endDateISO = new Date().toISOString(); // Current time
    } else {
      try {
        endDateISO = new Date(endDate).toISOString();
      } catch (error) {
        throw new AppError("Invalid endDate format. Use ISO 8601", 400);
      }
    }

    // Validate that startDate is before endDate
    if (startDateISO > endDateISO) {
      throw new AppError("startDate must be before endDate", 400);
    }

    return { startDateISO, endDateISO };
  }

  /*  ------ SET OF SENSORS IN A SPECIFIC NETWORK ----- */

  // [DONE]
  /* (1) Retreive measurements for a set of sensors of a specific network */
  async getMeasurementsFromSensorsInNetwork(
    networkCode: string,
    sensorMacs?: string[],
    startDate?: string,
    endDate?: string
  ): Promise<Measurements[]> {
    try {
      const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);

      // Validate Network Code
      validateNetworkCode(networkCode);

      // Get all sensors for the network if none specified
      let sensorMacsArray: string[] = [];
      if (!sensorMacs || sensorMacs.length === 0) {
        const sensors = await getAllSensorsInNetwork(networkCode);
        sensorMacsArray = sensors.map(s => s.macAddress);
      } else {
        sensorMacsArray = sensorMacs;
      }

      // Validate all sensor MACs
      sensorMacsArray.forEach(mac => validateSensorMac(mac));

      const measurements: MeasurementDAO[] = await this.repo
        .find({
          relations: {
            sensor: true
          },
          where: {
            sensor: {
              macAddress: In(sensorMacsArray)
            },
            createdAt: And(MoreThanOrEqual(startDateISO), LessThanOrEqual(endDateISO))
          }
        });

      // Group measurements by sensor
      const measurementsBySensor = new Map<string, MeasurementDAO[]>();
      measurements.forEach(m => {
        const sensorMac = m.sensor.macAddress;
        if (!measurementsBySensor.has(sensorMac)) {
          measurementsBySensor.set(sensorMac, []);
        }
        measurementsBySensor.get(sensorMac).push(m);
      });

      // Create Measurements object for each sensor
      const result: Measurements[] = [];
      for (const [sensorMac, sensorMeasurements] of measurementsBySensor) {
        const stats = await calculateStats(sensorMeasurements, startDateISO, endDateISO);
        
        // Fill "isOutlier" field in each measurement
        sensorMeasurements.forEach((m) => {
          m.isOutlier = m.value > stats.upperThreshold || m.value < stats.lowerThreshold;
        });

        // Convert to Measurement DTO
        const measurementsArray = sensorMeasurements.map(m => ({
          createdAt: new Date(m.createdAt),
          value: Number(m.value),
          isOutlier: Boolean(m.isOutlier)
        }));

        result.push({
          sensorMacAddress: sensorMac,
          stats: stats,
          measurements: measurementsArray
        });
      }

      // Handle sensors with no measurements
      for (const sensorMac of sensorMacsArray) {
        if (!measurementsBySensor.has(sensorMac)) {
          const emptyStats = await calculateStats([], startDateISO, endDateISO);
          result.push({
            sensorMacAddress: sensorMac,
            stats: emptyStats,
            measurements: []
          });
        }
      }

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in getMeasurementsFromSensorsInNetwork:', error);
      throw new AppError(`Failed to get measurements for network ${networkCode}: ${error.message}`, 500);
    }
  }

  // [DONE]
  /* (2) Retreive statistics for a set of sensors of a specific network */
  async getStatsFromSensorsInNetwork(
    networkCode: string,
    sensorMacs?: string[],
    startDate?: string,
    endDate?: string
  ): Promise<Stats[]> {
    const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);

    // Validation
    validateNetworkCode(networkCode);
  
    const sensorMeasurements: Measurements[] = await this.getMeasurementsFromSensorsInNetwork(networkCode, sensorMacs, startDateISO, endDateISO);
    const statsArray: Stats[] = sensorMeasurements.map( (m) => m.stats );

    return <Stats[]> statsArray;
  }

  // [DONE]
  /* (3) Retrieve outlier measurements for a set of sensors of a specific network */
  async getOutliersFromSensorsInNetwork(
    networkCode: string,
    sensorMacs?: string[],
    startDate?: string,
    endDate?: string
  ): Promise<Measurements[]> {
    const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);
  
    // Validate inputs
    validateNetworkCode(networkCode);
    sensorMacs.forEach((mac) => validateSensorMac(mac));

    let outlierMeasurementsArray: Measurements[] = [];

    sensorMacs.forEach( async (s) => {
      const currentSensorMeasurements: Measurements = await this.getMeasurementsFromSensor(networkCode, s, startDateISO, endDateISO);
      const outlierMeasurements: Measurement[] = currentSensorMeasurements.measurements.filter(m => m.isOutlier === true);

      const newSensorMeasurement: Measurements = {
        sensorMacAddress: s,
        stats: currentSensorMeasurements.stats,
        measurements: outlierMeasurements
      };

      outlierMeasurementsArray.push(newSensorMeasurement);
    });

    return <Measurements[]> outlierMeasurementsArray;
  }



  /*  ------ SPECIFIC SENSOR IN A SPECIFIC NETWORK ----- */

  // [DONE]
  /* (4) Store a measurement for a sensor */
  async storeMeasurementForSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string,
    createdAt: string, 
    value: number
  ) : Promise<void> {
    try {
      // Validation 
      validateNetworkCode(networkCode);
      validateGatewayMac(gatewayMac);
      validateSensorMac(sensorMac);

      // Get the sensor DAO and verify it exists
      const sensor = await this.sensorRepo.getSensorByMacAddress(sensorMac, gatewayMac);
      if (!sensor) {
        throw new AppError(`Sensor ${sensorMac} not found in gateway ${gatewayMac}`, 404);
      }

      // Create a new MeasurementDAO object
      const newMeasurementToInsert: MeasurementDAO = new MeasurementDAO();
      
      // Retrieve existing measurements for the sensor
      let oldSensorMeasurements: Measurements;
      try {
        oldSensorMeasurements = await this.getMeasurementsFromSensor(networkCode, gatewayMac, sensorMac);
      } catch (error) {
        // If no measurements exist yet, create an empty measurements object
        oldSensorMeasurements = {
          sensorMacAddress: sensorMac,
          stats: await calculateStats([], new Date(0).toISOString(), new Date().toISOString()),
          measurements: []
        };
      }
      
      // Create new sensor measurements to then calculate new statistics on it
      const newMeasurement = {
        createdAt: new Date(createdAt),
        value: value,
        isOutlier: false // Default value, will be updated before saving
      };

      const allMeasurements = [...oldSensorMeasurements.measurements, newMeasurement];

      // Calculate stats for all measurements
      const newStats: Stats = await calculateStats(
        allMeasurements,
        oldSensorMeasurements.stats?.startDate?.toISOString() || new Date(0).toISOString(),
        new Date().toISOString()
      );

      // Calculate and set isOutlier field based on new statistics
      const isOutlier = (value > newStats.upperThreshold || value < newStats.lowerThreshold);
      
      // Set all the required fields for the new measurement
      newMeasurementToInsert.code = sensorMac + "-" + new Date(createdAt).getTime(); // Unique code for the measurement
      newMeasurementToInsert.createdAt = createdAt;
      newMeasurementToInsert.value = value;
      newMeasurementToInsert.isOutlier = isOutlier;
      newMeasurementToInsert.sensor = sensor; // Set the sensor relationship

      // Save the measurement and wait for it to complete
      await this.repo.save(newMeasurementToInsert);
    } catch (error) {
      console.error('Error in storeMeasurementForSensor:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to store measurement: ${error.message}`, 500);
    }
  }

  // [DONE]
  /* (5) Retrieve measurements for a specific sensor */
  async getMeasurementsFromSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string, 
    startDate?: string,
    endDate?: string
  ): Promise<Measurements> {
    try {
      const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);

      // Validation 
      validateNetworkCode(networkCode);
      validateGatewayMac(gatewayMac);
      validateSensorMac(sensorMac);

      // Get the sensor DAO and verify it exists
      const sensor = await this.sensorRepo.getSensorByMacAddress(sensorMac, gatewayMac);
      if (!sensor) {
        throw new AppError(`Sensor ${sensorMac} not found in gateway ${gatewayMac}`, 404);
      }

      const measurements: MeasurementDAO[] = await this.repo
        .find({
          relations: {
            sensor: true
          },
          where: {
            sensor: {
              macAddress: sensorMac,
              gateway: { macAddress: gatewayMac }
            },
            createdAt: And(MoreThanOrEqual(startDateISO), LessThanOrEqual(endDateISO))
          }
        });

      // Calculate stats for the measurements
      const stats: Stats = await calculateStats(measurements, startDateISO, endDateISO);
      
      // Fill "isOutlier" field in each measurement
      measurements.forEach((m) => {
        m.isOutlier = m.value > stats.upperThreshold || m.value < stats.lowerThreshold;
      });

      // Convert measurements to DTOs
      const measurementsArray: Array<Measurement> = measurements.map(m => ({
        createdAt: new Date(m.createdAt), 
        value: Number(m.value),
        isOutlier: Boolean(m.isOutlier)
      }));

      return {
        sensorMacAddress: sensorMac,
        stats: stats,
        measurements: measurementsArray
      };
    } catch (error) {
      console.error('Error in getMeasurementsFromSensor:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to get measurements for sensor ${sensorMac}: ${error.message}`, 500);
    }
  }

  // [DONE]
  /* (6) Retreive statistics for a specific sensor */
  async getStatsFromSensor(
    networkCode: string,  
    gatewayMac: string,
    sensorMac: string,
    startDate?: string,
    endDate?: string
  ): Promise<Stats> {
    const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);

    // Validation
    validateNetworkCode(networkCode);
    validateGatewayMac(gatewayMac);
    validateSensorMac(sensorMac);

    const sensorMeasurements: Measurements = await this.getMeasurementsFromSensor(networkCode, gatewayMac, sensorMac, startDateISO, endDateISO);

    return <Stats> sensorMeasurements.stats;
  }

  // [DONE]
  /* (7) Retreive only outlier measurements  */
  async getOutliersFromSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string,
    startDate?: string,
    endDate?: string
  ): Promise<Measurements> {
    const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);
    
    const sensorMeasurements: Measurements = await this.getMeasurementsFromSensor(networkCode, gatewayMac, sensorMac, startDateISO, endDateISO);

    // Retreive only outlier measurements
    const outlierMeasurements: Measurement[] = sensorMeasurements.measurements.filter(m => m.isOutlier === true);

    return <Measurements> {
      sensorMacAddress: sensorMac,
      stats: sensorMeasurements.stats,
      measurements: outlierMeasurements
    };

  }

}
