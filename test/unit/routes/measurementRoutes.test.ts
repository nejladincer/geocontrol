import { getMockReq, getMockRes } from "@jest-mock/express";
import { authenticateUser } from "@middlewares/authMiddleware";
import * as measurementsController from "@controllers/measurementsController";
import { UserType } from "@models/UserType";
import AppError from "@models/errors/AppError";

const routerMock = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

jest.mock("express", () => ({
  ...jest.requireActual("express"),
  Router: () => routerMock,
}));

jest.mock("@middlewares/authMiddleware", () => ({
  authenticateUser: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

jest.mock("@controllers/measurementsController");

describe("Measurement Routes", () => {
  const { res, next, clearMockRes } = getMockRes();

  beforeEach(() => {
    clearMockRes();
    jest.clearAllMocks();
    require("@routes/measurementRoutes");
  });

  describe("Route Registration", () => {
    it("should register all routes with proper authentication", () => {
      expect(routerMock.post).toHaveBeenCalledWith(
        "/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements",
        expect.any(Function),
        expect.any(Function)
      );
      expect(routerMock.get).toHaveBeenCalledWith(
        "/networks/:networkCode/measurements",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalledWith([UserType.Admin, UserType.Operator, UserType.Viewer]);
    });
  });

  describe("POST /measurements", () => {
    it("should store measurement successfully", async () => {
      const req = getMockReq({
        params: { networkCode: "net1", gatewayMac: "mac1", sensorMac: "sens1" },
        body: { createdAt: "2023-01-01T00:00:00Z", value: 42 }
      });
      const handler = routerMock.post.mock.calls[0][1];

      await handler(req, res, next);

      expect(measurementsController.storeMeasurementForSensor).toHaveBeenCalledWith(
        "net1", "mac1", "sens1", "2023-01-01T00:00:00Z", 42
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should handle validation error", async () => {
      const req = getMockReq({
        params: { networkCode: "net1", gatewayMac: "mac1", sensorMac: "sens1" },
        body: {}
      });
      const handler = routerMock.post.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe("GET /measurements", () => {
    it("should return network measurements successfully", async () => {
      const measurements = [
        { sensorMacAddress: "sens1", measurements: [] }
      ];
      (measurementsController.getMeasurementsFromSensorsInNetwork as jest.Mock)
        .mockResolvedValue(measurements);

      const req = getMockReq({
        params: { networkCode: "net1" },
        query: { startDate: "2023-01-01", endDate: "2023-01-02" }
      });
      expect(routerMock.get.mock.calls[0]).toBeDefined();
      const handler = routerMock.get.mock.calls[0][1];

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(measurements);
    });

    it("should handle error from controller", async () => {
      const error = new AppError("Test error", 500);
      (measurementsController.getMeasurementsFromSensorsInNetwork as jest.Mock)
        .mockRejectedValue(error);

      const req = getMockReq({ params: { networkCode: "net1" } });
      expect(routerMock.get.mock.calls[0]).toBeDefined();
      const handler = routerMock.get.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });


  });
  
});
