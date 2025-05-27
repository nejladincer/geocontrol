import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { UserType } from "@models/UserType";
import { findOrThrowNotFound, throwConflictIfFound } from "utils/utils";
import { stringToISO } from "utils/dateUtils";
import { get } from "http";
import { getNetwork } from "@controllers/networkController";
import { getAllGateways, getGateway } from "@controllers/gatewayController";
import { stat } from "fs"; 
import { measureMemory } from "vm";
import { getAllSensors, getAllSensorsInNetwork, getSensor } from "@controllers/SensorController";
import { Measurement, MeasurementToJSON } from "@models/dto/Measurement";
import { Measurements } from "@models/dto/Measurements";
import { validateNetworkCode, validateGatewayMac, validateSensorMac } from "utils/utils";
import { Stats } from "@models/dto/Stats";
import { calculateStats } from "utils/statsUtils";
import { Sensor } from "@models/dto/Sensor";

export class MeasurementsRepository {
  private repo: Repository<MeasurementDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(MeasurementDAO);
  }

  /*  ------ SET OF SENSORS IN A SPECIFIC NETWORK ----- */

  // DONE
  /* (1) Retreive measurements for a set of sensors of a specific network */
  async getMeasurementsFromSensorsInNetwork(
    networkCode: string,
    sensorMacs?: string[],
    startDate?: string,
    endDate?: string
  ): Promise<Measurements[]> {
    
    let sensorMacsArray: string[] = [];
    if (!sensorMacs || sensorMacs.length === 0) {
      // If no sensor MACs are provided, get all sensors for the network
      sensorMacsArray =  (await getAllSensorsInNetwork(networkCode)).map(s => s.macAddress);
    }
   
    // TODO: Move dates validation here instead of ...FromSensor()
    let measurementsArray: Measurements[] = [];
    sensorMacs.forEach( async (m) => {
      measurementsArray.push( await this.getMeasurementsFromSensor(networkCode, m, startDate, endDate) ); 
    });

   return measurementsArray;
  }

  // TODO:
  /* (2) Retreive statistics for a set of sensors of a specific network */
  async getStatsFromSensorsInNetwork(
    networkCode: string,
    sensorMacs?: string[],
    startDate?: string,
    endDate?: string
  ): Promise<Stats[]> {

    validateNetworkCode(networkCode);
  

  }

  // TODO:
  /* (3) Retrieve outlier measurements for a set of sensors of a specific network */
  async getOutliersFromSensorsInNetwork(
    networkCode: string,
    sensorMacs?: string[],
    startDate?: string,
    endDate?: string
  ): Promise<Measurements[]> {
  
    validateNetworkCode(networkCode);


  }



  /*  ------ SPECIFIC SENSOR IN A SPECIFIC NETWORK ----- */

  // TODO:
  /* (4) Store a measurement for a sensor */
  async storeMeasurementForSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string,
  ) : Promise<void> {


  }

  // DONE
  /* (5) Retrieve measurements for a specific sensor */
  async getMeasurementsFromSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string, 
    startDate?: string,
    endDate?: string
  ): Promise<Measurements> {

    // Validate Network Code, and if exists, get the network
    validateNetworkCode(networkCode);
    const network = await getNetwork(networkCode);

    // Validate Gateway MAC Address, and if exists, get the gateway 
    validateGatewayMac(gatewayMac);
    const gateway = await getGateway(gatewayMac, networkCode);

    // Validate Sensor MAC Address, and if exists, get the sensor
    validateSensorMac(sensorMac);
    const sensor = await getSensor(sensorMac, gatewayMac, networkCode);

    // Get sensor measurements from DAO (join with measurements table) TODO: Rivedere l'attributo del join
    const measurements = await this.repo
    .createQueryBuilder("m")                                  // FROM (measurements AS M)
    .innerJoinAndSelect("m.sensor", "s")                      // INNER JOIN (sensors AS S) ON M.sensor = S.measurements
    .where('m.createdAt >= :startDate', { startDate })        // WHERE M.createdAt >= startDate 
    .andWhere('m.createdAt <= :endDate', { endDate })         // AND M.createdAt <= endDate
    .andWhere('m.macAddress = :sensorMac', { sensorMac })
    .select(["m.createdAt", "m.value", "m.isOutlier"])        // SELECT M.*
    .getRawMany();
    
    // Calculate stats and save them in the repo too
    const stats = calculateStats(measurements, startDate, endDate);
    
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
      createdAt: new Date(m.m_createdAt), // Note: raw query returns with m_ prefix
      value: Number(m.m_value),
      isOutlier: Boolean(m.m_isOutlier)
    }));

    return <Measurements>{
      sensorMacAddress: sensorMac,
      stats: stats,
      measurements: measurementsArray
    };

  }

  // TODO:
  /* (6) Retreive statitics for a specific sensor */
  async getStatsFromSensor(
    networkCode: string,  
    gatewayMac: string,
    sensorMac: string,
    startDate?: string,
    endDate?: string
  ): Promise<Stats> {



  }

  /* (7) Retreive only outlier measurements  */


  


}
