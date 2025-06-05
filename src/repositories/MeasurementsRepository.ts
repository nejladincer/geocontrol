import { AppDataSource } from "@database";
import { LessThanOrEqual, MoreThanOrEqual, Repository, And } from "typeorm";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { UserType } from "@models/UserType";
import { findOrThrowNotFound, throwConflictIfFound, verifyNetworkExists, verifyGatewayExists, verifySensorExists } from "@utils/utils";
import { Measurement } from "@models/dto/Measurement";
import { Measurements } from "@models/dto/Measurements";
import { Stats } from "@models/dto/Stats";
import { calculateStats } from "@utils/statsUtils";
import AppError from "@models/errors/AppError";
import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@models/dao/SensorDAO";
import { getAllSensorsInNetwork } from "@controllers/SensorController";

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
      return { startDateISO, endDateISO }; // Return the dates anyway, let the caller handle empty results
    }

    return { startDateISO, endDateISO };
  }

  /*  ------ SET OF SENSORS IN A SPECIFIC NETWORK ----- */

  /* (1) Retrieve measurements for a set of sensors of a specific network */
  async getMeasurementsFromSensorsInNetwork(
    networkCode: string,
    sensorMacs?: string[],
    startDate?: string,
    endDate?: string
  ): Promise<Measurements[]> {
    const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);

    // Verify network exists
    await verifyNetworkExists(networkCode);

    // If no sensor MACs are provided, get all sensors for the network
    if (!sensorMacs || sensorMacs.length === 0) {
      const allSensors = await getAllSensorsInNetwork(networkCode);
      sensorMacs = allSensors.map(sensor => sensor.macAddress);
    }

    const sensorRepository = AppDataSource.getRepository(SensorDAO);
    
    // Get all valid sensors first and skip those that don't exist in the network
    const validSensors: SensorDAO[] = [];
    for (const macAddress of sensorMacs) {
      const sensor = await sensorRepository.findOne({
        where: { macAddress: macAddress, gateway: { network: { code: networkCode } } },
        relations: ["gateway"]
      });
      if (sensor) {
        validSensors.push(sensor);
      }
    }

    // Now process only valid sensors
    const measurementsPromises = validSensors.map(sensor => 
      this.getMeasurementsFromSensor(
        networkCode,
        sensor.gatewayMac,
        sensor.macAddress,
        startDateISO,
        endDateISO
      )
    );

    return Promise.all(measurementsPromises);
  }

  /* (2) Retrieve statistics for a set of sensors of a specific network */
  async getStatsFromSensorsInNetwork(
    networkCode: string,
    sensorMacs?: string[],
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);

    // Verify network exists
    await verifyNetworkExists(networkCode);
    
    const sensorMeasurements: Measurements[] = await this.getMeasurementsFromSensorsInNetwork(networkCode, sensorMacs, startDateISO, endDateISO);
    
    return sensorMeasurements.map(m => ({
      sensorMacAddress: m.sensorMacAddress,
      stats: m.stats
    }));
  }

  /* (3) Retrieve outlier measurements for a set of sensors of a specific network */
  async getOutliersFromSensorsInNetwork(
    networkCode: string,
    sensorMacs?: string[],
    startDate?: string,
    endDate?: string
  ): Promise<Measurements[]> {
    const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);
  
    // Verify network exists
    await verifyNetworkExists(networkCode);

    // Retrieve measurements for the sensors in the network
    const sensorMeasurements: Measurements[] = await this.getMeasurementsFromSensorsInNetwork(networkCode, sensorMacs, startDateISO, endDateISO);
    // Filter out outliers
    const outlierMeasurementsArray: Measurements[] = sensorMeasurements.map((m) => {
      const outlierMeasurements: Measurement[] = m.measurements.filter(measurement => measurement.isOutlier === true);
      return {
        sensorMacAddress: m.sensorMacAddress,
        stats: m.stats,
        measurements: outlierMeasurements
      };
    }); 

    return outlierMeasurementsArray as Measurements[];
  }

  /*  ------ SPECIFIC SENSOR IN A SPECIFIC NETWORK ----- */

  /* (4) Store a measurement for a sensor */
  async storeMeasurementForSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string,
    createdAt: string, 
    value: number
  ): Promise<void> {
    // Check sensor, and all relationships, exist
    const sensor = await verifySensorExists(sensorMac, gatewayMac, networkCode);
    
    // Create a new MeasurementDAO object
    const newMeasurementToInsert: MeasurementDAO = new MeasurementDAO();

    // Create new sensor measurements to then calculate new statistics on it
    const newSensorMeasurements: Measurements = {
      sensorMacAddress: sensorMac,
      stats: { startDate: new Date(0), endDate: new Date(), mean: 0, variance: 0, upperThreshold: 0, lowerThreshold: 0 },
      measurements: [{
        createdAt: new Date(createdAt),
        value: value,
        isOutlier: false // Default value
      }]
    };

    newMeasurementToInsert.code = sensorMac + "-" + new Date(createdAt).getTime();
    newMeasurementToInsert.createdAt = createdAt;
    newMeasurementToInsert.value = value;
    newMeasurementToInsert.isOutlier = null;
    newMeasurementToInsert.sensorMacAddress = sensorMac; 
    newMeasurementToInsert.sensor = sensor; 

    await this.repo.save(newMeasurementToInsert);
  }

  /* (5) Retrieve measurements for a specific sensor */
  async getMeasurementsFromSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string, 
    startDate?: string,
    endDate?: string
  ): Promise<Measurements> {
    const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);

    // Verify that the sensor exists
    await verifySensorExists(sensorMac, gatewayMac, networkCode);

    const measurements: MeasurementDAO[] = await this.repo
    .find({
      // Join via "sensor" attribute with "measurements" table
      relations: {
        sensor: true
      },

      where: {
        sensorMacAddress: sensorMac,
        createdAt: And(MoreThanOrEqual(startDateISO), LessThanOrEqual(endDateISO))
      },

      select: {
        code: true,
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

    return {
      sensorMacAddress: sensorMac,
      stats: stats,
      measurements: measurementsArray
    } as Measurements;
  }

  /* (6) Retreive statistics for a specific sensor */
  async getStatsFromSensor(
    networkCode: string,  
    gatewayMac: string,
    sensorMac: string,
    startDate?: string,
    endDate?: string
  ): Promise<Stats> {
    const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);

    await verifySensorExists(sensorMac, gatewayMac, networkCode);

    const sensorMeasurements: Measurements = await this.getMeasurementsFromSensor(networkCode, gatewayMac, sensorMac, startDateISO, endDateISO);

    return sensorMeasurements.stats as Stats;
  }

  /* (7) Retreive only outlier measurements  */
  async getOutliersFromSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string,
    startDate?: string,
    endDate?: string
  ): Promise<Measurements> {
    const { startDateISO, endDateISO } = this.validateDates(startDate, endDate);
    
    await verifySensorExists(sensorMac, gatewayMac, networkCode);
    
    const sensorMeasurements: Measurements = await this.getMeasurementsFromSensor(networkCode, gatewayMac, sensorMac, startDateISO, endDateISO);

    // Retreive only outlier measurements
    const outlierMeasurements: Measurement[] = sensorMeasurements.measurements.filter(m => m.isOutlier === true);

    return {
      sensorMacAddress: sensorMac,
      stats: sensorMeasurements.stats,
      measurements: outlierMeasurements
    } as Measurements;
  }
}
