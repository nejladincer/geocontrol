import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import * as gatewayController from "@controllers/gatewayController";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import AppError from "@models/errors/AppError";

jest.mock("@repositories/GatewayRepository");
jest.mock("@repositories/NetworkRepository");

describe("GatewayController", () => {
  const networkCode = "test-network";
  const macAddress = "test-mac";

  const mockGateway: GatewayDAO = {
    macAddress,
    name: "Test Gateway",
    description: "A test gateway",
    network: {} as NetworkDAO,
    networkCode,
    sensors: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllGateways", () => {
    it("should return all gateways", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getAllGatewaysInNetwork: jest.fn().mockResolvedValue([mockGateway])
      }));

      const result = await gatewayController.getAllGateways(networkCode);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        macAddress,
        name: "Test Gateway",
        description: "A test gateway"
      });
    });

    it("should throw 404 when network not found", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getAllGatewaysInNetwork: jest.fn().mockRejectedValue(
          new Error("Network with code 'wrong-code' not found")
        )
      }));

      await expect(gatewayController.getAllGateways("wrong-code"))
        .rejects.toThrow(AppError);
    });

    it("should throw 500 on other errors", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getAllGatewaysInNetwork: jest.fn().mockRejectedValue(new Error("Unknown error"))
      }));

      await expect(gatewayController.getAllGateways(networkCode))
        .rejects.toThrow("Internal server error");
    });
  });

  describe("getGateway", () => {
    it("should return a specific gateway", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getGatewayByMacAddress: jest.fn().mockResolvedValue(mockGateway)
      }));

      const result = await gatewayController.getGateway(macAddress, networkCode);
      
      expect(result).toEqual({
        macAddress,
        name: "Test Gateway",
        description: "A test gateway"
      });
    });

    it("should throw 404 when network not found", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getGatewayByMacAddress: jest.fn().mockRejectedValue(
          new Error("Network with code 'wrong-code' not found")
        )
      }));

      await expect(gatewayController.getGateway(macAddress, "wrong-code"))
        .rejects.toThrow(AppError);
    });

    it("should throw 404 when gateway not found", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getGatewayByMacAddress: jest.fn().mockRejectedValue(
          new Error("Gateway with macAddress 'wrong-mac' not found")
        )
      }));

      await expect(gatewayController.getGateway("wrong-mac", networkCode))
        .rejects.toThrow(AppError);
    });

    it("should throw 500 on other errors", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getGatewayByMacAddress: jest.fn().mockRejectedValue(new Error("Unknown error"))
      }));

      await expect(gatewayController.getGateway(macAddress, networkCode))
        .rejects.toThrow("Internal server error");
    });
  });

  describe("createGateway", () => {
    const gatewayDto = {
      macAddress,
      name: "Test Gateway",
      description: "A test gateway"
    };

    it("should create a gateway", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        getNetworkByCode: jest.fn().mockResolvedValue({ code: networkCode })
      }));
      
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        createGateway: jest.fn().mockResolvedValue(undefined)
      }));

      await expect(gatewayController.createGateway(gatewayDto, networkCode))
        .resolves.not.toThrow();
    });

    it("should throw 400 when MAC address is missing", async () => {
      const invalidDto = { ...gatewayDto, macAddress: undefined };

      await expect(gatewayController.createGateway(invalidDto, networkCode))
        .rejects.toThrow("MAC address is required");
    });

    it("should throw 404 when network not found", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        getNetworkByCode: jest.fn().mockResolvedValue(null)
      }));

      await expect(gatewayController.createGateway(gatewayDto, networkCode))
        .rejects.toThrow("Network with code");
    });

    it("should throw 409 when gateway exists", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        getNetworkByCode: jest.fn().mockResolvedValue({ code: networkCode })
      }));
      
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        createGateway: jest.fn().mockRejectedValue(new Error("already exists"))
      }));

      await expect(gatewayController.createGateway(gatewayDto, networkCode))
        .rejects.toThrow(AppError);
    });

    it("should throw 500 on other errors", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        getNetworkByCode: jest.fn().mockResolvedValue({ code: networkCode })
      }));
      
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        createGateway: jest.fn().mockRejectedValue(new Error("Unknown error"))
      }));

      await expect(gatewayController.createGateway(gatewayDto, networkCode))
        .rejects.toThrow("Internal server error");
    });
  });

  describe("updateGateway", () => {
    const updateData = {
      newMacAddress: "new-mac",
      newName: "Updated Gateway",
      newDescription: "Updated description"
    };

    it("should update a gateway", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        updateGateway: jest.fn().mockResolvedValue(undefined)
      }));

      await expect(gatewayController.updateGateway(macAddress, networkCode, updateData))
        .resolves.not.toThrow();
    });

    it("should throw 404 when network not found", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        updateGateway: jest.fn().mockRejectedValue(
          new Error("Network with code 'wrong-code' not found")
        )
      }));

      await expect(gatewayController.updateGateway(macAddress, "wrong-code", updateData))
        .rejects.toThrow(AppError);
    });

    it("should throw 404 when gateway not found", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        updateGateway: jest.fn().mockRejectedValue(
          new Error("Gateway with macAddress 'wrong-mac' not found")
        )
      }));

      await expect(gatewayController.updateGateway("wrong-mac", networkCode, updateData))
        .rejects.toThrow(AppError);
    });

    it("should throw 409 when MAC address exists", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        updateGateway: jest.fn().mockRejectedValue(new Error("already exists"))
      }));

      await expect(gatewayController.updateGateway(macAddress, networkCode, updateData))
        .rejects.toThrow(AppError);
    });

    it("should throw 500 on other errors", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        updateGateway: jest.fn().mockRejectedValue(new Error("Unknown error"))
      }));

      await expect(gatewayController.updateGateway(macAddress, networkCode, updateData))
        .rejects.toThrow("Internal server error");
    });
  });

  describe("deleteGateway", () => {
    it("should delete a gateway", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        deleteGateway: jest.fn().mockResolvedValue(undefined)
      }));

      await expect(gatewayController.deleteGateway(macAddress, networkCode))
        .resolves.not.toThrow();
    });

    it("should throw 404 when network not found", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        deleteGateway: jest.fn().mockRejectedValue(
          new Error("Network with code 'wrong-code' not found")
        )
      }));

      await expect(gatewayController.deleteGateway(macAddress, "wrong-code"))
        .rejects.toThrow(AppError);
    });

    it("should throw 404 when gateway not found", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        deleteGateway: jest.fn().mockRejectedValue(
          new Error("Gateway with macAddress 'wrong-mac' not found")
        )
      }));

      await expect(gatewayController.deleteGateway("wrong-mac", networkCode))
        .rejects.toThrow(AppError);
    });

    it("should throw 500 on other errors", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        deleteGateway: jest.fn().mockRejectedValue(new Error("Unknown error"))
      }));

      await expect(gatewayController.deleteGateway(macAddress, networkCode))
        .rejects.toThrow("Internal server error");
    });
  });
}); 