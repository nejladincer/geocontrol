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


/* GATEWAY DTO */
export function createGatewayDTO(
  macAddress: string,
  name: string,
  description: string
  //sensors: SensorDAO[]
): GatewayDTO {
  return removeNullAttributes({
    macAddress,
    name,
    description,
    //sensors
  }) as GatewayDTO;
}

export function mapGatewayDAOToDTO(gatewayDAO: GatewayDAO): GatewayDTO {
  return createGatewayDTO(gatewayDAO.macAddress, gatewayDAO.name, gatewayDAO.description); //gatewayDAO.sensors);
}