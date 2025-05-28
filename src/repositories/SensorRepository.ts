import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "utils/utils";

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
    updates: Partial<Omit<SensorDAO, "gateway" | "macAddress">>
  ): Promise<SensorDAO> {
    const sensor = await this.getSensorByMacAddress(macAddress, gatewayMac);

    if (updates.name !== undefined) sensor.name = updates.name;
    if (updates.description !== undefined) sensor.description = updates.description;
    if (updates.variable !== undefined) sensor.variable = updates.variable;
    if (updates.unit !== undefined) sensor.unit = updates.unit;

    return this.repo.save(sensor);
  }

  async deleteSensor(macAddress: string, gatewayMac: string): Promise<void> {
    const sensor = await this.getSensorByMacAddress(macAddress, gatewayMac);
    await this.repo.remove(sensor);
  }
}
