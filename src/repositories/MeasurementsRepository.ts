import { AppDataSource } from "@database";
import { LessThanOrEqual, MoreThanOrEqual, Repository, And } from "typeorm";
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

export class MeasurementsRepository {
  private repo: Repository<MeasurementDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(MeasurementDAO);
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
    const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);

    let sensorMacsArray: string[] = [];
    if (!sensorMacs || sensorMacs.length === 0) {
      // If no sensor MACs are provided, get all sensors for the network
      sensorMacsArray =  (await getAllSensorsInNetwork(networkCode)).map(s => s.macAddress);
    }
   
    let measurementsArray: Measurements[] = [];
    sensorMacs.forEach( async (m) => {
      measurementsArray.push( await this.getMeasurementsFromSensor(networkCode, m, startDateISO, endDateISO) ); 
    });

   return <Measurements[]> measurementsArray;
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

    // Validation 
    validateNetworkCode(networkCode);
    validateGatewayMac(gatewayMac);
    validateSensorMac(sensorMac);

    // Create a new MeasurementDAO object
    const newMeasurementToInsert: MeasurementDAO = new MeasurementDAO();
    
    const sensor = await getSensor(networkCode, gatewayMac, sensorMac);
    
    // Retrieve existing measurements for the sensor
    const oldSensorMeasurements: Measurements = await this.getMeasurementsFromSensor(networkCode, gatewayMac, sensorMac);
    
    // Create new sensor measurements to then calculate new statistics on it
    const newSensorMeasurements: Measurements = {
      sensorMacAddress: sensorMac,
      stats: oldSensorMeasurements.stats,
      measurements: [...oldSensorMeasurements.measurements, {
        createdAt: new Date(createdAt),
        value: value,
        isOutlier: false // Default value, will be updated before saving
      }]
    };

    // Calculate stats for the new measurements 
    const newStats: Stats = await calculateStats(newSensorMeasurements.measurements, oldSensorMeasurements.stats.startDate.toISOString(), oldSensorMeasurements.stats.endDate.toISOString());

    // Calculate and set isOutlier field based on new statistics
    const isOutlier = (value > newStats.upperThreshold || value < newStats.lowerThreshold);
    newSensorMeasurements.measurements[newSensorMeasurements.measurements.length - 1].isOutlier = isOutlier;
    
    newMeasurementToInsert.code = sensorMac + "-" + new Date(createdAt).getTime(); // Unique code for the measurement
    newMeasurementToInsert.createdAt = createdAt;
    newMeasurementToInsert.value = value;
    newMeasurementToInsert.isOutlier = isOutlier; // Store the calculated isOutlier value in the DAO

    this.repo.save(newMeasurementToInsert);
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
    const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);

    // Validate Network Code, and if exists, get the network
    validateNetworkCode(networkCode);

    // Validate Gateway MAC Address, and if exists, get the gateway 
    validateGatewayMac(gatewayMac);

    // Validate Sensor MAC Address, and if exists, get the sensor
    validateSensorMac(sensorMac);

    const measurements: MeasurementDAO[] = await this.repo
    .find({
      // Join via "sensor" attribute with "measurements" table
      relations: {
        sensor: true
      },

      where: {
        createdAt: And(MoreThanOrEqual(startDateISO), LessThanOrEqual(endDateISO))
      },

      select: {
        createdAt: true,
        value: true,
        isOutlier: true
      }
    });

    // Calculate stats and save them in the repo too
    const stats: Stats = await calculateStats(measurements, startDateISO, endDateISO);
    
    // Fill "isOutlier" field in each measurement
    measurements.forEach((m) => {
      if (m.value > stats.upperThreshold || m.value < stats.lowerThreshold) {
        m.isOutlier = true;
      }
      else {
        m.isOutlier = false;
      }
    });

    // Convert "raw" measurements to Measurement DTO
    const measurementsArray: Array<Measurement> = measurements.map(m => ({
      createdAt: new Date(m.createdAt), 
      value: Number(m.value),
      isOutlier: Boolean(m.isOutlier)
    }));

    return <Measurements> {
      sensorMacAddress: sensorMac,
      stats: stats,
      measurements: measurementsArray
    };

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
