import { Network as NetworkDTO } from "@dto/Network";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { mapNetworkDAOToDTO } from "@services/mapperService";

export async function getAllNetworks(): Promise<NetworkDTO[]> {
  const NetworkRepo = new NetworkRepository();
  return (await NetworkRepo.getAllNetworks()).map(mapNetworkDAOToDTO);
}

export async function getNetworkByCode(code: string): Promise<NetworkDTO> {
  const NetworkRepo = new NetworkRepository();
  return mapNetworkDAOToDTO(await NetworkRepo.getNetworkByCode(code));
}

export async function createNetwork(NetworkDto: NetworkDTO): Promise<void> {
  const NetworkRepo = new NetworkRepository();
  await NetworkRepo.createNetwork(NetworkDto.code, NetworkDto.name, NetworkDto.description, NetworkDto.gateways);
}

export async function updateNetwork(code: string, newValues: { newCode?: string, newName?: string, newDescription?: string }): Promise<void> {
  const NetworkRepo = new NetworkRepository();
  await NetworkRepo.updateNetwork(code, newValues);
}
export async function deleteNetwork(code: string): Promise<void> {
  const NetworkRepo = new NetworkRepository();
  await NetworkRepo.deleteNetwork(code);
}