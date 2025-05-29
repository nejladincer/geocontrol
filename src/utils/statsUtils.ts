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
import { dateToISO, isoToDate, stringToISO } from './dateUtils';

export async function calculateStats(
  measurements: any[],
  startDate?: string,
  endDate?: string,
  ) : Promise<Stats> {

    // Convert dates to ISO format
    const startISO = startDate ? stringToISO(startDate) : dateToISO(new Date(0));
    const endISO = endDate ? stringToISO(endDate) : dateToISO(new Date());

    // Handle empty measurements array
    if (!measurements || measurements.length === 0) {
      return {
        startDate: startISO.toDate(),
        endDate: endISO.toDate(),
        mean: 0,
        variance: 0,
        upperThreshold: 0,
        lowerThreshold: 0
      };
    }

    // Extract values from measurements if they are measurement objects
    const values = measurements.map(m => typeof m === 'number' ? m : Number(m.value));

    // Calculate mean
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

    // Calculate variance
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    // Calculate standard deviation and thresholds
    const stdDev = Math.sqrt(variance);
    const upperThreshold = mean + 2 * stdDev;
    const lowerThreshold = mean - 2 * stdDev;

    return {
      startDate: startISO.toDate(),
      endDate: endISO.toDate(),
      mean: mean,
      variance: variance,
      upperThreshold: upperThreshold,
      lowerThreshold: lowerThreshold
    };
}