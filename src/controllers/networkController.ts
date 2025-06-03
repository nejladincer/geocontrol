import { Network as NetworkDTO } from "@dto/Network";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { mapNetworkDAOToDTO } from "@services/mappings/networkMapperService";
import AppError from "@models/errors/AppError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

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
        throw new NotFoundError(`Network with code '${code}' not found`);
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
        throw new ConflictError(`Network code '${networkDto.code}' already in use`);
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
        throw new NotFoundError(`Network with code '${code}' not found`);
      }
      if (error.message.includes("already exists")) {
        throw new ConflictError(`Network code '${networkDto.code}' already in use`);
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
        throw new NotFoundError(`Network with code '${code}' not found`);
      }
    }
    throw new AppError("Internal server error", 500);
  }
} 