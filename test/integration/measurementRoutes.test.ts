import request from 'supertest';
import { app } from '@app';
import { initializeTestDataSource, closeTestDataSource } from '../setup/test-datasource';
import { UserType } from '@models/UserType';
import jwt from 'jsonwebtoken';
import { CONFIG, SECRET_KEY } from '@config';
import { MeasurementsRepository } from '@repositories/MeasurementsRepository';
import AppError from '@models/errors/AppError';
import { UserRepository } from '@repositories/UserRepository';
import { UserDAO } from '@dao/UserDAO';

jest.mock('@repositories/MeasurementsRepository');
jest.mock('@repositories/UserRepository');

describe('Measurement Routes', () => {
  const networkCode = 'NET01';
  const gatewayMac = '94:3F:BE:4C:4A:79';
  const sensorMac = '71:B1:CE:01:C6:A9';
  const adminUser = { username: 'admin', type: UserType.Admin };
  const viewerUser = { username: 'viewer', type: UserType.Viewer };
  const validToken = jwt.sign(adminUser, SECRET_KEY);
  const viewerToken = jwt.sign(viewerUser, SECRET_KEY);

  const mockMeasurement = {
    createdAt: '2025-02-18T17:00:00+01:00',
    value: 1.8567
  };

  const mockMeasurements = {
    sensorMacAddress: sensorMac,
    stats: {
      startDate: '2025-02-18T00:00:00.000Z',
      endDate: '2025-02-18T23:59:59.000Z',
      mean: 1.8567,
      variance: 0,
      upperThreshold: 1.8567,
      lowerThreshold: 1.8567
    },
    measurements: [
      {
        createdAt: '2025-02-18T16:00:00.000Z',
        value: 1.8567,
        isOutlier: false
      }
    ]
  };

  beforeAll(async () => {
    await initializeTestDataSource();
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock user repository to return valid users
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getUserByUsername: jest.fn().mockImplementation((username) => {
        const mockUser = new UserDAO();
        if (username === 'admin') {
          mockUser.type = UserType.Admin;
          mockUser.username = 'admin';
          return Promise.resolve(mockUser);
        } else if (username === 'viewer') {
          mockUser.type = UserType.Viewer;
          mockUser.username = 'viewer';
          return Promise.resolve(mockUser);
        }
        return Promise.reject(new Error('User not found'));
      })
    }));
  });

  describe('POST /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements', () => {
    it('should create measurements successfully', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        storeMeasurementForSensor: jest.fn().mockResolvedValue(undefined)
      }));

      const response = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .set('Authorization', `Bearer ${validToken}`)
        .send([mockMeasurement]);

      expect(response.status).toBe(201);
    });

    it('should return 400 for invalid measurement data', async () => {
      const response = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .set('Authorization', `Bearer ${validToken}`)
        .send([{ value: 1.8567 }]); // Missing createdAt

      expect(response.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .send([mockMeasurement]);

      expect(response.status).toBe(401);
    });

    it('should return 403 for viewer user', async () => {
      const response = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send([mockMeasurement]);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements', () => {
    it('should get measurements successfully', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensor: jest.fn().mockResolvedValue({
          ...mockMeasurements,
          stats: {
            ...mockMeasurements.stats,
            startDate: new Date(mockMeasurements.stats.startDate),
            endDate: new Date(mockMeasurements.stats.endDate)
          },
          measurements: mockMeasurements.measurements.map(m => ({
            ...m,
            createdAt: new Date(m.createdAt)
          }))
        })
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMeasurements);
    });

    it('should handle query parameters', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensor: jest.fn().mockResolvedValue({
          ...mockMeasurements,
          stats: {
            ...mockMeasurements.stats,
            startDate: new Date(mockMeasurements.stats.startDate),
            endDate: new Date(mockMeasurements.stats.endDate)
          },
          measurements: mockMeasurements.measurements.map(m => ({
            ...m,
            createdAt: new Date(m.createdAt)
          }))
        })
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .query({ startDate: '2025-02-18T00:00:00Z', endDate: '2025-02-18T23:59:59Z' })
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/stats', () => {
    it('should get stats successfully', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getStatsFromSensor: jest.fn().mockResolvedValue({
          ...mockMeasurements.stats,
          startDate: new Date(mockMeasurements.stats.startDate),
          endDate: new Date(mockMeasurements.stats.endDate)
        })
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/stats`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMeasurements.stats);
    });
  });

  describe('GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/outliers', () => {
    it('should get outliers successfully', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getOutliersFromSensor: jest.fn().mockResolvedValue({
          ...mockMeasurements,
          stats: {
            ...mockMeasurements.stats,
            startDate: new Date(mockMeasurements.stats.startDate),
            endDate: new Date(mockMeasurements.stats.endDate)
          },
          measurements: mockMeasurements.measurements.map(m => ({
            ...m,
            createdAt: new Date(m.createdAt)
          }))
        })
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMeasurements);
    });
  });

  describe('GET /networks/:networkCode/measurements', () => {
    it('should get network measurements successfully', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensorsInNetwork: jest.fn().mockResolvedValue([{
          ...mockMeasurements,
          stats: {
            ...mockMeasurements.stats,
            startDate: new Date(mockMeasurements.stats.startDate),
            endDate: new Date(mockMeasurements.stats.endDate)
          },
          measurements: mockMeasurements.measurements.map(m => ({
            ...m,
            createdAt: new Date(m.createdAt)
          }))
        }])
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockMeasurements]);
    });

    it('should handle sensor MAC filter', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensorsInNetwork: jest.fn().mockResolvedValue([{
          ...mockMeasurements,
          stats: {
            ...mockMeasurements.stats,
            startDate: new Date(mockMeasurements.stats.startDate),
            endDate: new Date(mockMeasurements.stats.endDate)
          },
          measurements: mockMeasurements.measurements.map(m => ({
            ...m,
            createdAt: new Date(m.createdAt)
          }))
        }])
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .query({ sensorMacs: [sensorMac] })
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /networks/:networkCode/stats', () => {
    it('should get network stats successfully', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getStatsFromSensorsInNetwork: jest.fn().mockResolvedValue([{
          ...mockMeasurements.stats,
          startDate: new Date(mockMeasurements.stats.startDate),
          endDate: new Date(mockMeasurements.stats.endDate)
        }])
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/stats`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockMeasurements.stats]);
    });
  });

  describe('GET /networks/:networkCode/outliers', () => {
    it('should get network outliers successfully', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getOutliersFromSensorsInNetwork: jest.fn().mockResolvedValue([{
          ...mockMeasurements,
          stats: {
            ...mockMeasurements.stats,
            startDate: new Date(mockMeasurements.stats.startDate),
            endDate: new Date(mockMeasurements.stats.endDate)
          },
          measurements: mockMeasurements.measurements.map(m => ({
            ...m,
            createdAt: new Date(m.createdAt)
          }))
        }])
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/outliers`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockMeasurements]);
    });
  });

  describe('POST /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements/bulk', () => {
    it('should create bulk measurements successfully', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        storeMeasurementsForSensorBulk: jest.fn().mockResolvedValue(undefined),
        validateMeasurements: jest.fn().mockReturnValue(true)
      }));

      const response = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements/bulk`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ measurements: [mockMeasurement] });

      expect(response.status).toBe(201);
    });

    it('should return 400 for empty measurements array', async () => {
      const response = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements/bulk`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ measurements: [] });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid measurement data', async () => {
      const response = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements/bulk`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ measurements: [{ value: 1.8567 }] }); // Missing createdAt

      expect(response.status).toBe(400);
    });
  });

  describe('Error handling for all routes', () => {
    it('should handle internal server error in measurements route', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensor: jest.fn().mockRejectedValue(new Error('Database error'))
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(500);
    });

    it('should handle internal server error in stats route', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getStatsFromSensor: jest.fn().mockRejectedValue(new Error('Database error'))
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/stats`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(500);
    });

    it('should handle internal server error in outliers route', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getOutliersFromSensor: jest.fn().mockRejectedValue(new Error('Database error'))
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(500);
    });

    it('should handle AppError in measurements route', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensor: jest.fn().mockRejectedValue(new AppError('Invalid data', 400))
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(400);
    });

    it('should handle invalid network code format', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensor: jest.fn().mockRejectedValue(new AppError('Invalid network code format', 400))
      }));

      const response = await request(app)
        .get(`/api/v1/networks/invalid-network/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(400);
    });

    it('should handle invalid gateway MAC format', async () => {
      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/invalid-mac/sensors/${sensorMac}/measurements`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(400);
    });

    it('should handle invalid sensor MAC format', async () => {
      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/invalid-mac/measurements`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Network-wide routes error handling', () => {
    it('should handle internal server error in network measurements route', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensorsInNetwork: jest.fn().mockRejectedValue(new Error('Database error'))
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(500);
    });

    it('should handle internal server error in network stats route', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getStatsFromSensorsInNetwork: jest.fn().mockRejectedValue(new Error('Database error'))
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/stats`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(500);
    });

    it('should handle internal server error in network outliers route', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getOutliersFromSensorsInNetwork: jest.fn().mockRejectedValue(new Error('Database error'))
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/outliers`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(500);
    });

    it('should handle AppError in network measurements route', async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensorsInNetwork: jest.fn().mockRejectedValue(new AppError('Invalid data', 400))
      }));

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(400);
    });

    it('should handle invalid date format in network measurements route', async () => {
      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .query({ startDate: 'invalid-date', endDate: '2025-02-18T23:59:59Z' })
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(400);
    });

    it('should handle invalid date range in network measurements route', async () => {
      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .query({ startDate: '2025-02-18T23:59:59Z', endDate: '2025-02-18T00:00:00Z' }) // End before start
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(400);
    });
  });
}); 