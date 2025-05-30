import { Sensor as SensorDTO } from "@dto/Sensor";
import { SensorRepository } from "@repositories/SensorRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import AppError from "@models/errors/AppError";
import { mapSensorDAOToDTO } from "@services/mappings/sensorMapperService";

export async function getAllSensors(networkCode: string, gatewayMac: string): Promise<SensorDTO[]> {
  try {
    const gatewayRepo = new GatewayRepository();
    await gatewayRepo.getGatewayByMacAddress(gatewayMac, networkCode); 

    const sensorRepo = new SensorRepository();
    const sensors = await sensorRepo.getAllSensorsInGateway(gatewayMac);
    return sensors.map(mapSensorDAOToDTO);
  } catch (error) {
    throw new AppError("Failed to fetch sensors", 500);
  }
}

export async function getSensor(sensorMac: string, gatewayMac: string, networkCode: string): Promise<SensorDTO> {
  try {
    const gatewayRepo = new GatewayRepository();
    await gatewayRepo.getGatewayByMacAddress(gatewayMac, networkCode); 

    const sensorRepo = new SensorRepository();
    const sensor = await sensorRepo.getSensorByMacAddress(sensorMac, gatewayMac);
    return mapSensorDAOToDTO(sensor);
  } catch (error) {
    throw new AppError("Sensor not found", 404);
  }
}

export async function getAllSensorsInNetwork(networkCode: string): Promise<SensorDTO[]> {
  try {
    const sensorRepo = new SensorRepository();
    const sensors = await sensorRepo.getAllSensorsInNetwork(networkCode);
    return sensors.map( (s) => mapSensorDAOToDTO(s) );
  }
  catch (error) {
    throw new AppError("Failed to fetch sensors in network", 500);
  }
}

export async function createSensor(sensorDto: SensorDTO, gatewayMac: string, networkCode: string): Promise<void> {
  if (!sensorDto.macAddress) throw new AppError("Sensor macAddress is required", 400);

  try {
    const gatewayRepo = new GatewayRepository();
    await gatewayRepo.getGatewayByMacAddress(gatewayMac, networkCode);

    const sensorRepo = new SensorRepository();
    await sensorRepo.createSensor(
      sensorDto.macAddress,
      sensorDto.name,
      sensorDto.description,
      sensorDto.variable,
      sensorDto.unit,
      gatewayMac
    );
  } catch (error) {
    if (error.message.includes("already exists")) {
      throw new AppError("Sensor already exists", 409);
    }
    throw new AppError("Failed to create sensor", 500);
  }
}

export async function updateSensor(sensorMac: string, gatewayMac: string, networkCode: string, updateDto: Partial<SensorDTO>): Promise<void> {
  try {
    const gatewayRepo = new GatewayRepository();
    await gatewayRepo.getGatewayByMacAddress(gatewayMac, networkCode);

    const sensorRepo = new SensorRepository();
    await sensorRepo.updateSensor(sensorMac, gatewayMac, updateDto);
  } catch (error) {
    throw new AppError("Failed to update sensor", 500);
  }
}

export async function deleteSensor(sensorMac: string, gatewayMac: string, networkCode: string): Promise<void> {
  try {
    const gatewayRepo = new GatewayRepository();
    await gatewayRepo.getGatewayByMacAddress(gatewayMac, networkCode);

    const sensorRepo = new SensorRepository();
    await sensorRepo.deleteSensor(sensorMac, gatewayMac);
  } catch (error) {
    throw new AppError("Failed to delete sensor", 500);
  }
}
