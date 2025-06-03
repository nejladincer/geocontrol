import { Sensor as SensorDTO } from "@dto/Sensor";
import { SensorRepository } from "@repositories/SensorRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import AppError from "@models/errors/AppError";
import { mapSensorDAOToDTO } from "@services/mappings/sensorMapperService";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import { BadRequestError } from "@models/errors/BadRequestError";

export async function getAllSensors(networkCode: string, gatewayMac: string): Promise<SensorDTO[]> {
  try {
    const gatewayRepo = new GatewayRepository();
    await gatewayRepo.getGatewayByMacAddress(gatewayMac, networkCode);

    const sensorRepo = new SensorRepository();
    const sensors = await sensorRepo.getAllSensorsInGateway(gatewayMac);
    return sensors.map(mapSensorDAOToDTO);
  } catch (error) {
    // console.error("[getAllSensors ERROR]", error);
    if (error instanceof AppError) throw error;
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
    // console.error("[getSensor ERROR]", error);
    if (error instanceof AppError) throw error;
    throw new NotFoundError(`Sensor with macAddress '${sensorMac}' not found`);
  }
}

export async function getAllSensorsInNetwork(networkCode: string): Promise<SensorDTO[]> {
  try {
    const sensorRepo = new SensorRepository();
    const sensors = await sensorRepo.getAllSensorsInNetwork(networkCode);
    return sensors.map(mapSensorDAOToDTO);
  } catch (error) {
    // console.error("[getAllSensorsInNetwork ERROR]", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch sensors in network", 500);
  }
}

export async function createSensor(sensorDto: SensorDTO, gatewayMac: string, networkCode: string): Promise<void> {
  if (!sensorDto.macAddress) throw new BadRequestError("Sensor macAddress is required");

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
    // console.error("[createSensor ERROR]", error);
    if (error instanceof AppError) throw error;
    if (error.message?.includes("already exists")) {
      throw new AppError("Sensor already exists"  , 409);
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
    // console.error("[updateSensor ERROR]", error);
    if (error instanceof AppError) throw error;
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
    // console.error("[deleteSensor ERROR]", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to delete sensor", 500);
  }
}
