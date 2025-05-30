import { MeasurementsRepository } from "@repositories/MeasurementsRepository";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { Stats } from "@models/dto/Stats";
import { Measurements } from "@models/dto/Measurements";

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      find: mockFind,
      save: mockSave,
      remove: mockRemove,
    })),
  },
}));

describe("MeasurementsRepository: mocked database", () => {
  const repo = new MeasurementsRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("store measurement for sensor", async () => {
    const networkCode = "net123";
    const gatewayMac = "00:1A:2B:3C:4D:5E";
    const sensorMac = "AA:BB:CC:DD:EE:FF";
    const createdAt = new Date().toISOString();
    const value = 42;

    mockFind.mockResolvedValue([{ macAddress: sensorMac }]);
    mockSave.mockResolvedValue({
      code: `${sensorMac}-${new Date(createdAt).getTime()}`,
      createdAt,
      value,
      isOutlier: false,
      sensorMacAddress: sensorMac,
    });

    await repo.storeMeasurementForSensor(networkCode, gatewayMac, sensorMac, createdAt, value);

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

    expect(outliers.measurements).toBeInstanceOf(Array);
    expect(outliers.measurements.every((m) => m.isOutlier)).toBe(true);
  });

  it("retrieve measurements for sensors in network", async () => {
    const networkCode = "net123";
    const sensorMac = "AA:BB:CC:DD:EE:FF";

    mockFind.mockResolvedValue([
      { createdAt: new Date().toISOString(), value: 42, isOutlier: false },
    ]);

    const measurements = await repo.getMeasurementsFromSensorsInNetwork(networkCode, [sensorMac]);

    expect(measurements).toBeInstanceOf(Array);
  });

  it("retrieve stats for sensors in network", async () => {
    const networkCode = "net123";
    const sensorMac = "AA:BB:CC:DD:EE:FF";

    mockFind.mockResolvedValue([
      { createdAt: new Date().toISOString(), value: 42, isOutlier: false },
    ]);

    const stats = await repo.getStatsFromSensorsInNetwork(networkCode, [sensorMac]);

    expect(stats).toBeInstanceOf(Array);
  });

  it("retrieve outliers for sensors in network", async () => {
    const networkCode = "net123";
    const sensorMac = "AA:BB:CC:DD:EE:FF";

    mockFind.mockResolvedValue([
      { createdAt: new Date().toISOString(), value: 42, isOutlier: true },
    ]);

    const outliers = await repo.getOutliersFromSensorsInNetwork(networkCode, [sensorMac]);

    expect(outliers).toBeInstanceOf(Array);
  });
});
