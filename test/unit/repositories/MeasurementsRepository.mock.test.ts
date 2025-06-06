import { MeasurementsRepository } from "@repositories/MeasurementsRepository";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import * as utils from "@utils/utils";

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();
const mockFindOne = jest.fn();
const mockDelete = jest.fn();

// Create separate mock functions for utility functions
const mockVerifySensorExists = jest.fn();
const mockVerifyNetworkExists = jest.fn();
const mockVerifyGatewayExists = jest.fn();
const mockGetAllSensorsInNetwork = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      find: mockFind,
      save: mockSave,
      remove: mockRemove,
      findOne: mockFindOne,
      delete: mockDelete
    })),
  },
}));

// Mock the utils module
jest.mock("@utils/utils", () => ({
  verifySensorExists: jest.fn().mockImplementation((...args) => mockVerifySensorExists(...args)),
  verifyNetworkExists: jest.fn().mockImplementation((...args) => mockVerifyNetworkExists(...args)),
  verifyGatewayExists: jest.fn().mockImplementation((...args) => mockVerifyGatewayExists(...args)),
  getAllSensorsInNetwork: jest.fn().mockImplementation((...args) => mockGetAllSensorsInNetwork(...args))
}));

describe("MeasurementsRepository: mocked database", () => {
  const repo = new MeasurementsRepository();

  // Sample mock data with complete relationships
  const mockNetwork = {
    code: "net123",
    name: "Test Network",
    description: "Test Description"
  };

  const mockGateway = {
    macAddress: "00:1A:2B:3C:4D:5E",
    name: "Test Gateway",
    description: "Test Description",
    networkCode: "net123",
    network: mockNetwork
  };

  const mockSensor = {
    macAddress: "AA:BB:CC:DD:EE:FF",
    gatewayMac: "00:1A:2B:3C:4D:5E",
    name: "Test Sensor",
    description: "Test Description",
    variable: "temperature",
    unit: "C",
    gateway: mockGateway
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mocks for utils functions using the separate mock functions
    mockVerifySensorExists.mockResolvedValue(mockSensor);
    mockVerifyNetworkExists.mockResolvedValue(mockNetwork);
    mockVerifyGatewayExists.mockResolvedValue(mockGateway);
    mockGetAllSensorsInNetwork.mockResolvedValue([mockSensor]);
  });

  it("store measurement for sensor", async () => {
    const networkCode = "net123";
    const gatewayMac = "00:1A:2B:3C:4D:5E";
    const sensorMac = "AA:BB:CC:DD:EE:FF";
    const createdAt = new Date().toISOString();
    const value = 42;

    mockSave.mockResolvedValue({
      code: `${sensorMac}-${new Date(createdAt).getTime()}`,
      createdAt,
      value,
      isOutlier: false,
      sensorMacAddress: sensorMac,
    });

    await repo.storeMeasurementForSensor(networkCode, gatewayMac, sensorMac, createdAt, value);

    // Verify verifySensorExists was called with correct parameters - use mockVerifySensorExists here
    expect(mockVerifySensorExists).toHaveBeenCalledWith(sensorMac, gatewayMac, networkCode);

    // Verify measurement was saved
    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
      createdAt,
      value,
      sensorMacAddress: sensorMac,
    }));
  });

  it("retrieve measurements for sensor", async () => {
    const networkCode = "net123";
    const gatewayMac = "00:1A:2B:3C:4D:5E";
    const sensorMac = "AA:BB:CC:DD:EE:FF";

    mockFind.mockResolvedValue([
      { createdAt: new Date().toISOString(), value: 42, isOutlier: false },
    ]);

    const measurements = await repo.getMeasurementsFromSensor(networkCode, gatewayMac, sensorMac);

    // Verify verifySensorExists was called
    expect(mockVerifySensorExists).toHaveBeenCalledWith(sensorMac, gatewayMac, networkCode);

    expect(measurements.sensorMacAddress).toBe(sensorMac);
    expect(measurements.measurements).toBeInstanceOf(Array);
  });

  it("retrieve stats for sensor", async () => {
    const networkCode = "net123";
    const gatewayMac = "00:1A:2B:3C:4D:5E";
    const sensorMac = "AA:BB:CC:DD:EE:FF";

    mockFind.mockResolvedValue([
      { createdAt: new Date().toISOString(), value: 42, isOutlier: false },
    ]);

    const stats = await repo.getStatsFromSensor(networkCode, gatewayMac, sensorMac);

    // Verify verifySensorExists was called
    expect(mockVerifySensorExists).toHaveBeenCalledWith(sensorMac, gatewayMac, networkCode);

    expect(stats).toEqual(expect.objectContaining({
      mean: expect.any(Number),
      variance: expect.any(Number),
      upperThreshold: expect.any(Number),
      lowerThreshold: expect.any(Number),
    }));
  });

  it("retrieve outliers for sensor", async () => {
    const networkCode = "net123";
    const gatewayMac = "00:1A:2B:3C:4D:5E";
    const sensorMac = "AA:BB:CC:DD:EE:FF";

    mockFind.mockResolvedValue([
      { createdAt: new Date().toISOString(), value: 42, isOutlier: true },
    ]);

    const outliers = await repo.getOutliersFromSensor(networkCode, gatewayMac, sensorMac);

    // Verify verifySensorExists was called
    expect(mockVerifySensorExists).toHaveBeenCalledWith(sensorMac, gatewayMac, networkCode);

    expect(outliers.measurements).toBeInstanceOf(Array);
    expect(outliers.measurements.every(m => m.isOutlier)).toBe(true);
  });

  it("retrieve measurements for sensors in network", async () => {
    const networkCode = "net123";
    const sensorMacs = ["AA:BB:CC:DD:EE:FF"];

    mockFind.mockResolvedValue([
      { createdAt: new Date().toISOString(), value: 42, isOutlier: false },
    ]);

    const measurements = await repo.getMeasurementsFromSensorsInNetwork(networkCode, sensorMacs);

    // Verify verifyNetworkExists was called
    expect(mockVerifyNetworkExists).toHaveBeenCalledWith(networkCode);

    expect(measurements).toBeInstanceOf(Array);
  });

  it("retrieve stats for sensors in network", async () => {
    const networkCode = "net123";
    const sensorMacs = ["AA:BB:CC:DD:EE:FF"];

    mockFind.mockResolvedValue([
      { createdAt: new Date().toISOString(), value: 42, isOutlier: false },
    ]);

    const stats = await repo.getStatsFromSensorsInNetwork(networkCode, sensorMacs);

    // Verify verifyNetworkExists was called
    expect(mockVerifyNetworkExists).toHaveBeenCalledWith(networkCode);

    expect(stats).toBeInstanceOf(Array);
  });

  it("retrieve outliers for sensors in network", async () => {
    const networkCode = "net123";
    const sensorMacs = ["AA:BB:CC:DD:EE:FF"];

    mockFind.mockResolvedValue([
      { createdAt: new Date().toISOString(), value: 42, isOutlier: true },
    ]);

    const outliers = await repo.getOutliersFromSensorsInNetwork(networkCode, sensorMacs);

    // Verify verifyNetworkExists was called
    expect(mockVerifyNetworkExists).toHaveBeenCalledWith(networkCode);

    expect(outliers).toBeInstanceOf(Array);
  });
});
