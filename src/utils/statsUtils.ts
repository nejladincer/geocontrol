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

// Calculate stats for a set of measurements
export async function calculateStats(
  measurements: any[],
  startDateISO: string,
  endDateISO: string,
): Promise<any> {
  if (!measurements || measurements.length === 0) {
    return {
      startDate: new Date(startDateISO),
      endDate: new Date(endDateISO),
      mean: 0,
      variance: 0,
      upperThreshold: 0,
      lowerThreshold: 0,
    };
  }

  // Ensure values are parsed as float with full precision
  const values = measurements.map(m => parseFloat(m.value));
  
  // Calculate mean and sum over array
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  // Replace each item with its squared difference from the mean
  // and then reduce the array to a scalar value to calculate the variance
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const sumSquaredDiffs = squaredDiffs.reduce((acc, val) => acc + val, 0);
  const variance = sumSquaredDiffs / values.length;

  // Standard deviation and thresholds 
  const stdDev = Math.sqrt(variance);
  const upperThreshold = mean + 2 * stdDev;
  const lowerThreshold = mean - 2 * stdDev;

  return {
    startDate: new Date(startDateISO),
    endDate: new Date(endDateISO),
    mean,                
    variance,            
    upperThreshold,      
    lowerThreshold,      
  };
}