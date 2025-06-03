import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { GatewayDAO } from "@dao/GatewayDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils/utils";
import { NetworkDAO } from "@dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { SensorDAO } from "@models/dao/SensorDAO";

export class GatewayRepository {
  private repo: Repository<GatewayDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(GatewayDAO);
  }

  async getAllGatewaysInNetwork(code: string): Promise<GatewayDAO[]> {
    const network = await AppDataSource.getRepository(NetworkDAO).findOne({
      where: { code }
    });

    if (!network) {
      throw new Error(`Network with code '${code}' not found`);
    }

    return this.repo.find({
      where: { network: { code } },
      relations: ['network']
    });
  }

  async getGatewayByMacAddress(macAddress: string, networkCode: string): Promise<GatewayDAO> {
    const gateway = await this.repo.findOne({ 
      where: { macAddress, networkCode },
      relations: ['network', 'sensors']
    });
    return findOrThrowNotFound(
      gateway ? [gateway] : [],
      (g) => g !== null, 
      `Gateway with macAddress '${macAddress}' not found`
    );
  }

  async createGateway(
    macAddress: string,
    name: string,
    description: string,
    networkCode: string
  ): Promise<GatewayDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Gateway with macAddress '${macAddress}' already exists`
    );

    return this.repo.save({
      macAddress: macAddress,
      name: name,
      description: description,
      network: { code: networkCode }
    });
  }

  async deleteGateway(macAddress: string, networkCode: string): Promise<void> {
    await this.repo.remove(await this.getGatewayByMacAddress(macAddress, networkCode));
  }

  async updateGateway(
    macAddress: string,
    networkCode: string,
    newValues: {
      newMacAddress?: string,
      newName?: string,
      newDescription?: string
    }
  ): Promise<GatewayDAO> {
    const targetGateway = await this.getGatewayByMacAddress(macAddress, networkCode);
  
    if (newValues.newMacAddress && newValues.newMacAddress !== macAddress) {
      const existing = await this.repo.find({ where: { macAddress: newValues.newMacAddress } });
  
      if (existing.length > 0) {
        throw new ConflictError(`Gateway with macAddress '${newValues.newMacAddress}' already exists`);
      }
  
      const newGateway = this.repo.create({
        macAddress: newValues.newMacAddress,
        name: newValues.newName !== undefined ? newValues.newName : targetGateway.name,
        description: newValues.newDescription !== undefined ? newValues.newDescription : targetGateway.description,
        networkCode: targetGateway.networkCode,
      });
  
   
      await this.repo.save(newGateway);

      if (targetGateway.sensors && targetGateway.sensors.length > 0) {
        const sensorRepo = this.repo.manager.getRepository(SensorDAO);
        for (const sensor of targetGateway.sensors) {
          sensor.gateway = newGateway; 
          await sensorRepo.save(sensor);
        }
      }
  
      await this.repo.delete({ macAddress, networkCode });
  
      return newGateway;
    }
  
    if (newValues.newName !== undefined) {
      targetGateway.name = newValues.newName;
    }
  
    if (newValues.newDescription !== undefined) {
      targetGateway.description = newValues.newDescription;
    }
  
    return this.repo.save(targetGateway);
  }
}

