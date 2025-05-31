import { Measurements } from '@models/dto/Measurements';
import { Stats } from '@models/dto/Stats';
import AppError from '@models/errors/AppError';
import { MeasurementsRepository } from '@repositories/MeasurementsRepository';

export async function getMeasurementsFromSensorsInNetwork(
  networkCode: string,
  sensorMacs?: string[],
  startDate?: string,
  endDate?: string
): Promise<Measurements[]> {
  try {
    const measurementsRepo = new MeasurementsRepository();
    return await measurementsRepo.getMeasurementsFromSensorsInNetwork(networkCode, sensorMacs, startDate, endDate);
  } catch (error) {
    throw (error instanceof AppError) ? error : new AppError("Failed to get measurements", 500);
  }
}

export async function getStatsFromSensorsInNetwork(
  networkCode: string,
  sensorMacs?: string[],
  startDate?: string,
  endDate?: string
): Promise<Stats[]> {
  try {
    const measurementsRepo = new MeasurementsRepository();
    return await measurementsRepo.getStatsFromSensorsInNetwork(networkCode, sensorMacs, startDate, endDate);
  } catch (error) {
    throw (error instanceof AppError) ? error : new AppError("Failed to get statistics", 500);
  }
}

export async function getOutliersFromSensorsInNetwork(
  networkCode: string,
  sensorMacs?: string[],
  startDate?: string,
  endDate?: string
): Promise<Measurements[]> {
  try {
    const measurementsRepo = new MeasurementsRepository();
    return await measurementsRepo.getOutliersFromSensorsInNetwork(networkCode, sensorMacs, startDate, endDate);
  } catch (error) {
    throw (error instanceof AppError) ? error : new AppError("Failed to get outliers", 500);
  }
}

export async function storeMeasurementForSensor(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  createdAt: string,
  value: number
): Promise<void> {
  try {
    const measurementsRepo = new MeasurementsRepository();
    await measurementsRepo.storeMeasurementForSensor(networkCode, gatewayMac, sensorMac, createdAt, value);
  } catch (error) {
    throw (error instanceof AppError) ? error : new AppError("Failed to store measurement", 500);
  }
}

export async function getMeasurementsFromSensor(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  startDate?: string,
  endDate?: string
): Promise<Measurements> {
  try {
    const measurementsRepo = new MeasurementsRepository();
    return await measurementsRepo.getMeasurementsFromSensor(networkCode, gatewayMac, sensorMac, startDate, endDate);
  } catch (error) {
    throw (error instanceof AppError) ? error : new AppError("Failed to get measurements", 500);
  }
}

export async function getStatsFromSensor(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  startDate?: string,
  endDate?: string
): Promise<Stats> {
  try {
    const measurementsRepo = new MeasurementsRepository();
    return await measurementsRepo.getStatsFromSensor(networkCode, gatewayMac, sensorMac, startDate, endDate);
  } catch (error) {
    throw (error instanceof AppError) ? error : new AppError("Failed to get statistics", 500);
  }
}

export async function getOutliersFromSensor(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  startDate?: string,
  endDate?: string
): Promise<Measurements> {
  try {
    const measurementsRepo = new MeasurementsRepository();
    return await measurementsRepo.getOutliersFromSensor(networkCode, gatewayMac, sensorMac, startDate, endDate);
  } catch (error) {
    throw (error instanceof AppError) ? error : new AppError("Failed to get outliers", 500);
  }
}