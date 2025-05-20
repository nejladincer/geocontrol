import { Network as NetworkDTO } from "@dto/Network";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { mapNetworkDAOToDTO } from "@services/mapperService";
import AppError from "@models/errors/AppError";

export async function getAllNetworks(): Promise<NetworkDTO[]> {
  try {
    const networkRepo = new NetworkRepository();
    return (await networkRepo.getAllNetworks()).map(mapNetworkDAOToDTO);
  } catch (error) {
    throw new AppError("Internal server error", 500);
  }
}

export async function getNetwork(code: string): Promise<NetworkDTO> {
  try {
    const networkRepo = new NetworkRepository();
    return mapNetworkDAOToDTO(await networkRepo.getNetworkByCode(code));
  } catch (error) {
    if (error instanceof AppError) {
      if (error.message.includes("not found")) {
        throw new AppError("Network not found", 404);
      }
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function createNetwork(networkDto: NetworkDTO): Promise<void> {
  if (!networkDto.code) {
    throw new AppError("Network code is required", 400);
  }

  try {
    const networkRepo = new NetworkRepository();
    await networkRepo.createNetwork(
      networkDto.code,
      networkDto.name,
      networkDto.description
    );
  } catch (error) {
    if (error instanceof AppError) {
      if (error.message.includes("already exists")) {
        throw new AppError("Network code already in use", 409);
      }
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function updateNetwork(
  code: string,
  networkDto: NetworkDTO
): Promise<void> {
  try {
    const networkRepo = new NetworkRepository();
    await networkRepo.updateNetwork(
      code,
      networkDto.name,
      networkDto.description
    );
  } catch (error) {
    if (error instanceof AppError) {
      if (error.message.includes("not found")) {
        throw new AppError("Network not found", 404);
      }
      if (error.message.includes("already exists")) {
        throw new AppError("Network code already in use", 409);
      }
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function deleteNetwork(code: string): Promise<void> {
  try {
    const networkRepo = new NetworkRepository();
    await networkRepo.deleteNetwork(code);
  } catch (error) {
    if (error instanceof AppError) {
      if (error.message.includes("not found")) {
        throw new AppError("Network not found", 404);
      }
    }
    throw new AppError("Internal server error", 500);
  }
} 