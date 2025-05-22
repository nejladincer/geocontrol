import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { GatewayDAO } from "@dao/GatewayDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { NetworkDAO } from "@dao/NetworkDAO";
//import { SensorDAO } from "@dao/SensorDAO"; //TODO: SensorDAO will be created
import { ConflictError } from "@models/errors/ConflictError";

export class GatewayRepository {
  private repo: Repository<GatewayDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(GatewayDAO);
  }

  async getAllGatewaysInNetwork(code: string): Promise<GatewayDAO[]> {
    // First check if network exists
    const network = await AppDataSource.getRepository(NetworkDAO).findOne({
      where: { code }
    });

    if (!network) {
      throw new Error(`Network with code '${code}' not found`);
    }

    return this.repo.find({
      where: { network: { code } },
    });
  }

  async getGatewayByMacAddress(macAddress: string, networkCode: string): Promise<GatewayDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { macAddress, network: { code: networkCode } } }),
      () => true,
      `Gateway with macAddress '${macAddress}' not found`
    );
  }

  async createGateway(
    macAddress: string,
    name: string,
    description: string,
    //sensors: SensorDAO[],
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
      //sensors: sensors,
      networkCode: networkCode
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
    }): Promise<GatewayDAO> {
      // Obtain existing gateway by macAddress
    const targetGateway = await this.getGatewayByMacAddress(macAddress, networkCode);
  
    if (newValues.newMacAddress && newValues.newMacAddress !== macAddress) {
      const existing = await this.repo.findOne({ where: { macAddress: newValues.newMacAddress } });
  
      if (existing) {
        throw new ConflictError(`Gateway with macAddress '${newValues.newMacAddress}' already exists`);
      }
  
      targetGateway.macAddress = newValues.newMacAddress;
    }
  
    // Update other fields if provided
    if (newValues.newName !== undefined) {
      targetGateway.name = newValues.newName;
    }
  
    if (newValues.newDescription !== undefined) {
      targetGateway.description = newValues.newDescription;
    }
  
    // Save the updated gateway
    return this.repo.save(targetGateway);
  }
}

