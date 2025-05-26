import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService"; 
import * as gatewayController from "@controllers/gatewayController";
import { UserType } from "@models/UserType";
import { Gateway as GatewayDTO } from "@dto/Gateway";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

jest.mock("@services/authService");
jest.mock("@controllers/gatewayController");

describe("GatewayRoutes integration", () => {
  const token = "Bearer faketoken";
  const adminToken = "Bearer admintoken";
  const operatorToken = "Bearer operatortoken";
  const viewerToken = "Bearer viewertoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /networks/:networkCode/gateways", () => {
    const mockGateways: GatewayDTO[] = [
      { macAddress: "mac1", name: "Gateway 1", description: "First gateway", networkCode: "net1" },
      { macAddress: "mac2", name: "Gateway 2", description: "Second gateway", networkCode: "net2" }
    ];

    it("should get all gateways (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.getAllGateways as jest.Mock).mockResolvedValue(mockGateways);

      const response = await request(app)
        .get("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGateways);
      expect(gatewayController.getAllGateways).toHaveBeenCalled();
    });

    it("should get all gateways (operator)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.getAllGateways as jest.Mock).mockResolvedValue(mockGateways);

      const response = await request(app)
        .get("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", operatorToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGateways);
    });

    it("should get all gateways (viewer)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.getAllGateways as jest.Mock).mockResolvedValue(mockGateways);

      const response = await request(app)
        .get("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", viewerToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGateways);
    });

    it("should return 401 without auth token", async () => {
      const response = await request(app).get("/api/v1/networks/:networkCode/gateways");
      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("should return 404 for non-existent network", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.getAllGateways as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Network not found");
      });

      const response = await request(app)
        .get("/api/v1/networks/non-existent")
        .set("Authorization", token);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });
  });

  describe("POST /networks/:networkCode/gateways", () => {
    const newGateway: GatewayDTO = {
      macAddress: "test-mac-address",
      name: "Test Gateway",
      description: "A gateway for testing",
      networkCode: "test-network"
    };

    it("should create gateway (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.createGateway as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", adminToken)
        .send(newGateway);

      expect(response.status).toBe(201);
      expect(gatewayController.createGateway).toHaveBeenCalledWith(newGateway);
    });

    it("should create gateway (operator)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.createGateway as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", operatorToken)
        .send(newGateway);

      expect(response.status).toBe(201);
    });

    it("should return 403 for viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const response = await request(app)
        .post("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", viewerToken)
        .send(newGateway);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("should return 404 for non-existent network", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.createGateway as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Network not found");
      });

      const response = await request(app)
        .get("/api/v1/networks/non-existent")
        .set("Authorization", token);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });

    it("should return 409 for duplicate gateway", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.createGateway as jest.Mock).mockImplementation(() => {
        throw new ConflictError("Gateway mac address already exists");
      });

      const response = await request(app)
        .post("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", adminToken)
        .send(newGateway);

      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/already exists/);
    });
  });

  describe("GET /networks/:networkCode/gateways/:macAddress", () => {
    const mockGateway: GatewayDTO = {
      macAddress: "test-mac-address",
      name: "Test Gateway",
      description: "A gateway for testing",
      networkCode: "test-network"
    };

    it("should get specific gateway", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.getGateway as jest.Mock).mockResolvedValue(mockGateway);

      const response = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-mac-address")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGateway);
      expect(gatewayController.getGateway).toHaveBeenCalledWith("test-mac-address", "test-network");
    });

    it("should return 404 for non-existent network", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.getGateway as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Network not found");
      });

      const response = await request(app)
        .get("/api/v1/networks/non-existent")
        .set("Authorization", token);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });

    it("should return 404 for non-existent gateway", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.getGateway as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Gateway not found");
      });

      const response = await request(app)
        .get("/api/v1/networks/test-network/gateways/non-existent")
        .set("Authorization", token);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });
  });

  describe("PATCH /networks/:networkCode/gateways/:macAddress", () => {
    const updateData = {
      name: "Updated Gateway",
      description: "Updated description"
    };

    it("should update gateway (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.updateGateway as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .patch("/api/v1/networks/test-network/gateways/test-mac-address")
        .set("Authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(204);
      expect(gatewayController.updateGateway).toHaveBeenCalledWith("test-mac-address", "test-network", updateData);
    });

    it("should update gateway (operator)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.updateGateway as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .patch("/api/v1/networks/test-network/gateways/test-mac-address")
        .set("Authorization", operatorToken)
        .send(updateData);

      expect(response.status).toBe(204);
    });

    it("should return 403 for viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const response = await request(app)
        .patch("/api/v1/networks/test-network/gateways/test-mac-address")
        .set("Authorization", viewerToken)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("should return 404 for non-existent network", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.updateGateway as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Network not found");
      });

      const response = await request(app)
        .patch("/api/v1/networks/non-existent")
        .set("Authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });

    it("should return 404 for non-existent gateway", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.updateGateway as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Gateway not found");
      });

      const response = await request(app)
        .patch("/api/v1/networks/test-network/gateways/non-existent")
        .set("Authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });
  });

  describe("DELETE /networks/:networkCode/gateways/:macAddress", () => {
    it("should delete gateway (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.deleteGateway as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete("/api/v1/networks/test-network/gateways/test-mac-address")
        .set("Authorization", adminToken);

      expect(response.status).toBe(204);
      expect(gatewayController.deleteGateway).toHaveBeenCalledWith("test-mac-address", "test-network");
    });

    it("should delete gateway (operator)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.deleteGateway as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete("/api/v1/networks/test-network/gateways/test-mac-address")
        .set("Authorization", operatorToken);
      expect(response.status).toBe(204);
    });

    it("should return 403 for viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const response = await request(app)
        .delete("/api/v1/networks/test-network/gateways/test-mac-address")
        .set("Authorization", viewerToken);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("should return 404 for non-existent network", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.deleteGateway as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Network not found");
      });

      const response = await request(app)
        .delete("/api/v1/networks/non-existent")
        .set("Authorization", adminToken);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });

    it("should return 404 for non-existent gateway", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (gatewayController.deleteGateway as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Gateway not found");
      });

      const response = await request(app)
        .delete("/api/v1/networks/test-network/gateways/non-existent")
        .set("Authorization", adminToken);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });
  });
}); 