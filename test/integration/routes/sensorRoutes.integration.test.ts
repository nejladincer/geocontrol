import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as sensorController from "@controllers/SensorController";
import { UserType } from "@models/UserType";
import { Sensor as SensorDTO } from "@dto/Sensor";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

jest.mock("@services/authService");
jest.mock("@controllers/SensorController");

describe("SensorRoutes integration", () => {
  const token = "Bearer faketoken";
  const adminToken = "Bearer admintoken";
  const operatorToken = "Bearer operatortoken";
  const viewerToken = "Bearer viewertoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors", () => {
    const mockSensors: SensorDTO[] = [
      { macAddress: "sensor1", name: "Sensor 1", variable: "temp", unit: "C" },
      { macAddress: "sensor2", name: "Sensor 2", variable: "humidity", unit: "%" }
    ];

    it("should return sensors (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.getAllSensors as jest.Mock).mockResolvedValue(mockSensors);

      const res = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSensors);
      expect(sensorController.getAllSensors).toHaveBeenCalled();
    });
    it("should get all sensor (operator)", async () => {
          (authService.processToken as jest.Mock).mockResolvedValue(undefined);
          (sensorController.getAllSensors as jest.Mock).mockResolvedValue(mockSensors);
    
          const res = await request(app)
            .get("/api/v1/networks/:networkCode/gateways/test-gateway/sensors")
            .set("Authorization", operatorToken);
    
          expect(res.status).toBe(200);
          expect(res.body).toEqual(mockSensors);
        });

    it("should return sensors (viewer)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.getAllSensors as jest.Mock).mockResolvedValue(mockSensors);

      const res = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors")
        .set("Authorization", viewerToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSensors);

    });

    it("should return 401 if token is missing", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized: No token provided");
      });
      const res = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors");
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/);
    });

    it("should return 404 if gateway not found", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.getAllSensors as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Gateway not found");
      });

      const res = await request(app)
        .get("/api/v1/networks/test-network/gateways/invalid/sensors")
        .set("Authorization", adminToken);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/);

    });
    it("should return 500 on unknown error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.getAllSensors as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });
      const res = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors")
        .set("Authorization", adminToken);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Internal server error");
    });
  });

  describe("POST /networks/:networkCode/gateways/:gatewayMac/sensors", () => {
    const newSensor: SensorDTO = {
      macAddress: "sensor1",
      name: "New Sensor",
      description: "Description",
      variable: "temperature",
      unit: "C"
    };

    it("should create sensor (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.createSensor as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/v1/networks/test-network/gateways/test-gateway/sensors")
        .set("Authorization", adminToken)
        .send(newSensor);

      expect(res.status).toBe(201);
      expect(sensorController.createSensor).toHaveBeenCalledWith(newSensor, "test-gateway", "test-network");
      
    });

    it("should create sensor (operator)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.createSensor as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/v1/networks/test-network/gateways/test-gateway/sensors")
        .set("Authorization", operatorToken)
        .send(newSensor);

      expect(res.status).toBe(201);
    });

    it("should return 403 for viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const res = await request(app)
        .post("/api/v1/networks/test-network/gateways/test-gateway/sensors")
        .set("Authorization", viewerToken)
        .send(newSensor);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Insufficient rights/);

    });

    it("should return 404 for non-existent gateway", async () => {
          (authService.processToken as jest.Mock).mockResolvedValue(undefined);
          (sensorController.createSensor as jest.Mock).mockImplementation(() => {
            throw new NotFoundError("Gateway not found");
          });
    
          const res = await request(app)
            .post("/api/v1/networks/test-network/gateways/non-existent/sensors")
            .set("Authorization", token)
            .send(newSensor);

          expect(res.status).toBe(404);
          expect(res.body.message).toMatch(/not found/);
        });

        it("should return 500 on unknown error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.createSensor as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const res = await request(app)
        .post("/api/v1/networks/test-network/gateways/test-gateway/sensors")
        .set("Authorization", adminToken)
        .send(newSensor);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Internal server error");
    });

    it("should return 409 for duplicate sensor", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.createSensor as jest.Mock).mockImplementation(() => {
        throw new ConflictError("Sensor already exists");
      });

      const res = await request(app)
        .post("/api/v1/networks/test-network/gateways/test-gateway/sensors")
        .set("Authorization", adminToken)
        .send(newSensor);

      expect(res.status).toBe(409);
    });
  });

  describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac", () => {
  const mockSensor: SensorDTO = {
    macAddress: "sensor1",
    name: "Sensor 1",
    variable: "pressure",
    unit: "bar"
  };

  it("should return sensor (authenticated)", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.getSensor as jest.Mock).mockResolvedValue(mockSensor);

    const res = await request(app)
      .get("/api/v1/networks/test-network/gateways/test-gateway/sensors/sensor1")
      .set("Authorization", viewerToken);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockSensor);
  });

  it("should return 404 for non-existent sensor", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.getSensor as jest.Mock).mockImplementation(() => {
      throw new NotFoundError("Sensor not found");
    });

    const res = await request(app)
      .get("/api/v1/networks/test-network/gateways/test-gateway/sensors/non-existent")
      .set("Authorization", viewerToken);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/);
  });

  it("should return 500 on unknown error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.getSensor as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const res = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-gateway/sensors/sensor1")
        .set("Authorization", adminToken);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Internal server error");
    });
});


  describe("PATCH /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac", () => {
    const updateData = {
      name: "Updated Sensor",
      description: "Updated desc"
    };

    it("should update sensor (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.updateSensor as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .patch("/api/v1/networks/test-network/gateways/test-gateway/sensors/sensor1")
        .set("Authorization", adminToken)
        .send(updateData);

      expect(res.status).toBe(204);
    });

    
    it("should return 403 for viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const res = await request(app)
        .patch("/api/v1/networks/test-network/gateways/test-gateway/sensors/sensor1")
        .set("Authorization", viewerToken)
        .send(updateData);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Insufficient rights/);

    });

    it("should return 404 for sensor not found", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.updateSensor as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Sensor not found");
      });

      const res = await request(app)
        .patch("/api/v1/networks/test-network/gateways/test-gateway/sensors/invalid")
        .set("Authorization", adminToken)
        .send(updateData);

      expect(res.status).toBe(404);
    });
    it("should return 500 on unknown error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.updateSensor as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const res = await request(app)
        .patch("/api/v1/networks/test-network/gateways/test-gateway/sensors/sensor1")
        .set("Authorization", adminToken)
        .send(updateData);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Internal server error");
    });
  });

  describe("DELETE /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac", () => {
    it("should delete sensor (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.deleteSensor as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .delete("/api/v1/networks/test-network/gateways/test-gateway/sensors/sensor1")
        .set("Authorization", adminToken);

      expect(res.status).toBe(204);
    });

    it("should return 403 for viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const res = await request(app)
        .delete("/api/v1/networks/test-network/gateways/test-gateway/sensors/sensor1")
        .set("Authorization", viewerToken);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Insufficient rights/);

    });

    it("should return 404 for sensor not found", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.deleteSensor as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Sensor not found");
      });

      const res = await request(app)
        .delete("/api/v1/networks/test-network/gateways/test-gateway/sensors/non-existent")
        .set("Authorization", adminToken);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/);

    });
    it("should return 500 on unknown error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (sensorController.deleteSensor as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const res = await request(app)
        .delete("/api/v1/networks/test-network/gateways/test-gateway/sensors/sensor1")
        .set("Authorization", adminToken);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Internal server error");
    });
  });
});
