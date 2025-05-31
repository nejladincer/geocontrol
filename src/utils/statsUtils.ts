import { getAllSensors } from '@controllers/SensorController';
import { Stats } from '@models/dto/Stats';
import { findOrThrowNotFound, validateNetworkCode, validateSensorMac } from 'utils/utils';
import { StatsToJSON } from '@models/dto/Stats';
import { validateGatewayMac } from 'utils/utils';
import { getNetwork } from '@controllers/networkController';
import { getGateway } from '@controllers/gatewayController';
import { getSensor } from '@controllers/SensorController';
import { MeasurementsRepository } from '@repositories/MeasurementsRepository';
import { AppDataSource } from '@database';
import { MeasurementDAO } from '@models/dao/MeasurementDAO';
import { isoToDate } from './dateUtils';

export async function calculateStats(
  measurements: any[],
  startDate?: string,
  endDate?: string,
): Promise<Stats> {
  let startDateISO, endDateISO;

  // Validate start and end dates
  if (!startDate) {
    startDateISO = new Date(0).toISOString(); // Start of time
  } else {
    startDateISO = startDate;
  }

  if (!endDate) {
    endDateISO = new Date().toISOString(); // Current time
  } else {
    endDateISO = endDate;
  }

  // Handle empty measurements array
  if (measurements.length === 0) {
    return <Stats>{
      startDate: new Date(startDateISO),
      endDate: new Date(endDateISO),
      mean: 0,
      variance: 0,
      upperThreshold: 0,
      lowerThreshold: 0,
    };
  }

  // Extract values from measurements
  const values = measurements.map(m => Number(m.value));

  // Calculate mean
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

  // Calculate variance
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;

  // Calculate standard deviation and thresholds
  const stdDev = Math.sqrt(variance);
  const upperThreshold = mean + 2 * stdDev;
  const lowerThreshold = mean - 2 * stdDev;

  return <Stats>{
    startDate: new Date(startDateISO),
    endDate: new Date(endDateISO),
    mean: mean,
    variance: variance,
    upperThreshold: upperThreshold,
    lowerThreshold: lowerThreshold,
  };
}