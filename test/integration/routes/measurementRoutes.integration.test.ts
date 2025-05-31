import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as measurementController from "@controllers/measurementsController";
import { UserType } from "@models/UserType";
import { Measurement as MeasurementDTO } from "@dto/Measurement";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { BadRequestError } from "../../../src/models/errors/BadRequestError";

jest.mock("@services/authService");
jest.mock("@controllers/measurementsController");

describe("MeasurementRoutes integration", () => {
  const adminToken = "Bearer admintoken";
  const operatorToken = "Bearer operatortoken";
  const viewerToken = "Bearer viewertoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements", () => {
    const mockMeasurements: MeasurementDTO[] = [
      { createdAt: new Date(), value: 42, isOutlier: false }
    ];

    it("should return measurements (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getMeasurementsFromSensor as jest.Mock).mockResolvedValue(mockMeasurements);

      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body[0]).toMatchObject({
        value: 42,
        isOutlier: false
      });
      expect(new Date(res.body[0].createdAt).getTime()).toBeCloseTo(mockMeasurements[0].createdAt.getTime(), -2);
      expect(measurementController.getMeasurementsFromSensor).toHaveBeenCalled();
    });

    it("should return 401 if token is missing", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized: No token provided");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/);
    });

    it("should return 404 if sensor not found", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getMeasurementsFromSensor as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Sensor not found");
      });

      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/invalid/measurements")
        .set("Authorization", adminToken);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/);
    });

    it("should return empty array if no measurements", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getMeasurementsFromSensor as jest.Mock).mockResolvedValue([]);
      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .set("Authorization", adminToken);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return multiple measurements", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      const mockMeasurements = [
        { createdAt: new Date(), value: 42, isOutlier: false },
        { createdAt: new Date(), value: 43, isOutlier: true }
      ];
      (measurementController.getMeasurementsFromSensor as jest.Mock).mockResolvedValue(mockMeasurements);
      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .set("Authorization", adminToken);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it("should return 500 on internal error for GET measurements", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getMeasurementsFromSensor as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .set("Authorization", adminToken);
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Internal server error|Unexpected error/);
    });

    it("should return 401 for invalid token on GET measurements", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized: Invalid token format");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .set("Authorization", "Bearer invalidtoken");
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/);
    });

    it("should return 409 for conflict on GET measurements", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getMeasurementsFromSensor as jest.Mock).mockImplementation(() => {
        throw new ConflictError("Measurement conflict");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .set("Authorization", adminToken);
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/Measurement conflict/);
    });

    it("should return 404 for network not found on GET measurements", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getMeasurementsFromSensorsInNetwork as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Network not found");
      });
      const res = await request(app)
        .get("/api/v1/networks/invalid-network/measurements")
        .set("Authorization", adminToken);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Network not found/);
    });
  });

  describe("POST /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements", () => {
    const newMeasurements = [
      { createdAt: new Date().toISOString(), value: 1.23 }
    ];

    it("should store measurements (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.storeMeasurementForSensor as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .set("Authorization", adminToken)
        .send(newMeasurements);

      expect(res.status).toBe(201);
      expect(measurementController.storeMeasurementForSensor).toHaveBeenCalled();
    });

    it("should return 401 if token is missing", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized: No token provided");
      });
      const res = await request(app)
        .post("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .send(newMeasurements);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/);
    });

    it("should return 403 for viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });
      const res = await request(app)
        .post("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .set("Authorization", viewerToken)
        .send(newMeasurements);
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Insufficient rights/);
    });

    it("should return 400 for invalid input", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.storeMeasurementForSensor as jest.Mock).mockImplementation(() => {
        throw new BadRequestError("Each measurement must have createdAt and value fields");
      });
      const res = await request(app)
        .post("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .set("Authorization", adminToken)
        .send([{ value: 1.23 }]); // missing createdAt
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Each measurement must have createdAt and value fields/);
    });

    it("should return 409 for conflict", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.storeMeasurementForSensor as jest.Mock).mockImplementation(() => {
        throw new ConflictError("Measurement already exists");
      });
      const res = await request(app)
        .post("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .set("Authorization", adminToken)
        .send(newMeasurements);
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/);
    });

    it("should return 500 on internal error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.storeMeasurementForSensor as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });
      const res = await request(app)
        .post("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .set("Authorization", adminToken)
        .send(newMeasurements);
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Internal server error|Unexpected error/);
    });

    it("should return 400 for empty body", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.storeMeasurementForSensor as jest.Mock).mockImplementation(() => {
        throw new BadRequestError("Measurements array cannot be empty");
      });
      const res = await request(app)
        .post("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .set("Authorization", adminToken)
        .send([]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Measurements array cannot be empty/);
    });

    it("should return 400 for invalid value type", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.storeMeasurementForSensor as jest.Mock).mockImplementation(() => {
        throw new BadRequestError("Measurement value must be a number");
      });
      const res = await request(app)
        .post("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/measurements")
        .set("Authorization", adminToken)
        .send([{ createdAt: new Date().toISOString(), value: "not-a-number" }]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Measurement value must be a number/);
    });
  });

  describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/stats", () => {
    const mockStats = {
      startDate: "2025-02-18T15:00:00Z",
      endDate: "2025-02-18T17:00:00Z",
      mean: 23.45,
      variance: 7.56,
      upperThreshold: 28.95,
      lowerThreshold: 17.95
    };

    it("should return stats (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getStatsFromSensor as jest.Mock).mockResolvedValue(mockStats);

      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/stats")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStats);
      expect(measurementController.getStatsFromSensor).toHaveBeenCalled();
    });

    it("should return 404 if sensor not found", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getStatsFromSensor as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Sensor not found");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/invalid/stats")
        .set("Authorization", adminToken);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/);
    });

    it("should return 403 for viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/stats")
        .set("Authorization", viewerToken);
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Insufficient rights/);
    });

    it("should return 400 for invalid date", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getStatsFromSensor as jest.Mock).mockImplementation(() => {
        throw new BadRequestError("Invalid date format");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/stats?startDate=notadate")
        .set("Authorization", adminToken);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid date format/);
    });

    it("should return 500 on internal error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getStatsFromSensor as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/stats")
        .set("Authorization", adminToken);
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Internal server error|Unexpected error/);
    });

    it("should return 401 for invalid token", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized: Invalid token format");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/stats")
        .set("Authorization", "Bearer invalidtoken");
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/);
    });
  });

  describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/outliers", () => {
    const mockOutliers = {
      sensorMac: "AA:BB:CC:DD:EE:FF",
      stats: {
        startDate: "2025-02-18T15:00:00Z",
        endDate: "2025-02-18T17:00:00Z",
        mean: 23.45,
        variance: 7.56,
        upperThreshold: 28.95,
        lowerThreshold: 17.95
      },
      measurements: [
        { createdAt: "2025-02-18T15:30:00Z", value: 30.86, isOutlier: true },
        { createdAt: "2025-02-18T16:00:00Z", value: 12.34, isOutlier: true }
      ]
    };

    it("should return outliers (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getOutliersFromSensor as jest.Mock).mockResolvedValue(mockOutliers);

      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/outliers")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockOutliers);
      expect(measurementController.getOutliersFromSensor).toHaveBeenCalled();
    });

    it("should return empty outliers", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getOutliersFromSensor as jest.Mock).mockResolvedValue({ ...mockOutliers, measurements: [] });
      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/outliers")
        .set("Authorization", adminToken);
      expect(res.status).toBe(200);
      expect(res.body.measurements).toEqual([]);
    });

    it("should return 500 on internal error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getOutliersFromSensor as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/gateways/00:1A:2B:3C:4D:5E/sensors/AA:BB:CC:DD:EE:FF/outliers")
        .set("Authorization", adminToken);
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Internal server error|Unexpected error/);
    });
  });

  describe("GET /networks/:networkCode/measurements", () => {
    const mockNetworkMeasurements = [
      {
        sensorMac: "AA:BB:CC:DD:EE:FF",
        stats: {
          startDate: "2025-02-18T15:00:00Z",
          endDate: "2025-02-18T17:00:00Z",
          mean: 23.45,
          variance: 7.56,
          upperThreshold: 28.95,
          lowerThreshold: 17.95
        },
        measurements: [
          { createdAt: "2025-02-18T15:30:00Z", value: 25.86, isOutlier: false },
          { createdAt: "2025-02-18T16:00:00Z", value: 25.34, isOutlier: false }
        ]
      }
    ];

    it("should return network measurements (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getMeasurementsFromSensorsInNetwork as jest.Mock).mockResolvedValue(mockNetworkMeasurements);

      const res = await request(app)
        .get("/api/v1/networks/net123/measurements")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockNetworkMeasurements);
      expect(measurementController.getMeasurementsFromSensorsInNetwork).toHaveBeenCalled();
    });

    it("should return empty array if no measurements", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getMeasurementsFromSensorsInNetwork as jest.Mock).mockResolvedValue([]);
      const res = await request(app)
        .get("/api/v1/networks/net123/measurements")
        .set("Authorization", adminToken);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return 400 for invalid date", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getMeasurementsFromSensorsInNetwork as jest.Mock).mockImplementation(() => {
        throw new BadRequestError("Invalid date format");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/measurements?startDate=notadate")
        .set("Authorization", adminToken);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid date format/);
    });

    it("should return 500 on internal error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getMeasurementsFromSensorsInNetwork as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/measurements")
        .set("Authorization", adminToken);
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Internal server error|Unexpected error/);
    });
  });

  describe("GET /networks/:networkCode/stats", () => {
    const mockNetworkStats = [
      {
        sensorMac: "AA:BB:CC:DD:EE:FF",
        stats: {
          startDate: "2025-02-18T15:00:00Z",
          endDate: "2025-02-18T17:00:00Z",
          mean: 23.45,
          variance: 7.56,
          upperThreshold: 28.95,
          lowerThreshold: 17.95
        }
      }
    ];

    it("should return network stats (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getStatsFromSensorsInNetwork as jest.Mock).mockResolvedValue(mockNetworkStats);

      const res = await request(app)
        .get("/api/v1/networks/net123/stats")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockNetworkStats);
      expect(measurementController.getStatsFromSensorsInNetwork).toHaveBeenCalled();
    });

    it("should return empty array if no stats", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getStatsFromSensorsInNetwork as jest.Mock).mockResolvedValue([]);
      const res = await request(app)
        .get("/api/v1/networks/net123/stats")
        .set("Authorization", adminToken);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return 400 for invalid date", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getStatsFromSensorsInNetwork as jest.Mock).mockImplementation(() => {
        throw new BadRequestError("Invalid date format");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/stats?startDate=notadate")
        .set("Authorization", adminToken);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid date format/);
    });

    it("should return 500 on internal error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getStatsFromSensorsInNetwork as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/stats")
        .set("Authorization", adminToken);
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Internal server error|Unexpected error/);
    });
  });

  describe("GET /networks/:networkCode/outliers", () => {
    const mockNetworkOutliers = [
      {
        sensorMac: "AA:BB:CC:DD:EE:FF",
        stats: {
          startDate: "2025-02-18T15:00:00Z",
          endDate: "2025-02-18T17:00:00Z",
          mean: 23.45,
          variance: 7.56,
          upperThreshold: 28.95,
          lowerThreshold: 17.95
        },
        measurements: [
          { createdAt: "2025-02-18T15:30:00Z", value: 30.86, isOutlier: true },
          { createdAt: "2025-02-18T16:00:00Z", value: 12.34, isOutlier: true }
        ]
      }
    ];

    it("should return network outliers (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getOutliersFromSensorsInNetwork as jest.Mock).mockResolvedValue(mockNetworkOutliers);

      const res = await request(app)
        .get("/api/v1/networks/net123/outliers")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockNetworkOutliers);
      expect(measurementController.getOutliersFromSensorsInNetwork).toHaveBeenCalled();
    });

    it("should return empty array if no outliers", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getOutliersFromSensorsInNetwork as jest.Mock).mockResolvedValue([]);
      const res = await request(app)
        .get("/api/v1/networks/net123/outliers")
        .set("Authorization", adminToken);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return 400 for invalid date", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getOutliersFromSensorsInNetwork as jest.Mock).mockImplementation(() => {
        throw new BadRequestError("Invalid date format");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/outliers?startDate=notadate")
        .set("Authorization", adminToken);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid date format/);
    });

    it("should return 500 on internal error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getOutliersFromSensorsInNetwork as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });
      const res = await request(app)
        .get("/api/v1/networks/net123/outliers")
        .set("Authorization", adminToken);
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Internal server error|Unexpected error/);
    });
  });
});
