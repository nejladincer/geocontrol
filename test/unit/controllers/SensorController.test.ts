import { SensorRepository } from "@repositories/SensorRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import * as sensorController from "@controllers/SensorController";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import AppError from "@models/errors/AppError";

jest.mock("@repositories/SensorRepository");
jest.mock("@repositories/GatewayRepository");
jest.mock("@repositories/NetworkRepository");

describe("SensorController", () => {
  const networkCode = "test-network";
  const gatewayMac = "test-gateway";
  const sensorMac = "test-sensor";

  const mockGateway: GatewayDAO = {
    macAddress: gatewayMac,
    name: "Test Gateway",
    description: "A test gateway",
    network: {} as NetworkDAO,
    networkCode: networkCode,
    sensors: []
  };

  const mockSensor: SensorDAO = {
    macAddress: sensorMac,
    name: "Test Sensor",
    description: "A test sensor",
    variable: "temperature",
    unit: "°C",
    gateway: mockGateway,
    gatewayMac: gatewayMac,
    measurements: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllSensors", () => {
    it("should return all sensors for a gateway", async () => {
      const mockSensors = [mockSensor];
      
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getGatewayByMacAddress: jest.fn().mockResolvedValue(mockGateway)
      }));
      
      (SensorRepository as jest.Mock).mockImplementation(() => ({
        getAllSensorsInGateway: jest.fn().mockResolvedValue(mockSensors)
      }));

      const result = await sensorController.getAllSensors(networkCode, gatewayMac);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        macAddress: sensorMac,
        name: "Test Sensor",
        description: "A test sensor",
        variable: "temperature",
        unit: "°C"
      });
    });

    it("should throw error when gateway not found", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getGatewayByMacAddress: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(sensorController.getAllSensors(networkCode, gatewayMac))
        .rejects.toThrow("Failed to fetch sensors");
    });

    it("should throw error when sensor repository fails", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getGatewayByMacAddress: jest.fn().mockResolvedValue(mockGateway)
      }));
      
      (SensorRepository as jest.Mock).mockImplementation(() => ({
        getAllSensorsInGateway: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(sensorController.getAllSensors(networkCode, gatewayMac))
        .rejects.toThrow("Failed to fetch sensors");
    });
  });

  describe("getSensor", () => {
  it("should return a specific sensor", async () => {
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getGatewayByMacAddress: jest.fn().mockResolvedValue(mockGateway)
    }));
    
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorByMacAddress: jest.fn().mockResolvedValue(mockSensor)
    }));

    const result = await sensorController.getSensor(sensorMac, gatewayMac, networkCode);
    
    expect(result).toEqual({
      macAddress: sensorMac,
      name: "Test Sensor",
      description: "A test sensor",
      variable: "temperature",
      unit: "°C"
    });
  });

  it("should throw error when sensor not found", async () => {
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getGatewayByMacAddress: jest.fn().mockResolvedValue(mockGateway)
    }));
    
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorByMacAddress: jest.fn().mockRejectedValue(new Error())
    }));

    await expect(sensorController.getSensor(sensorMac, gatewayMac, networkCode))
      .rejects.toThrow(`Sensor with macAddress '${sensorMac}' not found`);
  });

  it("should throw error when gateway validation fails", async () => {
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getGatewayByMacAddress: jest.fn().mockRejectedValue(new Error())
    }));

    await expect(sensorController.getSensor(sensorMac, gatewayMac, networkCode))
      .rejects.toThrow(`Sensor with macAddress '${sensorMac}' not found`);
  });
});

  describe("getAllSensorsInNetwork", () => {
    it("should return all sensors in a network", async () => {
      const mockSensors = [mockSensor];
      
      (SensorRepository as jest.Mock).mockImplementation(() => ({
        getAllSensorsInNetwork: jest.fn().mockResolvedValue(mockSensors)
      }));

      const result = await sensorController.getAllSensorsInNetwork(networkCode);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        macAddress: sensorMac,
        name: "Test Sensor",
        description: "A test sensor",
        variable: "temperature",
        unit: "°C"
      });
    });

    it("should throw error when fetching fails", async () => {
      (SensorRepository as jest.Mock).mockImplementation(() => ({
        getAllSensorsInNetwork: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(sensorController.getAllSensorsInNetwork(networkCode))
        .rejects.toThrow("Failed to fetch sensors in network");
    });

    it("should handle AppError correctly", async () => {
      const customError = new AppError("Failed to fetch sensors in network", 500);
      (SensorRepository as jest.Mock).mockImplementation(() => ({
        getAllSensorsInNetwork: jest.fn().mockRejectedValue(customError)
      }));

      await expect(sensorController.getAllSensorsInNetwork(networkCode))
        .rejects.toThrow(customError);
    });
  });

  describe("createSensor", () => {
    const sensorDto = {
      macAddress: sensorMac,
      name: "Test Sensor",
      description: "A test sensor",
      variable: "temperature",
      unit: "°C"
    };

    it("should create a new sensor", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getGatewayByMacAddress: jest.fn().mockResolvedValue(mockGateway)
      }));
      
      (SensorRepository as jest.Mock).mockImplementation(() => ({
        createSensor: jest.fn().mockResolvedValue(undefined)
      }));

      await expect(sensorController.createSensor(sensorDto, gatewayMac, networkCode))
        .resolves.not.toThrow();
    });

    it("should throw error when macAddress is missing", async () => {
      const invalidDto = { ...sensorDto, macAddress: undefined };

      await expect(sensorController.createSensor(invalidDto, gatewayMac, networkCode))
        .rejects.toThrow("Sensor macAddress is required");
    });

    it("should throw conflict error when sensor exists", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getGatewayByMacAddress: jest.fn().mockResolvedValue(mockGateway)
      }));
      
      (SensorRepository as jest.Mock).mockImplementation(() => ({
        createSensor: jest.fn().mockRejectedValue(new Error("already exists"))
      }));

      await expect(sensorController.createSensor(sensorDto, gatewayMac, networkCode))
        .rejects.toThrow("Sensor already exists");
    });

    it("should throw error when gateway validation fails", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getGatewayByMacAddress: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(sensorController.createSensor(sensorDto, gatewayMac, networkCode))
        .rejects.toThrow("Failed to create sensor");
    });
  });

  describe("updateSensor", () => {
  const updateDto = {
    macAddress: sensorMac,
    name: "Updated Sensor",
    description: "Updated description"
  };

  it("should update a sensor", async () => {
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getGatewayByMacAddress: jest.fn().mockResolvedValue(mockGateway)
    }));
    
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      updateSensor: jest.fn().mockResolvedValue(undefined)
    }));

    await expect(sensorController.updateSensor(sensorMac, gatewayMac, networkCode, updateDto))
      .resolves.not.toThrow();
  });

  it("should throw error when update fails", async () => {
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getGatewayByMacAddress: jest.fn().mockResolvedValue(mockGateway)
    }));
    
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      updateSensor: jest.fn().mockRejectedValue(new Error())
    }));

    await expect(sensorController.updateSensor(sensorMac, gatewayMac, networkCode, updateDto))
      .rejects.toThrow("Failed to update sensor");
  });

  it("should throw error when gateway validation fails", async () => {
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getGatewayByMacAddress: jest.fn().mockRejectedValue(new Error())
    }));

    await expect(sensorController.updateSensor(sensorMac, gatewayMac, networkCode, updateDto))
      .rejects.toThrow("Failed to update sensor");
  });
});

  describe("deleteSensor", () => {
    it("should delete a sensor", async () => {
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        getNetworkByCode: jest.fn().mockResolvedValue({ code: networkCode })
      }));
      
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getGatewayByMacAddress: jest.fn().mockResolvedValue(mockGateway)
      }));
      
      (SensorRepository as jest.Mock).mockImplementation(() => ({
        deleteSensor: jest.fn().mockResolvedValue(undefined)
      }));

      await expect(sensorController.deleteSensor(sensorMac, gatewayMac, networkCode))
        .resolves.not.toThrow();
    });

    it("should throw error when delete fails", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getGatewayByMacAddress: jest.fn().mockResolvedValue(mockGateway)
      }));
      
      (SensorRepository as jest.Mock).mockImplementation(() => ({
        deleteSensor: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(sensorController.deleteSensor(sensorMac, gatewayMac, networkCode))
        .rejects.toThrow("Failed to delete sensor");
    });

    it("should throw error when gateway validation fails", async () => {
      (GatewayRepository as jest.Mock).mockImplementation(() => ({
        getGatewayByMacAddress: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(sensorController.deleteSensor(sensorMac, gatewayMac, networkCode))
        .rejects.toThrow("Failed to delete sensor");
    });
  });
});