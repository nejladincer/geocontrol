import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { NetworkDAO } from "@dao/NetworkDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils/utils";
import { NotFoundError } from "@errors/NotFoundError";
import { ConflictError } from "@errors/ConflictError";

export class NetworkRepository {
  private repo: Repository<NetworkDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(NetworkDAO);
  }

  getAllNetworks(): Promise<NetworkDAO[]> {
    return this.repo.find({
      relations: {
        gateways: true
      }
    });
  }

  async getNetworkByCode(code: string): Promise<NetworkDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ 
        where: { code }, 
        relations: {
          gateways: true
        }
      }),
      () => true,
      `Network with code '${code}' not found`
    );
  }

  async createNetwork(
    code: string,
    name: string,
    description: string
  ): Promise<NetworkDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { code } }),
      () => true,
      `Network with code '${code}' already exists`
    );

    return this.repo.save({
      code: code,
      name: name,
      description: description
    });
  }

  async updateNetwork(
    code: string,
    newCode: string, 
    newName: string,
    newDescription: string 
  ): Promise<NetworkDAO> {
    // First, check if the network we're updating exists with all relations
    const network = await this.repo.findOne({
      where: { code },
      relations: ['gateways', 'gateways.sensors', 'gateways.sensors.measurements']
    });
    
    if (!network) {
      throw new NotFoundError(`Network with code '${code}' not found`);
    }

    // Check if we're updating just name or also the code
    if (newCode === code) {
      network.name = newName;
      network.description = newDescription; 
      return this.repo.save(network);
    } else {
      // Check if the new code already exists
      const existingNetwork = await this.repo.findOne({ where: { code: newCode } });
      if (existingNetwork) {
        throw new ConflictError(`Network with code '${newCode}' already exists`);
      }
      
      const networkRepo = AppDataSource.getRepository(NetworkDAO);
      const gatewayRepo = AppDataSource.getRepository(GatewayDAO);
      
      // Create a new network with the new code
      const newNetwork = networkRepo.create({
        code: newCode,
        name: newName,
        description: newDescription
      });
      
      // Save the new network
      await networkRepo.save(newNetwork);
      
      // Update all gateways to reference the new network
      if (network.gateways && network.gateways.length > 0) {
        for (const gateway of network.gateways) {
          gateway.network = newNetwork;
          gateway.networkCode = newCode;
          await gatewayRepo.save(gateway);
        }
      }
      
      // Delete the old network
      await networkRepo.delete({ code });
      
      // Return the newly created network with all its relationships
      const result = await networkRepo.findOne({
        where: { code: newCode },
        relations: ['gateways', 'gateways.sensors']
      });
      
      if (!result) {
        throw new NotFoundError(`Failed to retrieve updated network`);
      }
      
      return result;
    }
  }

  async deleteNetwork(code: string): Promise<void> {
    const networkRepo = AppDataSource.getRepository(NetworkDAO);
    const gatewayRepo = AppDataSource.getRepository(GatewayDAO);
    const sensorRepo = AppDataSource.getRepository(SensorDAO);
    const measurementRepo = AppDataSource.getRepository(MeasurementDAO);
    
    // Find the network to verify it exists
    const network = await networkRepo.findOne({
      where: { code },
      relations: ['gateways', 'gateways.sensors']
    });
    
    if (!network) {
      throw new NotFoundError(`Network with code '${code}' not found`);
    }
    
    // For each gateway and its sensors, delete the measurements
    if (network.gateways) {
      for (const gateway of network.gateways) {
        if (gateway.sensors) {
          for (const sensor of gateway.sensors) {
            await measurementRepo.delete({ sensorMacAddress: sensor.macAddress });
          }
          
          // Delete all sensors belonging to this gateway
          await sensorRepo.delete({ gatewayMac: gateway.macAddress });
        }
      }
      
      // Delete all gateways belonging to this network
      await gatewayRepo.delete({ networkCode: code });
    }
    
    // Finally delete the network
    await networkRepo.delete({ code });
  }
}