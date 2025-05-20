import { Gateway as GatewayDTO } from "@dto/Gateway";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { mapGatewayDAOToDTO } from "@services/mapperService";

export async function getAllGateways(networkCode: string): Promise<GatewayDTO[]> {
  const gatewayRepo = new GatewayRepository();
  return (await gatewayRepo.getAllGatewaysInNetwork(networkCode)).map(mapGatewayDAOToDTO);
}

export async function getGateway(macAddress: string, networkCode: string): Promise<GatewayDTO> {
  const gatewayRepo = new GatewayRepository();
  return mapGatewayDAOToDTO(await gatewayRepo.getGatewayByMacAddress(macAddress, networkCode));
}

export async function createGateway(gatewayDto: GatewayDTO): Promise<void> {
  const gatewayRepo = new GatewayRepository();
  await gatewayRepo.createGateway(gatewayDto.macAddress, gatewayDto.name, gatewayDto.description, gatewayDto.sensors, gatewayDto.network);
}

export async function deleteGateway(macAddress: string, networkCode: string): Promise<void> {
  const gatewayRepo = new GatewayRepository();
  await gatewayRepo.deleteGateway(macAddress, networkCode);
}

export async function updateGateway(macAddress: string, networkCode: string, newValues: { newMacAddress?: string, newName?: string, newDescription?: string }): Promise<void> {
  const gatewayRepo = new GatewayRepository();
  await gatewayRepo.updateGateway(macAddress, networkCode, newValues);
}
