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
import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@models/dao/SensorDAO";
import { GatewayRepository } from "./GatewayRepository";
import { log } from "console";

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

    // If no sensor MACs are provided, get all sensors for the network
    if (!sensorMacs || sensorMacs.length === 0) {
      const allSensors = await getAllSensorsInNetwork(networkCode);
      sensorMacs = allSensors.map(sensor => sensor.macAddress);
    }

    const sensorRepository = AppDataSource.getRepository(SensorDAO);
    const measurementsPromises = sensorMacs.map(async (macAddress) => {
      const targetSensor = await sensorRepository.findOne({
        where: { macAddress: macAddress, gateway: { network: { code: networkCode } } },
        relations: ["gateway"]
      });

      if (!targetSensor) {
        throw new AppError(`Sensor with MAC ${macAddress} not found in network ${networkCode}`, 404);
      }

      return this.getMeasurementsFromSensor(
        networkCode,
        targetSensor.gatewayMac,
        targetSensor.macAddress,
        startDateISO,
        endDateISO
      );
    });

    return Promise.all(measurementsPromises);
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

    // Retrieve measurements for the sensors in the network
    const sensorMeasurements: Measurements[] = await this.getMeasurementsFromSensorsInNetwork(networkCode, sensorMacs, startDateISO, endDateISO);
    // Filter out the measurements that are outliers
    const outlierMeasurementsArray: Measurements[] = sensorMeasurements.map((m) => {
      const outlierMeasurements: Measurement[] = m.measurements.filter(measurement => measurement.isOutlier === true);
      return {
        sensorMacAddress: m.sensorMacAddress,
        stats: m.stats,
        measurements: outlierMeasurements
      };
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
  ): Promise<void> {
    // Validation
    validateNetworkCode(networkCode);
    validateGatewayMac(gatewayMac);
    validateSensorMac(sensorMac);

    // Retrieve the sensor to ensure it exists and set the foreign key relationship
    const sensorRepo = new SensorRepository();
    const sensor = await sensorRepo.getSensorByMacAddress(sensorMac, gatewayMac);
    
    // Create a new MeasurementDAO object
    const newMeasurementToInsert: MeasurementDAO = new MeasurementDAO();

    // Create new sensor measurements to then calculate new statistics on it
    const newSensorMeasurements: Measurements = {
      sensorMacAddress: sensorMac,
      stats: { startDate: new Date(0), endDate: new Date(), mean: 0, variance: 0, upperThreshold: 0, lowerThreshold: 0 },
      measurements: [{
        createdAt: new Date(createdAt),
        value: value,
        isOutlier: false // Default value, will be updated before saving
      }]
    };

    newMeasurementToInsert.code = sensorMac + "-" + new Date(createdAt).getTime(); // Unique code for the measurement
    newMeasurementToInsert.createdAt = createdAt;
    newMeasurementToInsert.value = value; // Set the value field
    newMeasurementToInsert.isOutlier = null; // Store the calculated isOutlier value in the DAO
    newMeasurementToInsert.sensorMacAddress = sensorMac; // Ensure sensorMacAddress is set
    newMeasurementToInsert.sensor = sensor; // Set the sensor relationship

    await this.repo.save(newMeasurementToInsert);
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
