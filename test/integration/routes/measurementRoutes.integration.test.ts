import request from "supertest";
import{ app}  from "@app";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "@test/setup/test-datasource";
import { NetworkDAO } from "@dao/NetworkDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { MeasurementDAO } from "@dao/MeasurementDAO";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(NetworkDAO).clear();
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(SensorDAO).clear();
  await TestDataSource.getRepository(MeasurementDAO).clear();
});

describe("Measurement Routes Integration Tests", () => {
  const networkCode = "net123";
  const gatewayMac = "00:1A:2B:3C:4D:5E";
  const sensorMac = "AA:BB:CC:DD:EE:FF";

  beforeEach(async () => {
    const networkRepo = TestDataSource.getRepository(NetworkDAO);
    const gatewayRepo = TestDataSource.getRepository(GatewayDAO);
    const sensorRepo = TestDataSource.getRepository(SensorDAO);

    await networkRepo.save({ code: networkCode, name: "Test Network", description: "A test network" });
    await gatewayRepo.save({ macAddress: gatewayMac, name: "Test Gateway", description: "A test gateway", network: { code: networkCode } });
    await sensorRepo.save({ macAddress: sensorMac, name: "Test Sensor", description: "A test sensor", variable: "temperature", unit: "Celsius", gateway: { macAddress: gatewayMac } });
  });

  it("POST /v1/sensors/:sensorMac/measurements - Store measurement for sensor", async () => {
    const response = await request(app)
      .post(`/v1/sensors/${sensorMac}/measurements`)
      .send({ networkCode, gatewayMac, createdAt: new Date().toISOString(), value: 42 })
      .expect(201);

    expect(response.body).toEqual({});
  });

  it("GET /v1/sensors/:sensorMac/measurements - Retrieve measurements for sensor", async () => {
    await TestDataSource.getRepository(MeasurementDAO).save({
      code: `${sensorMac}-1`,
      createdAt: new Date().toISOString(),
      value: 42,
      isOutlier: false,
      sensorMacAddress: sensorMac,
    });

    const response = await request(app)
      .get(`/v1/sensors/${sensorMac}/measurements`)
      .query({ networkCode, gatewayMac })
      .expect(200);

    expect(response.body.measurements).toHaveLength(1);
    expect(response.body.measurements[0]).toMatchObject({
      value: 42,
      isOutlier: false,
    });
  });

  it("GET /v1/sensors/:sensorMac/stats - Retrieve stats for sensor", async () => {
    await TestDataSource.getRepository(MeasurementDAO).save({
      code: `${sensorMac}-1`,
      createdAt: new Date().toISOString(),
      value: 42,
      isOutlier: false,
      sensorMacAddress: sensorMac,
    });

    const response = await request(app)
      .get(`/v1/sensors/${sensorMac}/stats`)
      .query({ networkCode, gatewayMac })
      .expect(200);

    expect(response.body).toEqual(expect.objectContaining({
      mean: expect.any(Number),
      variance: expect.any(Number),
      upperThreshold: expect.any(Number),
      lowerThreshold: expect.any(Number),
    }));
  });

  it("GET /v1/sensors/:sensorMac/outliers - Retrieve outliers for sensor", async () => {
    await TestDataSource.getRepository(MeasurementDAO).save({
      code: `${sensorMac}-1`,
      createdAt: new Date().toISOString(),
      value: 100,
      isOutlier: true,
      sensorMacAddress: sensorMac,
    });

    const response = await request(app)
      .get(`/v1/sensors/${sensorMac}/outliers`)
      .query({ networkCode, gatewayMac })
      .expect(200);

    expect(response.body.measurements).toHaveLength(1);
    expect(response.body.measurements[0]).toMatchObject({
      value: 100,
      isOutlier: true,
    });
  });

  it("GET /v1/networks/:networkCode/measurements - Retrieve measurements for sensors in network", async () => {
    await TestDataSource.getRepository(MeasurementDAO).save({
      code: `${sensorMac}-1`,
      createdAt: new Date().toISOString(),
      value: 42,
      isOutlier: false,
      sensorMacAddress: sensorMac,
    });

    const response = await request(app)
      .get(`/v1/networks/${networkCode}/measurements`)
      .query({ sensorMacs: [sensorMac] })
      .expect(200);

    expect(response.body).toHaveLength(1);
  });

  it("GET /v1/networks/:networkCode/stats - Retrieve stats for sensors in network", async () => {
    await TestDataSource.getRepository(MeasurementDAO).save({
      code: `${sensorMac}-1`,
      createdAt: new Date().toISOString(),
      value: 42,
      isOutlier: false,
      sensorMacAddress: sensorMac,
    });

    const response = await request(app)
      .get(`/v1/networks/${networkCode}/stats`)
      .query({ sensorMacs: [sensorMac] })
      .expect(200);

    expect(response.body).toHaveLength(1);
  });

  it("GET /v1/networks/:networkCode/outliers - Retrieve outliers for sensors in network", async () => {
    await TestDataSource.getRepository(MeasurementDAO).save({
      code: `${sensorMac}-1`,
      createdAt: new Date().toISOString(),
      value: 100,
      isOutlier: true,
      sensorMacAddress: sensorMac,
    });

    const response = await request(app)
      .get(`/v1/networks/${networkCode}/outliers`)
      .query({ sensorMacs: [sensorMac] })
      .expect(200);

    expect(response.body).toHaveLength(1);
  });
});
