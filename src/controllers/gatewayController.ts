import { Gateway as GatewayDTO } from "@dto/Gateway";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { mapGatewayDAOToDTO } from "@services/mappings/gatewayMapperService";
import AppError from "@models/errors/AppError";
import { NotFoundError } from "@errors/NotFoundError";
import { BadRequestError } from "@errors/BadRequestError";
import { ConflictError } from "@errors/ConflictError";

export async function getAllGateways(networkCode: string): Promise<GatewayDTO[]> {
  try {
    const gatewayRepo = new GatewayRepository();
    return (await gatewayRepo.getAllGatewaysInNetwork(networkCode)).map(mapGatewayDAOToDTO);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Network with code")) {
      throw new NotFoundError(error.message);
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
        throw new NotFoundError(error.message);
      }
      if (error.message.includes("Gateway with macAddress")) {
        throw new NotFoundError(error.message);
      }
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function createGateway(gatewayDto: GatewayDTO, networkCode: string): Promise<void> {
  if (!gatewayDto.macAddress) {
    throw new BadRequestError("MAC address is required");
  }
  try {
    const networkRepo = new NetworkRepository();
    const network = await networkRepo.getNetworkByCode(networkCode);
    if (!network) {
        throw new NotFoundError(`Network with code '${networkCode}' not found`);
    }
    
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
        throw new NotFoundError(error.message);
      }
      if (error.message.includes("already exists")) {
        throw new ConflictError(error.message);
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
        throw new NotFoundError(error.message);
      }
      if (error.message.includes("Gateway with macAddress")) {
        throw new NotFoundError(error.message);
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
  if (
    (newValues.newMacAddress !== undefined && typeof newValues.newMacAddress !== "string") ||
    (newValues.newName !== undefined && typeof newValues.newName !== "string") ||
    (newValues.newDescription !== undefined && typeof newValues.newDescription !== "string")
  ) {
    throw new BadRequestError("Invalid update payload");
  }

  try {
    const gatewayRepo = new GatewayRepository();
    await gatewayRepo.updateGateway(macAddress, networkCode, newValues);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Network with code")) {
        throw new NotFoundError(error.message);
      }
      if (error.message.includes("Gateway with macAddress") && error.message.includes("not found")) {
        throw new NotFoundError(error.message);
      }
      if (error.message.includes("already exists")) {
        throw new ConflictError(error.message);
      }
    }
    throw new AppError("Internal server error", 500);
  }
}