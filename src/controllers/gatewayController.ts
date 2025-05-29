import { Gateway as GatewayDTO } from "@dto/Gateway";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { mapGatewayDAOToDTO } from "@services/mappings/gatewayMapperService";
import AppError from "@models/errors/AppError";

export async function getAllGateways(networkCode: string): Promise<GatewayDTO[]> {
  try {
    const gatewayRepo = new GatewayRepository();
    return (await gatewayRepo.getAllGatewaysInNetwork(networkCode)).map(mapGatewayDAOToDTO);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Network with code")) {
      throw new AppError(error.message, 404);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getGateway(macAddress: string, networkCode: string): Promise<GatewayDTO> {
  try {
    const gatewayRepo = new GatewayRepository();
    return mapGatewayDAOToDTO(await gatewayRepo.getGatewayByMacAddress(macAddress, networkCode));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Network with code")) {
        throw new AppError(error.message, 404);
      }
      if (error.message.includes("Gateway with macAddress")) {
        throw new AppError(error.message, 404);
      }
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function createGateway(gatewayDto: GatewayDTO, networkCode: string): Promise<void> {
  if (!gatewayDto.macAddress) {
    throw new AppError("MAC address is required", 400);
  }

  try {
    const gatewayRepo = new GatewayRepository();
    await gatewayRepo.createGateway(
      gatewayDto.macAddress,
      gatewayDto.name,
      gatewayDto.description,
      networkCode
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Network with code")) {
        throw new AppError(error.message, 404);
      }
      if (error.message.includes("already exists")) {
        throw new AppError(error.message, 409);
      }
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function deleteGateway(macAddress: string, networkCode: string): Promise<void> {
  try {
    const gatewayRepo = new GatewayRepository();
    await gatewayRepo.deleteGateway(macAddress, networkCode);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Network with code")) {
        throw new AppError(error.message, 404);
      }
      if (error.message.includes("Gateway with macAddress")) {
        throw new AppError(error.message, 404);
      }
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function updateGateway(
  macAddress: string,
  networkCode: string,
  newValues: { newMacAddress?: string; newName?: string; newDescription?: string }
): Promise<void> {
  try {
    const gatewayRepo = new GatewayRepository();
    await gatewayRepo.updateGateway(macAddress, networkCode, newValues);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Network with code")) {
        throw new AppError(error.message, 404);
      }
      if (error.message.includes("Gateway with macAddress") && error.message.includes("not found")) {
        throw new AppError(error.message, 404);
      }
      if (error.message.includes("already exists")) {
        throw new AppError(error.message, 409);
      }
    }
    throw new AppError("Internal server error", 500);
  }
}