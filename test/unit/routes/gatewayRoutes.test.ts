import { Router } from "express";
import { UserType } from "@models/UserType";
import * as gatewayController from "@controllers/gatewayController";
import { authenticateUser } from "@middlewares/authMiddleware";
import { getMockReq, getMockRes } from "@jest-mock/express";
import AppError from "@models/errors/AppError";

// Mock the express Router
jest.mock("express", () => ({
  Router: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }))
}));

// Mock the authentication middleware
jest.mock("@middlewares/authMiddleware", () => ({
  authenticateUser: jest.fn(() => (req: any, res: any, next: any) => next())
}));

// Mock the gateway controller
jest.mock("@controllers/gatewayController");

describe("Gateway Routes", () => {
  let router: any;
  const { res, next, clearMockRes } = getMockRes();

  beforeEach(() => {
    clearMockRes();
    router = Router();
    jest.clearAllMocks();
    require("@routes/gatewayRoutes");
  });

  describe("GET /networks/:networkCode/gateways", () => {
    it("should set up route with authentication", () => {
      expect(router.get).toHaveBeenCalledWith(
        "/:networkCode/gateways",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalled();
    });

    it("should return gateways on successful request", async () => {
      const gateways = [
        { macAddress: "mac1", name: "Gateway 1", description: "First gateway", networkCode: "net1" },
        { macAddress: "mac2", name: "Gateway 2", description: "Second gateway", networkCode: "net2" }
      ];
      (gatewayController.getAllGateways as jest.Mock).mockResolvedValue(gateways);

      const req = getMockReq();
      const handler = router.get.mock.calls[0][1];

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(gateways);
    });

    it("should handle not found error", async () => {
      const error = new AppError("Network not found", 404);
      (gatewayController.getAllGateways as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { networkCode: "non-existent" } });
      const handler = router.get.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should handle errors", async () => {
      const error = new AppError("Test error", 500);
      (gatewayController.getAllGateways as jest.Mock).mockRejectedValue(error);

      const req = getMockReq();
      const handler = router.get.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("POST /networks/:networkCode/gateways", () => {
    it("should set up route with admin/operator authentication", () => {
      expect(router.post).toHaveBeenCalledWith(
        "/:networkCode/gateways",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalledWith([
        UserType.Admin,
        UserType.Operator
      ]);
    });

    it("should create gateway on successful request", async () => {
      const gatewayData = {
        macAddress: "test-mac-address",
        name: "Test Gateway",
        description: "Test Description",
        networkCode: "test-network"
      };
      (gatewayController.createGateway as jest.Mock).mockResolvedValue(undefined);

      const req = getMockReq({ body: gatewayData });
      const handler = router.post.mock.calls[0][1];

      await handler(req, res, next);

      expect(gatewayController.createGateway).toHaveBeenCalledWith(gatewayData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });

    it("should handle validation error for missing code", async () => {
      const gatewayData = {
        name: "Test Gateway",
        description: "Test Description",
        networkCode: "test-network"
      };

      const req = getMockReq({ body: gatewayData });
      const handler = router.post.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Gateway code is required",
          statusCode: 400
        })
      );
    });

    it("should handle not found error", async () => {
      const error = new AppError("Network not found", 404);
      (gatewayController.createGateway as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { networkCode: "non-existent" } });
      const handler = router.post.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("GET /networks/:networkCode/gateways/:macAddress", () => {
    it("should set up route with authentication", () => {
      expect(router.get).toHaveBeenCalledWith(
        "/:networkCode/gateways/:macAddress",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalled();
    });

    it("should return gateway on successful request", async () => {
      const gateway = {
        macAddress: "test-mac-address",
        name: "Test Gateway",
        description: "Test Description",
        networkCode: "test-network"
      };
      (gatewayController.getGateway as jest.Mock).mockResolvedValue(gateway);

      const req = getMockReq({ params: { networkCode: "test-network", macAddress: "test-mac-address" } });
      const handler = router.get.mock.calls[1][1];

      await handler(req, res, next);

      expect(gatewayController.getGateway).toHaveBeenCalledWith("test-mac-address", "test-network");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(gateway);
    });

    it("should handle not found error", async () => {
      const error = new AppError("Network not found", 404);
      (gatewayController.getGateway as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { networkCode: "non-existent" } });
      const handler = router.get.mock.calls[1][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should handle not found error", async () => {
      const error = new AppError("Gateway not found", 404);
      (gatewayController.getGateway as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { networkCode: "test-network", macAddress: "non-existent" } });
      const handler = router.get.mock.calls[1][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("PATCH /networks/:networkCode/gateways/:macAddress", () => {
    it("should set up route with admin/operator authentication", () => {
      expect(router.patch).toHaveBeenCalledWith(
        "/:networkCode/gateways/:macAddress",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalledWith([
        UserType.Admin,
        UserType.Operator
      ]);
    });

    it("should update gateway on successful request", async () => {
      const updateData = {
        name: "Updated Gateway",
        description: "Updated Description"
      };
      (gatewayController.updateGateway as jest.Mock).mockResolvedValue(undefined);

      const req = getMockReq({
        params: { networkCode: "test-network", macAddress: "test-mac-address" },
        body: updateData
      });
      const handler = router.patch.mock.calls[0][1];

      await handler(req, res, next);

      expect(gatewayController.updateGateway).toHaveBeenCalledWith(
        "test-mac-address",
        "test-network",
        updateData
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should handle not found error", async () => {
      const error = new AppError("Network not found", 404);
      (gatewayController.updateGateway as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { networkCode: "non-existent" } });
      const handler = router.patch.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should handle not found error", async () => {
      const error = new AppError("Gateway not found", 404);
      (gatewayController.updateGateway as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { networkCode: "test-network", macAddress: "non-existent" } });
      const handler = router.patch.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("DELETE /networks/:networkCode/gateways/:macAddress", () => {
    it("should set up route with admin/operator authentication", () => {
      expect(router.delete).toHaveBeenCalledWith(
        "/:networkCode/gateways/:macAddress",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalledWith([
        UserType.Admin,
        UserType.Operator
      ]);
    });

    it("should delete gateway on successful request", async () => {
      (gatewayController.deleteGateway as jest.Mock).mockResolvedValue(undefined);

      const req = getMockReq({ params: { networkCode: "test-network", macAddress: "test-mac-address" } });
      const handler = router.delete.mock.calls[0][1];

      await handler(req, res, next);

      expect(gatewayController.deleteGateway).toHaveBeenCalledWith("test-mac-address", "test-network");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should handle not found error", async () => {
      const error = new AppError("Network not found", 404);
      (gatewayController.deleteGateway as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { networkCode: "non-existent" } });
      const handler = router.delete.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should handle not found error", async () => {
      const error = new AppError("Gateway not found", 404);
      (gatewayController.deleteGateway as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { networkCode: "test-network", macAddress: "non-existent" } });
      const handler = router.delete.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});