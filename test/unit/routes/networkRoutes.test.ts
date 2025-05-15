import { Router } from "express";
import { UserType } from "@models/UserType";
import * as networkController from "@controllers/networkController";
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

// Mock the network controller
jest.mock("@controllers/networkController");

describe("Network Routes", () => {
  let router: any;
  const { res, next, clearMockRes } = getMockRes();

  beforeEach(() => {
    clearMockRes();
    router = Router();
    jest.clearAllMocks();
    require("@routes/networkRoutes");
  });

  describe("GET /networks", () => {
    it("should set up route with authentication", () => {
      expect(router.get).toHaveBeenCalledWith(
        "",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalled();
    });

    it("should return networks on successful request", async () => {
      const networks = [
        { code: "net1", name: "Network 1", description: "First network" },
        { code: "net2", name: "Network 2", description: "Second network" }
      ];
      (networkController.getAllNetworks as jest.Mock).mockResolvedValue(networks);

      const req = getMockReq();
      const handler = router.get.mock.calls[0][1];

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(networks);
    });

    it("should handle errors", async () => {
      const error = new AppError("Test error", 500);
      (networkController.getAllNetworks as jest.Mock).mockRejectedValue(error);

      const req = getMockReq();
      const handler = router.get.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("POST /networks", () => {
    it("should set up route with admin/operator authentication", () => {
      expect(router.post).toHaveBeenCalledWith(
        "",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalledWith([
        UserType.Admin,
        UserType.Operator
      ]);
    });

    it("should create network on successful request", async () => {
      const networkData = {
        code: "test-net",
        name: "Test Network",
        description: "Test Description"
      };
      (networkController.createNetwork as jest.Mock).mockResolvedValue(undefined);

      const req = getMockReq({ body: networkData });
      const handler = router.post.mock.calls[0][1];

      await handler(req, res, next);

      expect(networkController.createNetwork).toHaveBeenCalledWith(networkData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });

    it("should handle validation error for missing code", async () => {
      const networkData = {
        name: "Test Network",
        description: "Test Description"
      };

      const req = getMockReq({ body: networkData });
      const handler = router.post.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Network code is required",
          statusCode: 400
        })
      );
    });
  });

  describe("GET /networks/:networkCode", () => {
    it("should set up route with authentication", () => {
      expect(router.get).toHaveBeenCalledWith(
        "/:networkCode",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalled();
    });

    it("should return network on successful request", async () => {
      const network = {
        code: "test-net",
        name: "Test Network",
        description: "Test Description"
      };
      (networkController.getNetwork as jest.Mock).mockResolvedValue(network);

      const req = getMockReq({ params: { networkCode: "test-net" } });
      const handler = router.get.mock.calls[1][1];

      await handler(req, res, next);

      expect(networkController.getNetwork).toHaveBeenCalledWith("test-net");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(network);
    });

    it("should handle not found error", async () => {
      const error = new AppError("Network not found", 404);
      (networkController.getNetwork as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { networkCode: "non-existent" } });
      const handler = router.get.mock.calls[1][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("PATCH /networks/:networkCode", () => {
    it("should set up route with admin/operator authentication", () => {
      expect(router.patch).toHaveBeenCalledWith(
        "/:networkCode",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalledWith([
        UserType.Admin,
        UserType.Operator
      ]);
    });

    it("should update network on successful request", async () => {
      const updateData = {
        name: "Updated Network",
        description: "Updated Description"
      };
      (networkController.updateNetwork as jest.Mock).mockResolvedValue(undefined);

      const req = getMockReq({
        params: { networkCode: "test-net" },
        body: updateData
      });
      const handler = router.patch.mock.calls[0][1];

      await handler(req, res, next);

      expect(networkController.updateNetwork).toHaveBeenCalledWith(
        "test-net",
        updateData
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe("DELETE /networks/:networkCode", () => {
    it("should set up route with admin/operator authentication", () => {
      expect(router.delete).toHaveBeenCalledWith(
        "/:networkCode",
        expect.any(Function),
        expect.any(Function)
      );
      expect(authenticateUser).toHaveBeenCalledWith([
        UserType.Admin,
        UserType.Operator
      ]);
    });

    it("should delete network on successful request", async () => {
      (networkController.deleteNetwork as jest.Mock).mockResolvedValue(undefined);

      const req = getMockReq({ params: { networkCode: "test-net" } });
      const handler = router.delete.mock.calls[0][1];

      await handler(req, res, next);

      expect(networkController.deleteNetwork).toHaveBeenCalledWith("test-net");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should handle not found error", async () => {
      const error = new AppError("Network not found", 404);
      (networkController.deleteNetwork as jest.Mock).mockRejectedValue(error);

      const req = getMockReq({ params: { networkCode: "non-existent" } });
      const handler = router.delete.mock.calls[0][1];

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 