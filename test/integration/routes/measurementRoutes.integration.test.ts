import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as measurementsController from "@controllers/measurementsController";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { instanceOfMeasurement, Measurement as MeasurementDTO } from "@models/dto/Measurement";
import { before } from "node:test";
import { NotFoundError } from "@models/errors/NotFoundError";

jest.mock("@services/authService");
jest.mock("@controllers/measurementsController");

describe("MeasurementRoutes Integration", () => {
  const token = "Bearer faketoken";
  const adminToken = "Bearer admintoken";
  const operatorToken = "Bearer operatortoken";
  const viewerToken = "Bearer viewertoken";

  const networkCode = "net123";
  const gatewayMac = "00:1A:2B:3C:4D:5E";
  const sensorMac = "AA:BB:CC:DD:EE:FF";
  const createdAt = new Date().toISOString();
  const value = 42;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements", () => {
    const mockDate = new Date();
    const mockMeasurement: MeasurementDTO = {
      createdAt: mockDate,
      value: value,
      isOutlier: false,
    };

    it("should store a measurement for a sensor (admin/operator)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.storeMeasurementForSensor as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .set("Authorization", adminToken)
        .send(mockMeasurement);

      expect(response.status).toBe(201);
      expect(measurementsController.storeMeasurementForSensor).toHaveBeenCalledWith(
        networkCode,
        gatewayMac,
        sensorMac,
        mockDate.toISOString(),
        mockMeasurement.value
      );
    });

    it("should return 401 for missing token", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.storeMeasurementForSensor as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .set("Authorization", "Invalid Token")
        .send(mockMeasurement);  // Include the measurement data

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("should return 403 for viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const response = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .set("Authorization", viewerToken)
        .send(mockMeasurement);

      expect(measurementsController.storeMeasurementForSensor).rejects.toThrow(InsufficientRightsError);
      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("should return 404 when not found", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.storeMeasurementForSensor as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Network/Gateway/Sensor not found");
      });
      
      const response = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .set("Authorization", adminToken)
        .send(mockMeasurement);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/); 
    });

    it("should return 500 for internal server error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.storeMeasurementForSensor as jest.Mock).mockImplementation(() => {
        throw new Error("Internal server error");
      });
    });
    
  });

  describe("GET /v1/sensors/:sensorMac/measurements", () => {
    const mockMeasurements = {
      sensorMacAddress: sensorMac,
      measurements: [{ createdAt, value, isOutlier: false }],
    };

    it("should retrieve measurements for a sensor (authenticated)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getMeasurementsFromSensor as jest.Mock).mockResolvedValue(mockMeasurements);

      const response = await request(app)
        .get(`/api/v1/sensors/${sensorMac}/measurements`)
        .set("Authorization", operatorToken)
        .query({ networkCode, gatewayMac });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMeasurements);
      expect(measurementsController.getMeasurementsFromSensor).toHaveBeenCalledWith(
        networkCode,
        gatewayMac,
        sensorMac,
        undefined,
        undefined
      );
    });

    it("should return 401 without token", async () => {
      const response = await request(app)
        .get(`/api/v1/sensors/${sensorMac}/measurements`)
        .query({ networkCode, gatewayMac });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /v1/sensors/:sensorMac/stats", () => {
    const mockStats = {
      mean: 42,
      variance: 0,
      upperThreshold: 44,
      lowerThreshold: 40,
    };

    it("should retrieve stats for a sensor (authenticated)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getStatsFromSensor as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app)
        .get(`/api/v1/sensors/${sensorMac}/stats`)
        .set("Authorization", viewerToken)
        .query({ networkCode, gatewayMac });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStats);
      expect(measurementsController.getStatsFromSensor).toHaveBeenCalledWith(
        networkCode,
        gatewayMac,
        sensorMac,
        undefined,
        undefined
      );
    });

    it("should return 401 without token", async () => {
      const response = await request(app)
        .get(`/api/v1/sensors/${sensorMac}/stats`)
        .query({ networkCode, gatewayMac });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /v1/sensors/:sensorMac/outliers", () => {
    const mockOutliers = {
      sensorMacAddress: sensorMac,
      measurements: [{ createdAt, value: 100, isOutlier: true }],
    };

    it("should retrieve outliers for a sensor (authenticated)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getOutliersFromSensor as jest.Mock).mockResolvedValue(mockOutliers);

      const response = await request(app)
        .get(`/api/v1/sensors/${sensorMac}/outliers`)
        .set("Authorization", viewerToken)
        .query({ networkCode, gatewayMac });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOutliers);
      expect(measurementsController.getOutliersFromSensor).toHaveBeenCalledWith(
        networkCode,
        gatewayMac,
        sensorMac,
        undefined,
        undefined
      );
    });

    it("should return 401 without token", async () => {
      const response = await request(app)
        .get(`/api/v1/sensors/${sensorMac}/outliers`)
        .query({ networkCode, gatewayMac });

      expect(response.status).toBe(401);
    });
  });
});
