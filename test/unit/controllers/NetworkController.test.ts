import { NetworkRepository } from "@repositories/NetworkRepository";
import * as networkController from "@controllers/networkController";
import { NetworkDAO } from "@dao/NetworkDAO";
import AppError from "@models/errors/AppError";

jest.mock("@repositories/NetworkRepository");

describe("NetworkController", () => {
  const mockNetwork: NetworkDAO = {
    code: "test-network",
    name: "Test Network",
    description: "A test network",
    gateways: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllNetworks", () => {
    it("should return all networks", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        getAllNetworks: jest.fn().mockResolvedValue([mockNetwork])
      }));

      const result = await networkController.getAllNetworks();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        code: mockNetwork.code,
        name: mockNetwork.name,
        description: mockNetwork.description
      });
    });

    it("should throw 500 on error", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        getAllNetworks: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(networkController.getAllNetworks())
        .rejects.toThrow("Internal server error");
    });
  });

  describe("getNetwork", () => {
    it("should return a specific network", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        getNetworkByCode: jest.fn().mockResolvedValue(mockNetwork)
      }));

      const result = await networkController.getNetwork("test-network");
      
      expect(result).toEqual({
        code: mockNetwork.code,
        name: mockNetwork.name,
        description: mockNetwork.description
      });
    });

    it("should throw 404 when network not found", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        getNetworkByCode: jest.fn().mockRejectedValue(new AppError("not found", 404))
      }));

      await expect(networkController.getNetwork("wrong-code"))
        .rejects.toThrow("Network not found");
    });

    it("should throw 500 on other errors", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        getNetworkByCode: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(networkController.getNetwork("test-network"))
        .rejects.toThrow("Internal server error");
    });
  });

  describe("createNetwork", () => {
    const networkDto = {
      code: "test-network",
      name: "Test Network",
      description: "A test network"
    };

    it("should create a network", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        createNetwork: jest.fn().mockResolvedValue(mockNetwork)
      }));

      await expect(networkController.createNetwork(networkDto))
        .resolves.not.toThrow();
    });

    it("should throw 400 when code is missing", async () => {
      const invalidDto = { ...networkDto, code: undefined };

      await expect(networkController.createNetwork(invalidDto))
        .rejects.toThrow("Network code is required");
    });

    it("should throw 409 when network exists", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        createNetwork: jest.fn().mockRejectedValue(new AppError("already exists", 409))
      }));

      await expect(networkController.createNetwork(networkDto))
        .rejects.toThrow("Network code already in use");
    });

    it("should throw 500 on other errors", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        createNetwork: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(networkController.createNetwork(networkDto))
        .rejects.toThrow("Internal server error");
    });
  });

  describe("updateNetwork", () => {
    const networkDto = {
      code: "test-network",
      name: "Updated Network",
      description: "Updated description"
    };

    it("should update a network", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        updateNetwork: jest.fn().mockResolvedValue(mockNetwork)
      }));

      await expect(networkController.updateNetwork("test-network", networkDto))
        .resolves.not.toThrow();
    });

    it("should throw 404 when network not found", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        updateNetwork: jest.fn().mockRejectedValue(new AppError("not found", 404))
      }));

      await expect(networkController.updateNetwork("wrong-code", networkDto))
        .rejects.toThrow("Network not found");
    });

    it("should throw 409 when network code exists", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        updateNetwork: jest.fn().mockRejectedValue(new AppError("already exists", 409))
      }));

      await expect(networkController.updateNetwork("test-network", networkDto))
        .rejects.toThrow("Network code already in use");
    });

    it("should throw 500 on other errors", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        updateNetwork: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(networkController.updateNetwork("test-network", networkDto))
        .rejects.toThrow("Internal server error");
    });
  });

  describe("deleteNetwork", () => {
    it("should delete a network", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        deleteNetwork: jest.fn().mockResolvedValue(undefined)
      }));

      await expect(networkController.deleteNetwork("test-network"))
        .resolves.not.toThrow();
    });

    it("should throw 404 when network not found", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        deleteNetwork: jest.fn().mockRejectedValue(new AppError("not found", 404))
      }));

      await expect(networkController.deleteNetwork("wrong-code"))
        .rejects.toThrow("Network not found");
    });

    it("should throw 500 on other errors", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        deleteNetwork: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(networkController.deleteNetwork("test-network"))
        .rejects.toThrow("Internal server error");
    });
  });
}); 