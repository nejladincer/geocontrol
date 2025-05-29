import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as measurementsController from "@controllers/measurementsController";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";

jest.mock("@services/authService");
jest.mock("@controllers/measurementsController");

describe("MeasurementRoutes integration", () => {
  const adminToken = "Bearer admintoken";
  const operatorToken = "Bearer operatortoken";
  const viewerToken = "Bearer viewertoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements", () => {
    const measurementData = {
      createdAt: "2023-01-01T00:00:00Z",
      value: 25.5
    };

    it("should store measurement (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.storeMeasurementForSensor as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/v1/networks/test-network/gateways/test-gateway/sensors/test-sensor/measurements")
        .set("Authorization", adminToken)
        .send(measurementData);

      expect(response.status).toBe(201);
      expect(measurementsController.storeMeasurementForSensor).toHaveBeenCalledWith(
        "test-network",
        "test-gateway", 
        "test-sensor",
        "2023-01-01T00:00:00Z",
        25.5
      );
    });

    it("should store measurement (operator)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.storeMeasurementForSensor as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/v1/networks/test-network/gateways/test-gateway/sensors/test-sensor/measurements")
        .set("Authorization", operatorToken)
        .send(measurementData);

      expect(response.status).toBe(201);
    });

    it("should return 403 for viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const response = await request(app)
        .post("/api/v1/networks/test-network/gateways/test-gateway/sensors/test-sensor/measurements")
        .set("Authorization", viewerToken)
        .send(measurementData);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("should return 400 for missing required fields", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/v1/networks/test-network/gateways/test-gateway/sensors/test-sensor/measurements")
        .set("Authorization", adminToken)
        .send({ createdAt: "2023-01-01T00:00:00Z" }); // missing value

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Missing required fields/);
    });

    it("should return 404 for non-existent sensor", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.storeMeasurementForSensor as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Sensor not found");
      });

      const response = await request(app)
        .post("/api/v1/networks/test-network/gateways/test-gateway/sensors/non-existent/measurements")
        .set("Authorization", adminToken)
        .send(measurementData);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });

    it("should return 401 without auth token", async () => {
      const response = await request(app)
        .post("/api/v1/networks/test-network/gateways/test-gateway/sensors/test-sensor/measurements")
        .send(measurementData);

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
    });
  });

  describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements", () => {
    const mockMeasurements = {
      sensorMacAddress: "test-sensor",
      measurements: [
        { createdAt: "2023-01-01T00:00:00Z", value: 25.5 },
        { createdAt: "2023-01-01T01:00:00Z", value: 26.0 }
      ]
    };

    it("should get sensor measurements (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getMeasurementsFromSensor as jest.Mock).mockResolvedValue(mockMeasurements);

      const response = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors/test-sensor/measurements")
        .set("Authorization", adminToken)
        .query({ startDate: "2023-01-01", endDate: "2023-01-02" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMeasurements);
      expect(measurementsController.getMeasurementsFromSensor).toHaveBeenCalledWith(
        "test-network",
        "test-gateway",
        "test-sensor",
        "2023-01-01",
        "2023-01-02"
      );
    });

    it("should get sensor measurements (viewer)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getMeasurementsFromSensor as jest.Mock).mockResolvedValue(mockMeasurements);

      const response = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors/test-sensor/measurements")
        .set("Authorization", viewerToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMeasurements);
    });

    it("should return 404 for non-existent sensor", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getMeasurementsFromSensor as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Sensor not found");
      });

      const response = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors/non-existent/measurements")
        .set("Authorization", adminToken);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });

    it("should return 401 without auth token", async () => {
      const response = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors/test-sensor/measurements");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
    });
  });

  describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/stats", () => {
    const mockStats = {
      sensorMacAddress: "test-sensor",
      count: 100,
      average: 25.5,
      min: 20.0,
      max: 30.0
    };

    it("should get sensor statistics (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getStatsFromSensor as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors/test-sensor/stats")
        .set("Authorization", adminToken)
        .query({ startDate: "2023-01-01", endDate: "2023-01-02" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStats);
      expect(measurementsController.getStatsFromSensor).toHaveBeenCalledWith(
        "test-network",
        "test-gateway",
        "test-sensor",
        "2023-01-01",
        "2023-01-02"
      );
    });

    it("should get sensor statistics (viewer)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getStatsFromSensor as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors/test-sensor/stats")
        .set("Authorization", viewerToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStats);
    });

    it("should return 404 for non-existent sensor", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getStatsFromSensor as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Sensor not found");
      });

      const response = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors/non-existent/stats")
        .set("Authorization", adminToken);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });
  });

  describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/outliers", () => {
    const mockOutliers = {
      sensorMacAddress: "test-sensor",
      outliers: [
        { createdAt: "2023-01-01T00:00:00Z", value: 100.0 }
      ]
    };

    it("should get sensor outliers (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getOutliersFromSensor as jest.Mock).mockResolvedValue(mockOutliers);

      const response = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors/test-sensor/outliers")
        .set("Authorization", adminToken)
        .query({ startDate: "2023-01-01", endDate: "2023-01-02" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOutliers);
      expect(measurementsController.getOutliersFromSensor).toHaveBeenCalledWith(
        "test-network",
        "test-gateway",
        "test-sensor",
        "2023-01-01",
        "2023-01-02"
      );
    });

    it("should get sensor outliers (viewer)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getOutliersFromSensor as jest.Mock).mockResolvedValue(mockOutliers);

      const response = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors/test-sensor/outliers")
        .set("Authorization", viewerToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOutliers);
    });
  });

  describe("GET /networks/:networkCode/measurements", () => {
    const mockNetworkMeasurements = [
      {
        sensorMacAddress: "sensor1",
        measurements: [
          { createdAt: "2023-01-01T00:00:00Z", value: 25.5 }
        ]
      },
      {
        sensorMacAddress: "sensor2", 
        measurements: [
          { createdAt: "2023-01-01T00:00:00Z", value: 60.0 }
        ]
      }
    ];

    it("should get network measurements (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getMeasurementsFromSensorsInNetwork as jest.Mock).mockResolvedValue(mockNetworkMeasurements);

      const response = await request(app)
        .get("/api/v1/networks/test-network/measurements")
        .set("Authorization", adminToken)
        .query({ 
          sensorMacs: ["sensor1", "sensor2"],
          startDate: "2023-01-01",
          endDate: "2023-01-02"
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNetworkMeasurements);
      expect(measurementsController.getMeasurementsFromSensorsInNetwork).toHaveBeenCalledWith(
        "test-network",
        ["sensor1", "sensor2"],
        "2023-01-01",
        "2023-01-02"
      );
    });

    it("should get network measurements (viewer)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getMeasurementsFromSensorsInNetwork as jest.Mock).mockResolvedValue(mockNetworkMeasurements);

      const response = await request(app)
        .get("/api/v1/networks/test-network/measurements")
        .set("Authorization", viewerToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNetworkMeasurements);
    });

    it("should return 404 for non-existent network", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getMeasurementsFromSensorsInNetwork as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Network not found");
      });

      const response = await request(app)
        .get("/api/v1/networks/non-existent/measurements")
        .set("Authorization", adminToken);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });
  });

  describe("GET /networks/:networkCode/stats", () => {
    const mockNetworkStats = [
      {
        sensorMacAddress: "sensor1",
        count: 100,
        average: 25.5,
        min: 20.0,
        max: 30.0
      }
    ];

    it("should get network statistics (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getStatsFromSensorsInNetwork as jest.Mock).mockResolvedValue(mockNetworkStats);

      const response = await request(app)
        .get("/api/v1/networks/test-network/stats")
        .set("Authorization", adminToken)
        .query({ 
          sensorMacs: ["sensor1"],
          startDate: "2023-01-01",
          endDate: "2023-01-02"
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNetworkStats);
      expect(measurementsController.getStatsFromSensorsInNetwork).toHaveBeenCalledWith(
        "test-network",
        ["sensor1"],
        "2023-01-01",
        "2023-01-02"
      );
    });

    it("should get network statistics (viewer)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getStatsFromSensorsInNetwork as jest.Mock).mockResolvedValue(mockNetworkStats);

      const response = await request(app)
        .get("/api/v1/networks/test-network/stats")
        .set("Authorization", viewerToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNetworkStats);
    });
  });

  describe("GET /networks/:networkCode/outliers", () => {
    const mockNetworkOutliers = [
      {
        sensorMacAddress: "sensor1",
        outliers: [
          { createdAt: "2023-01-01T00:00:00Z", value: 100.0 }
        ]
      }
    ];

    it("should get network outliers (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getOutliersFromSensorsInNetwork as jest.Mock).mockResolvedValue(mockNetworkOutliers);

      const response = await request(app)
        .get("/api/v1/networks/test-network/outliers")
        .set("Authorization", adminToken)
        .query({ 
          sensorMacs: ["sensor1"],
          startDate: "2023-01-01",
          endDate: "2023-01-02"
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNetworkOutliers);
      expect(measurementsController.getOutliersFromSensorsInNetwork).toHaveBeenCalledWith(
        "test-network",
        ["sensor1"],
        "2023-01-01",
        "2023-01-02"
      );
    });

    it("should get network outliers (viewer)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getOutliersFromSensorsInNetwork as jest.Mock).mockResolvedValue(mockNetworkOutliers);

      const response = await request(app)
        .get("/api/v1/networks/test-network/outliers")
        .set("Authorization", viewerToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNetworkOutliers);
    });
  });

  describe("Error handling", () => {
    it("should handle internal server errors", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementsController.getMeasurementsFromSensor as jest.Mock).mockRejectedValue(new Error("Internal error"));

      const response = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors/test-sensor/measurements")
        .set("Authorization", adminToken);

      expect(response.status).toBe(500);
      expect(response.body.message).toMatch(/Internal server error/);
    });
  });
});