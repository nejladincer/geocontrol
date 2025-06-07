import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils/utils";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { MeasurementDAO } from "@dao/MeasurementDAO";

export class SensorRepository {
  private repo: Repository<SensorDAO>;
  private gatewayRepo: Repository<GatewayDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(SensorDAO);
    this.gatewayRepo = AppDataSource.getRepository(GatewayDAO);
  }


  async getAllSensorsInNetwork(networkCode: string): Promise<SensorDAO[]> {
    // SELECT S.*
    // FROM (sensors AS S) 
    // INNER JOIN (gateways AS G) ON S.gateway = G.sensors
    // INNER JOIN (networks AS N) ON G.network = N.gateways
    // WHERE N.code = networkCode

    return this.repo
    .createQueryBuilder("s")
    .innerJoinAndSelect("s.gateway", "g")
    .innerJoinAndSelect("g.network", "n")
    .where("n.code = :networkCode", { networkCode })
    .getMany();
  }

  async getAllSensorsInGateway(gatewayMac: string): Promise<SensorDAO[]> {
    return this.repo
      .createQueryBuilder("sensor")
      .leftJoinAndSelect("sensor.gateway", "gateway")
      .where("gateway.macAddress = :gatewayMac", { gatewayMac })
      .getMany();
  }

  async getSensorByMacAddress(macAddress: string, gatewayMac: string): Promise<SensorDAO> {
    return findOrThrowNotFound(
      await this.repo.find({
        where: { macAddress, gateway: { macAddress: gatewayMac } },
        relations: ["gateway"]
      }),
      () => true,
      `Sensor with macAddress '${macAddress}' not found`
    );
  }

  async createSensor(
    macAddress: string,
    name: string,
    description: string,
    variable: string,
    unit: string,
    gatewayMac: string
  ): Promise<SensorDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Sensor with macAddress '${macAddress}' already exists`
    );

    const gateway = await this.gatewayRepo.findOne({
      where: { macAddress: gatewayMac }
    });

    if (!gateway) throw new Error(`Gateway with macAddress '${gatewayMac}' not found`);

    const sensor = this.repo.create({
      macAddress,
      name,
      description,
      variable,
      unit,
      gateway
    });

    return this.repo.save(sensor);
  }

  async updateSensor(
  macAddress: string,
  gatewayMac: string,
  updates: Partial<SensorDAO>
): Promise<SensorDAO> {
const oldSensor = await this.repo.findOne({
  where: {
    macAddress,
    gateway: { macAddress: gatewayMac },
  },
  relations: ["gateway", "measurements"],
});

if (!oldSensor) {
  throw new NotFoundError(`Sensor with macAddress '${macAddress}' not found`);
}

  // If macAddress is NOT being changed, proceed normally
  if (!updates.macAddress || updates.macAddress === macAddress) {
    if (updates.name !== undefined) oldSensor.name = updates.name;
    if (updates.description !== undefined) oldSensor.description = updates.description;
    if (updates.variable !== undefined) oldSensor.variable = updates.variable;
    if (updates.unit !== undefined) oldSensor.unit = updates.unit;
    return this.repo.save(oldSensor);
  }

  // If macAddress IS changing, perform a "migration"
  const newMac = updates.macAddress;

  // Check for conflict
  const existing = await this.repo.findOneBy({ macAddress: newMac });
  if (existing) {
    throw new ConflictError(`Sensor with macAddress '${newMac}' already exists`);
  }

  const newSensor = this.repo.create({
    macAddress: newMac,
    name: updates.name ?? oldSensor.name,
    description: updates.description ?? oldSensor.description,
    variable: updates.variable ?? oldSensor.variable,
    unit: updates.unit ?? oldSensor.unit,
    gateway: oldSensor.gateway,
    gatewayMac: oldSensor.gatewayMac,
    measurements: oldSensor.measurements,
  });

  await this.repo.save(newSensor);
  await this.repo.remove(oldSensor); // Remove old sensor with old MAC

  return newSensor;
}



  async deleteSensor(macAddress: string, gatewayMac: string, networkCode: string): Promise<void> {
    const sensorRepo = AppDataSource.getRepository(SensorDAO);
    const measurementRepo = AppDataSource.getRepository(MeasurementDAO);
    
    // Find the sensor to verify it exists
    const sensor = await sensorRepo.findOne({
      where: { 
        macAddress, 
        gatewayMac 
      }
    });
    
    if (!sensor) {
      throw new NotFoundError(`Sensor with macAddress '${macAddress}' not found`);
    }
    
    // First delete all measurements belonging to this sensor
    await measurementRepo.delete({ sensorMacAddress: macAddress });
    
    // Then delete the sensor itself
    await sensorRepo.delete({ macAddress, gatewayMac });
  }
}
