import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { NetworkDAO } from "@dao/NetworkDAO";
import { GatewayType } from "@models/GatewayType";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { Network } from "inspector/promises";
import { runInNewContext } from "vm";
import { ConflictError } from "@models/errors/ConflictError";

export class NetworkRepository {
  private repo: Repository<NetworkDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(NetworkDAO);
  }

  /* Retrieve all networks */
  getAllNetworks(): Promise<NetworkDAO[]> {
    return this.repo.find();
  }

  // Create a new network
  async createNetwork(
    code: string,
    name: string,
    description: string,
    gateways: GatewayType
  ): Promise<NetworkDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { code } }),
      () => true,
      `Network with code '${code}' already exists`
    );

    return this.repo.save({
      code: code,
      name: name,
      description: description,
      gateways: gateways
    });
  }

  /* Retreive a specific network */
  async getNetworkByCode(code: string): Promise<NetworkDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { code } }),
      () => true,
      `Network with code '${code}' not found`
    );
  }

  /* Update a network (excluing nested objects) */
  async updateNetwork(
    code: string,
    newValues: {
      newCode?: string,
      newName?: string,
      newDescription?: string
    }
  ): Promise<NetworkDAO> {
    // Obtain existing network by code
    const targetNetwork = await this.getNetworkByCode(code);

    // Check if a network with the new code already exists
    if (newValues !== undefined && newValues.newCode !== undefined) {
      const allNetworks = await this.getAllNetworks();
      let networkCodes = [];
      allNetworks.forEach(net => {
        networkCodes.push(net.code);
      });

      if (targetNetwork.code in networkCodes) {
        throw new ConflictError(`Network ${targetNetwork.code} already exists!`);
      }

      // TODO: Find a way to simplify using this in some way? (need to convert allNetworks to array type)
      // throwConflictIfFound( 
      //   // await this.repo.findOne({ where: { code: newValues.newCode } }),
      //   allNetworks,
      //   () => true,
      //   `Network with code '${newValues.newCode}' already exists.`
      // );
    }

    // Update network fields
    if (newValues.newCode !== undefined) {
      targetNetwork.code = newValues.newCode;
    }

    if (newValues.newDescription !== undefined) {
      targetNetwork.name = newValues.newName;
    }

    if (newValues.newDescription !== undefined) {
      targetNetwork.description = newValues.newDescription;
    }

    // Save the updated network
    return this.repo.save(targetNetwork);
  }

  /* Delete a network */
  async deleteNetwork(code: string): Promise<void> {
    await this.repo.remove(await this.getNetworkByCode(code));
  }
}
