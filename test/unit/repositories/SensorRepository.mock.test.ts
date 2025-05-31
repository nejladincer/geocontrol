import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      find: mockFind,
      findOne: mockFindOne,
      save: mockSave,
      remove: mockRemove,
      create: jest.fn((obj) => obj)
    }))
  }
}));

describe("SensorRepository: mocked database", () => {
  const repo = new SensorRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create sensor", async () => {
    mockFind.mockResolvedValue([]);
    mockFindOne.mockResolvedValue({ macAddress: "mac1" });
    const savedSensor = new SensorDAO();
    savedSensor.macAddress = "sensor1";
    mockSave.mockResolvedValue(savedSensor);

    const result = await repo.createSensor("sensor1", "Sensor", "D", "var", "unit", "mac1");
    expect(result.macAddress).toBe("sensor1");
    expect(mockSave).toHaveBeenCalled();
  });

  it("create sensor: conflict", async () => {
    mockFind.mockResolvedValue([new SensorDAO()]);
    await expect(repo.createSensor("sensor1", "Sensor", "D", "var", "unit", "mac1")).rejects.toThrow(ConflictError);
  });

  it("get sensor by mac: not found", async () => {
  mockFind.mockResolvedValue([]); // FIXED
  await expect(repo.getSensorByMacAddress("sensor1", "mac1")).rejects.toThrow(NotFoundError);
});


  it("delete sensor", async () => {
    const sensor = new SensorDAO();
    sensor.macAddress = "sensor1";
    mockFind.mockResolvedValue([sensor]);
    mockRemove.mockResolvedValue(undefined);

    await repo.deleteSensor("sensor1", "mac1");
    expect(mockRemove).toHaveBeenCalledWith(sensor);
  });

  it("createSensor: throws if gateway not found", async () => {
  mockFind.mockResolvedValue([]); // No duplicate sensor
  mockFindOne.mockResolvedValue(undefined); // Gateway not found

  await expect(
    repo.createSensor("sensorX", "Sensor X", "Desc", "var", "unit", "nonexistent-mac")
  ).rejects.toThrow("Gateway with macAddress 'nonexistent-mac' not found");
});

});