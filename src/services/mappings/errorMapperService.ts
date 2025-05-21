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
import { createUserDTO } from "./userMapperService";
import { Sensor as SensorDTO } from "@dto/Sensor";
import { SensorDAO } from "@models/dao/SensorDAO";

/* ERROR DTO */
export function createErrorDTO(
  code: number,
  message?: string,
  name?: string
): ErrorDTO {
  return removeNullAttributes({
    code,
    name,
    message
  }) as ErrorDTO;
}

export function mapUserDAOToDTO(userDAO: UserDAO): UserDTO {
  return createUserDTO(userDAO.username, userDAO.type);
}

/** Maps SensorDAO to SensorDTO */
export function mapSensorDAOToDTO(sensorDAO: SensorDAO): SensorDTO {
  return {
    macAddress: sensorDAO.macAddress,
    name: sensorDAO.name,
    description: sensorDAO.description,
    variable: sensorDAO.variable,
    unit: sensorDAO.unit
  };
}


