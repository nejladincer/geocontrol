import { MeasurementsRepository } from "@repositories/MeasurementsRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { Stats } from "@models/dto/Stats";
import { Measurements } from "@models/dto/Measurements";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { SimpleConsoleLogger } from "typeorm";

beforeAll(async () => {
  await initializeTestDataSource();


});

afterAll(async () => {
  await closeTestDataSource();
});

afterEach(async () => {
  await TestDataSource.getRepository(MeasurementDAO).clear();
  await TestDataSource.getRepository(SensorDAO).clear();
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("MeasurementsRepository: SQLite in-memory", () => {
  const repo = new MeasurementsRepository();

  it("store measurement for sensor", async () => {
    const networkCode = "net123";
    const gatewayMac = "00:1A:2B:3C:4D:5E";
    const sensorMac = "AA:BB:CC:DD:EE:FF";
    const createdAt = new Date().toISOString();
    const value = 42;


    // Create network, gateway, and sensor for the measurement
    const networkRepo = new NetworkRepository();
    const gatewayRepo = new GatewayRepository();
    const sensorRepo = new SensorRepository();
    await networkRepo.createNetwork(networkCode, "Test Network", "A test network");
    await gatewayRepo.createGateway(gatewayMac, "Test Gateway", "A test gateway", networkCode);
    await sensorRepo.createSensor(sensorMac, "Test Sensor", "A test sensor", "temperature", "Celsius", gatewayMac);
  
    // Store the measurement
    await repo.storeMeasurementForSensor(networkCode, gatewayMac, sensorMac, createdAt, value);

    const measurements = await repo.getMeasurementsFromSensor(networkCode, gatewayMac, sensorMac);
    expect(measurements.measurements).toHaveLength(1);
    expect(measurements.measurements[0]).toMatchObject({
      createdAt: new Date(createdAt),
      value: value,
      isOutlier: false
    });
  });

  it("retrieve measurements for sensor", async () => {

    const networkCode = "net123";
    const gatewayMac = "00:1A:2B:3C:4D:5E";
    const sensorMac = "AA:BB:CC:AA:AA:AA";
    const createdAt = new Date().toISOString();
    const value = 42;


    // Create network, gateway, and sensor for the measurement
    const networkRepo = new NetworkRepository();
    const gatewayRepo = new GatewayRepository();
    const sensorRepo = new SensorRepository();
    
    await networkRepo.createNetwork(networkCode, "Test Network", "A test network");

    await gatewayRepo.createGateway(gatewayMac, "Test Gateway", "A test gateway", networkCode);

    await sensorRepo.createSensor(sensorMac, "Test Sensor", "A test sensor", "temperature", "Celsius", gatewayMac);
  
    // Store the measurement
    await repo.storeMeasurementForSensor(networkCode, gatewayMac, sensorMac, createdAt, value);

    const measurements = await repo.getMeasurementsFromSensor(networkCode, gatewayMac, sensorMac);
    expect(measurements.sensorMacAddress).toBe(sensorMac);
    expect(measurements.measurements).toBeInstanceOf(Array);
  });

  it("retrieve stats for sensor", async () => {
    const networkCode = "net123";
    const gatewayMac = "00:1A:2B:3C:4D:5E";
    const sensorMac = "AA:BB:CC:DD:EE:FF";
    const createdAt = new Date().toISOString();
    const value = 42;

    const networkRepo = new NetworkRepository();
    const gatewayRepo = new GatewayRepository();
    const sensorRepo = new SensorRepository();
    await networkRepo.createNetwork(networkCode, "Test Network", "A test network");
    await gatewayRepo.createGateway(gatewayMac, "Test Gateway", "A test gateway", networkCode);
    await sensorRepo.createSensor(sensorMac, "Test Sensor", "A test sensor", "temperature", "Celsius", gatewayMac);
  

    // Store a measurement to calculate stats
    await repo.storeMeasurementForSensor(networkCode, gatewayMac, sensorMac, createdAt, value);

    const stats = await repo.getStatsFromSensor(networkCode, gatewayMac, sensorMac);
    expect(stats).toEqual(expect.objectContaining({
      mean: expect.any(Number),
      variance: expect.any(Number),
      upperThreshold: expect.any(Number),
      lowerThreshold: expect.any(Number)
    }));
    expect(stats).toMatchObject({
      mean: expect.any(Number),
      variance: expect.any(Number),
      upperThreshold: expect.any(Number),
      lowerThreshold: expect.any(Number),
    });
  });

  it("retrieve outliers for sensor", async () => {
    const networkCode = "net123";
    const gatewayMac = "00:1A:2B:3C:4D:5E";
    const sensorMac = "AA:BB:CC:DD:EE:FF";

    const networkRepo = new NetworkRepository();
    const gatewayRepo = new GatewayRepository();
    const sensorRepo = new SensorRepository();
    await networkRepo.createNetwork(networkCode, "Test Network", "A test network");
    await gatewayRepo.createGateway(gatewayMac, "Test Gateway", "A test gateway", networkCode);
    await sensorRepo.createSensor(sensorMac, "Test Sensor", "A test sensor", "temperature", "Celsius", gatewayMac);
  

    const outliers = await repo.getOutliersFromSensor(networkCode, gatewayMac, sensorMac);
    expect(outliers.measurements).toBeInstanceOf(Array);
    expect(outliers.measurements.every(m => m.isOutlier)).toBe(true);
  });
  
  it("retrieve measurements for sensors in network", async () => {
    const networkCode = "net123";
    const gatewayMac = "00:1A:2B:3C:4D:5E";
    const sensorMac = "AA:BB:CC:DD:EE:FF";
    const networkRepo = new NetworkRepository();
    const gatewayRepo = new GatewayRepository();
    const sensorRepo = new SensorRepository();
    await networkRepo.createNetwork(networkCode, "Test Network", "A test network");
    await gatewayRepo.createGateway(gatewayMac, "Test Gateway", "A test gateway", networkCode);
    await sensorRepo.createSensor(sensorMac, "Test Sensor", "A test sensor", "temperature", "Celsius", gatewayMac);
  

    const measurements = await repo.getMeasurementsFromSensorsInNetwork(networkCode, [sensorMac]);
    expect(measurements).toBeInstanceOf(Array);
  });

  it("retrieve stats for sensors in network", async () => {
    const networkCode = "net123";
    const gatewayMac = "00:1A:2B:3C:4D:5E";
    const sensorMac = "AA:BB:CC:DD:EE:FF";
    const networkRepo = new NetworkRepository();
    const gatewayRepo = new GatewayRepository();
    const sensorRepo = new SensorRepository();
    await networkRepo.createNetwork(networkCode, "Test Network", "A test network");
    await gatewayRepo.createGateway(gatewayMac, "Test Gateway", "A test gateway", networkCode);
    await sensorRepo.createSensor(sensorMac, "Test Sensor", "A test sensor", "temperature", "Celsius", gatewayMac);
  

    const stats = await repo.getStatsFromSensorsInNetwork(networkCode, [sensorMac]);
    expect(stats).toBeInstanceOf(Array);
  });

  it("retrieve outliers for sensors in network", async () => {
    const networkCode = "net123";
    const gatewayMac = "00:1A:2B:3C:4D:5E";
    const sensorMac = "AA:BB:CC:DD:EE:FF";
    const networkRepo = new NetworkRepository();
    const gatewayRepo = new GatewayRepository();
    const sensorRepo = new SensorRepository();
    await networkRepo.createNetwork(networkCode, "Test Network", "A test network");
    await gatewayRepo.createGateway(gatewayMac, "Test Gateway", "A test gateway", networkCode);
    await sensorRepo.createSensor(sensorMac, "Test Sensor", "A test sensor", "temperature", "Celsius", gatewayMac);
  

    const outliers = await repo.getOutliersFromSensorsInNetwork(networkCode, [sensorMac]);
    expect(outliers).toBeInstanceOf(Array);
  });
});
