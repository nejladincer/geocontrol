import { Router } from "express";
import { UserType } from "@models/UserType";
import * as sensorController from "@controllers/SensorController";
import { authenticateUser } from "@middlewares/authMiddleware";
import { getMockReq, getMockRes } from "@jest-mock/express";
import AppError from "@models/errors/AppError";

// Mock express Router
jest.mock("express", () => ({
  Router: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }))
}));

// Mock authentication
jest.mock("@middlewares/authMiddleware", () => ({
  authenticateUser: jest.fn(() => (req: any, res: any, next: any) => next())
}));

// Mock sensor controller
jest.mock("@controllers/SensorController");

describe("Sensor Routes", () => {
  let router: any;
  const { res, next, clearMockRes } = getMockRes();

  beforeEach(() => {
    clearMockRes();
    router = Router();
    jest.clearAllMocks();
    require("@routes/sensorRoutes");
  });

  describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors", () => {
    it("should set up route with authentication", () => {
      expect(router.get).toHaveBeenCalledWith(
        "/networks/:networkCode/gateways/:gatewayMac/sensors",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalled();
    });

    it("should return sensors on success", async () => {
      const sensors = [{ macAddress: "mac1" }, { macAddress: "mac2" }];
      (sensorController.getAllSensors as jest.Mock).mockResolvedValue(sensors);

      const req = getMockReq({ params: { gatewayMac: "gateway1" } });
      const handler = router.get.mock.calls[0][1];

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(sensors);
    });

    it("should handle error", async () => {
      const error = new AppError("Gateway not found", 404);
      (sensorController.getAllSensors as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { gatewayMac: "invalid" } });
      const handler = router.get.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("POST /networks/:networkCode/gateways/:gatewayMac/sensors", () => {
    it("should set up route with role-based auth", () => {
      expect(router.post).toHaveBeenCalledWith(
        "/networks/:networkCode/gateways/:gatewayMac/sensors",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalledWith([
        UserType.Admin,
        UserType.Operator
      ]);
    });

    it("should create a sensor on success", async () => {
      (sensorController.createSensor as jest.Mock).mockResolvedValue(undefined);

      const req = getMockReq({
        params: { gatewayMac: "macG1" },
        body: { macAddress: "sensor1", variable: "temperature" }
      });
      const handler = router.post.mock.calls[0][1];

      await handler(req, res, next);

      expect(sensorController.createSensor).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });

    it("should handle creation error", async () => {
      const error = new AppError("Invalid data", 400);
      (sensorController.createSensor as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({
        params: { gatewayMac: "macG1" },
        body: {}
      });
      const handler = router.post.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac", () => {
    it("should set up route with authentication", () => {
      expect(router.get).toHaveBeenCalledWith(
        "/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac",
        expect.any(Function),
        expect.any(Function)
      );
    });

    it("should return one sensor", async () => {
      const sensor = { macAddress: "sensor1" };
      (sensorController.getSensor as jest.Mock).mockResolvedValue(sensor);

      const req = getMockReq({ params: { sensorMac: "sensor1" } });
      const handler = router.get.mock.calls[1][1];

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(sensor);
    });

    it("should handle not found error", async () => {
      const error = new AppError("Sensor not found", 404);
      (sensorController.getSensor as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { sensorMac: "not-exist" } });
      const handler = router.get.mock.calls[1][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("PATCH /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac", () => {
    it("should set up route with admin/operator authentication", () => {
      expect(router.patch).toHaveBeenCalledWith(
        "/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalledWith([
        UserType.Admin,
        UserType.Operator
      ]);
    });

    it("should update sensor on success", async () => {
      (sensorController.updateSensor as jest.Mock).mockResolvedValue(undefined);

      const req = getMockReq({
        params: { sensorMac: "sensor1" },
        body: { name: "Updated Name" }
      });
      const handler = router.patch.mock.calls[0][1];

      await handler(req, res, next);

      expect(sensorController.updateSensor).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should handle update error", async () => {
      const error = new AppError("Update failed", 400);
      (sensorController.updateSensor as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { sensorMac: "sensor1" }, body: {} });
      const handler = router.patch.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("DELETE /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac", () => {
    it("should set up route with admin/operator authentication", () => {
      expect(router.delete).toHaveBeenCalledWith(
        "/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalledWith([
        UserType.Admin,
        UserType.Operator
      ]);
    });

    it("should delete sensor on success", async () => {
      (sensorController.deleteSensor as jest.Mock).mockResolvedValue(undefined);

      const req = getMockReq({ params: { sensorMac: "sensor1" } });
      const handler = router.delete.mock.calls[0][1];

      await handler(req, res, next);

      expect(sensorController.deleteSensor).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should handle delete error", async () => {
      const error = new AppError("Delete failed", 404);
      (sensorController.deleteSensor as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { sensorMac: "sensor1" } });
      const handler = router.delete.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
