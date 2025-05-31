import { Network as NetworkDTO } from "@dto/Network";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { Gateway as GatewayDTO } from "@models/dto/Gateway";
import { removeNullAttributes } from "@services/mappings/utilsMapperService";
import { mapGatewayDAOToDTO } from "@services/mappings/gatewayMapperService";

export function createNetworkDTO(
  code: string,
  name: string,
  description: string,
  gateways?: GatewayDTO[]
): NetworkDTO {
  return removeNullAttributes({
    code,
    name,
    description,
    gateways
  }) as NetworkDTO;
}

export function mapNetworkDAOToDTO(networkDAO: NetworkDAO): NetworkDTO {
  return createNetworkDTO(
    networkDAO.code,
    networkDAO.name,
    networkDAO.description,
    networkDAO.gateways?.map(mapGatewayDAOToDTO)
  );
}