import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";

describe("SensorRepository: SQLite in-memory", () => {
  const repo = new SensorRepository();

  beforeAll(async () => {
    await initializeTestDataSource();
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await TestDataSource.getRepository(SensorDAO).clear();
    await TestDataSource.getRepository(GatewayDAO).clear();
    await TestDataSource.getRepository(NetworkDAO).clear();
  });

  it("create and retrieve sensor", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({
      code: "net1",
      name: "Test Network",
      description: "A test network"
    });

    const gateway = await TestDataSource.getRepository(GatewayDAO).save({
      macAddress: "mac1",
      name: "Test Gateway",
      description: "Desc",
      network
    });

    const sensor = await repo.createSensor(
      "sensor1",
      "Sensor 1",
      "Desc",
      "temperature",
      "Celsius",
      "mac1"
    );

    expect(sensor.macAddress).toBe("sensor1");

    const found = await repo.getSensorByMacAddress("sensor1", "mac1");
    expect(found.macAddress).toBe("sensor1");
  });

  it("create sensor: conflict", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({ code: "net1", name: "Test", description: "desc" });
    const gateway = await TestDataSource.getRepository(GatewayDAO).save({ macAddress: "mac1", name: "GW", description: "D", network });

    await repo.createSensor("sensor1", "S1", "D", "var", "unit", "mac1");

    await expect(
      repo.createSensor("sensor1", "Duplicate", "D", "var", "unit", "mac1")
    ).rejects.toThrow(ConflictError);
  });

  it("getAllSensorsInNetwork", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({ code: "net1", name: "Net", description: "desc" });
    const gateway = await TestDataSource.getRepository(GatewayDAO).save({ macAddress: "mac1", name: "GW", description: "D", network });

    await repo.createSensor("sensor1", "S1", "D", "var", "unit", "mac1");
    await repo.createSensor("sensor2", "S2", "D", "var", "unit", "mac1");

    const sensors = await repo.getAllSensorsInNetwork("net1");
    expect(sensors).toHaveLength(2);
  });

  it("getSensorByMacAddress: not found", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({ code: "net1", name: "Net", description: "desc" });
    const gateway = await TestDataSource.getRepository(GatewayDAO).save({ macAddress: "mac1", name: "GW", description: "D", network });

    await expect(
      repo.getSensorByMacAddress("not-exist", "mac1")
    ).rejects.toThrow(NotFoundError);
  });

  it("delete sensor", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({ code: "net1", name: "Net", description: "desc" });
    const gateway = await TestDataSource.getRepository(GatewayDAO).save({ macAddress: "mac1", name: "GW", description: "D", network });

    await repo.createSensor("sensor1", "S1", "D", "var", "unit", "mac1");
    await repo.deleteSensor("sensor1", "mac1", "net1");

    await expect(
      repo.getSensorByMacAddress("sensor1", "mac1")
    ).rejects.toThrow(NotFoundError);
  });

  it("update sensor", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({ code: "net1", name: "Net", description: "desc" });
    const gateway = await TestDataSource.getRepository(GatewayDAO).save({ macAddress: "mac1", name: "GW", description: "D", network });

    await repo.createSensor("sensor1", "S1", "D", "var", "unit", "mac1");

    const updated = await repo.updateSensor("sensor1", "mac1", { name: "Updated", unit: "Kelvin" });

    expect(updated.name).toBe("Updated");
    expect(updated.unit).toBe("Kelvin");
  });

  it("updateSensor: updates only variable", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({ code: "net1", name: "Net", description: "desc" });
    const gateway = await TestDataSource.getRepository(GatewayDAO).save({ macAddress: "mac1", name: "GW", description: "D", network });

    await repo.createSensor("sensor1", "S1", "D", "var", "unit", "mac1");

    const updated = await repo.updateSensor("sensor1", "mac1", { variable: "humidity" });
    expect(updated.variable).toBe("humidity");
  });

  it("updateSensor: empty update", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({ code: "net1", name: "Net", description: "desc" });
    const gateway = await TestDataSource.getRepository(GatewayDAO).save({ macAddress: "mac1", name: "GW", description: "D", network });

    await repo.createSensor("sensor1", "S1", "D", "var", "unit", "mac1");

    const updated = await repo.updateSensor("sensor1", "mac1", {});
    expect(updated.macAddress).toBe("sensor1");
  });
});