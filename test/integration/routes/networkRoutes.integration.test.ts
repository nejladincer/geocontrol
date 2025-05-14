import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as networkController from "@controllers/networkController";
import { UserType } from "@models/UserType";
import { Network as NetworkDTO } from "@dto/Network";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

jest.mock("@services/authService");
jest.mock("@controllers/networkController");

describe("NetworkRoutes integration", () => {
  const token = "Bearer faketoken";
  const adminToken = "Bearer admintoken";
  const operatorToken = "Bearer operatortoken";
  const viewerToken = "Bearer viewertoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /networks", () => {
    const mockNetworks: NetworkDTO[] = [
      { code: "net1", name: "Network 1", description: "First network" },
      { code: "net2", name: "Network 2", description: "Second network" }
    ];

    it("should get all networks (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.getAllNetworks as jest.Mock).mockResolvedValue(mockNetworks);

      const response = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNetworks);
      expect(networkController.getAllNetworks).toHaveBeenCalled();
    });

    it("should get all networks (operator)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.getAllNetworks as jest.Mock).mockResolvedValue(mockNetworks);

      const response = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", operatorToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNetworks);
    });

    it("should get all networks (viewer)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.getAllNetworks as jest.Mock).mockResolvedValue(mockNetworks);

      const response = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", viewerToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNetworks);
    });

    it("should return 401 without auth token", async () => {
      const response = await request(app).get("/api/v1/networks");
      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
    });
  });

  describe("POST /networks", () => {
    const newNetwork: NetworkDTO = {
      code: "test-net",
      name: "Test Network",
      description: "Test network description"
    };

    it("should create network (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.createNetwork as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/v1/networks")
        .set("Authorization", adminToken)
        .send(newNetwork);

      expect(response.status).toBe(201);
      expect(networkController.createNetwork).toHaveBeenCalledWith(newNetwork);
    });

    it("should create network (operator)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.createNetwork as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/v1/networks")
        .set("Authorization", operatorToken)
        .send(newNetwork);

      expect(response.status).toBe(201);
    });

    it("should return 403 for viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const response = await request(app)
        .post("/api/v1/networks")
        .set("Authorization", viewerToken)
        .send(newNetwork);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("should return 409 for duplicate network", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.createNetwork as jest.Mock).mockImplementation(() => {
        throw new ConflictError("Network code already exists");
      });

      const response = await request(app)
        .post("/api/v1/networks")
        .set("Authorization", adminToken)
        .send(newNetwork);

      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/already exists/);
    });
  });

  describe("GET /networks/:networkCode", () => {
    const mockNetwork: NetworkDTO = {
      code: "test-net",
      name: "Test Network",
      description: "Test network description"
    };

    it("should get specific network", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.getNetwork as jest.Mock).mockResolvedValue(mockNetwork);

      const response = await request(app)
        .get("/api/v1/networks/test-net")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNetwork);
      expect(networkController.getNetwork).toHaveBeenCalledWith("test-net");
    });

    it("should return 404 for non-existent network", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.getNetwork as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Network not found");
      });

      const response = await request(app)
        .get("/api/v1/networks/non-existent")
        .set("Authorization", token);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });
  });

  describe("PATCH /networks/:networkCode", () => {
    const updateData = {
      name: "Updated Network",
      description: "Updated description"
    };

    it("should update network (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.updateNetwork as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .patch("/api/v1/networks/test-net")
        .set("Authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(204);
      expect(networkController.updateNetwork).toHaveBeenCalledWith("test-net", updateData);
    });

    it("should update network (operator)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.updateNetwork as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .patch("/api/v1/networks/test-net")
        .set("Authorization", operatorToken)
        .send(updateData);

      expect(response.status).toBe(204);
    });

    it("should return 403 for viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const response = await request(app)
        .patch("/api/v1/networks/test-net")
        .set("Authorization", viewerToken)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("should return 404 for non-existent network", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.updateNetwork as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Network not found");
      });

      const response = await request(app)
        .patch("/api/v1/networks/non-existent")
        .set("Authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });
  });

  describe("DELETE /networks/:networkCode", () => {
    it("should delete network (admin)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.deleteNetwork as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete("/api/v1/networks/test-net")
        .set("Authorization", adminToken);

      expect(response.status).toBe(204);
      expect(networkController.deleteNetwork).toHaveBeenCalledWith("test-net");
    });

    it("should delete network (operator)", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.deleteNetwork as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete("/api/v1/networks/test-net")
        .set("Authorization", operatorToken);

      expect(response.status).toBe(204);
    });

    it("should return 403 for viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const response = await request(app)
        .delete("/api/v1/networks/test-net")
        .set("Authorization", viewerToken);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("should return 404 for non-existent network", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.deleteNetwork as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Network not found");
      });

      const response = await request(app)
        .delete("/api/v1/networks/non-existent")
        .set("Authorization", adminToken);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/);
    });
  });
}); 