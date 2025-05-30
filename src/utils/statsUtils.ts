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
  } else if (!endDate) {
    endDateISO = new Date().toISOString(); // Current time
  }

  // Handle empty measurements array
  if (measurements.length === 0) {
    return <Stats>{
      startDate: startDateISO,
      endDate: endDateISO,
      mean: 0,
      variance: 0,
      upperThreshold: 0,
      lowerThreshold: 0,
    };
  }

  // Calculate stats from measurements
  const mean = measurements.reduce((sum, m) => sum + m, 0) / measurements.length;

  let variance = 0;
  measurements.forEach((m) => (variance += (m - mean) ** 2));
  variance /= measurements.length;

  const stdDev = Math.sqrt(variance);

  const upperThreshold = mean + 2 * stdDev;
  const lowerThreshold = mean - 2 * stdDev;

  return <Stats>{
    startDate: startDateISO,
    endDate: endDateISO,
    mean: mean,
    variance: variance,
    upperThreshold: upperThreshold,
    lowerThreshold: lowerThreshold,
  };
}