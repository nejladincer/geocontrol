import { Token as TokenDTO } from "@dto/Token";
import { User as UserDTO } from "@dto/User";
import { Network as NetworkDTO } from "@dto/Network";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { UserDAO } from "@models/dao/UserDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { ErrorDTO } from "@models/dto/ErrorDTO";
import { UserType } from "@models/UserType";
import { Gateway as GatewayDTO } from "@models/dto/Gateway";
import { removeNullAttributes } from "@services/mappings/utilsMapperService";

export function createNetworkDTO(
  code: string,
  name: string,
  description: string
): NetworkDTO {
  return removeNullAttributes({
    code,
    name,
    description
  }) as NetworkDTO;
}

export function mapNetworkDAOToDTO(networkDAO: NetworkDAO): NetworkDTO {
  return createNetworkDTO(
    networkDAO.code,
    networkDAO.name,
    networkDAO.description
  );
}