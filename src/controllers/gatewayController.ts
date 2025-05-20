import { Gateway as GatewayDTO } from "@dto/Gateway";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { mapGatewayDAOToDTO } from "@services/mapperService";
import { AppDataSource } from "@database";
import { NetworkDAO } from "@dao/NetworkDAO";
import AppError from "@models/errors/AppError";
import { EntityNotFoundError } from "typeorm";

export async function getAllGateways(networkCode: string): Promise<GatewayDTO[]> {
  const gatewayRepo = new GatewayRepository();
  return (await gatewayRepo.getAllGatewaysInNetwork(networkCode)).map(mapGatewayDAOToDTO);
}

export async function getGateway(macAddress: string, networkCode: string): Promise<GatewayDTO> {
  const gatewayRepo = new GatewayRepository();
  return mapGatewayDAOToDTO(await gatewayRepo.getGatewayByMacAddress(macAddress, networkCode));
}

export async function createGateway(gatewayDto: GatewayDTO, networkCode: string): Promise<void> {
  const gatewayRepo = new GatewayRepository();
  const networkRepo = new NetworkRepository();
  
  try {
    const network = await networkRepo.getNetworkByCode(networkCode);
    await gatewayRepo.createGateway(gatewayDto.macAddress, gatewayDto.name, gatewayDto.description, network);
  } catch (error) {
    if (error instanceof AppError && error.message.includes('not found')) {
      throw new AppError(`Network with code '${networkCode}' not found`, 404);
    }
    throw new AppError("Failed to create gateway", 500);
  }
}

export async function deleteGateway(macAddress: string, networkCode: string): Promise<void> {
  const gatewayRepo = new GatewayRepository();
  await gatewayRepo.deleteGateway(macAddress, networkCode);
}

export async function updateGateway(macAddress: string, networkCode: string, newValues: { newMacAddress?: string, newName?: string, newDescription?: string }): Promise<void> {
  const gatewayRepo = new GatewayRepository();
  await gatewayRepo.updateGateway(macAddress, networkCode, newValues);
}
