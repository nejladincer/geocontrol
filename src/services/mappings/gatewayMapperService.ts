import { GatewayDAO } from "@models/dao/GatewayDAO";
import { Gateway as GatewayDTO } from "@models/dto/Gateway";
import { removeNullAttributes } from "@services/mappings/utilsMapperService";
import { mapSensorDAOToDTO } from "@services/mappings/sensorMapperService";
import { Sensor } from "@models/dto/Sensor";


/* GATEWAY DTO */
export function createGatewayDTO(
  macAddress: string,
  name: string,
  description: string,
  sensors?: Sensor[]
): GatewayDTO {
  return removeNullAttributes({
    macAddress,
    name,
    description,
    sensors
  }) as GatewayDTO;
}

export function mapGatewayDAOToDTO(gatewayDAO: GatewayDAO): GatewayDTO {
  return createGatewayDTO(
    gatewayDAO.macAddress, 
    gatewayDAO.name, 
    gatewayDAO.description, 
    gatewayDAO.sensors?.map(sensor => mapSensorDAOToDTO(sensor))
  );
}