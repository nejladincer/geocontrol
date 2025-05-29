import { Sensor as SensorDTO } from "@dto/Sensor";
import { SensorDAO } from "@models/dao/SensorDAO";
import { removeNullAttributes } from "@services/mappings/utilsMapperService";

/**
 * Crea un oggetto SensorDTO da valori singoli.
 */
export function createSensorDTO(
  macAddress: string,
  name: string,
  description: string,
  variable: string,
  unit: string
): SensorDTO {
  return removeNullAttributes({
    macAddress,
    name,
    description,
    variable,
    unit
  }) as SensorDTO;
}

/**
 * Mappa un SensorDAO in un SensorDTO.
 */
export function mapSensorDAOToDTO(sensorDAO: SensorDAO): SensorDTO {
  return createSensorDTO(
    sensorDAO.macAddress,
    sensorDAO.name,
    sensorDAO.description,
    sensorDAO.variable,
    sensorDAO.unit
  );
}