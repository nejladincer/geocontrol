import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Sensors API (e2e)", () => {
  let adminToken: string;
  let operatorToken: string;
  let viewerToken: string;

  const networkCode = "test-network";
  const gatewayMac = "test-mac-address";
  const sensorMac = "sensor-001";

  beforeAll(async () => {
    await beforeAllE2e();
    adminToken = generateToken(TEST_USERS.admin);
    operatorToken = generateToken(TEST_USERS.operator);
    viewerToken = generateToken(TEST_USERS.viewer);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors", () => {
    it("should get all sensors (admin)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should get all sensors (operator)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
        .set("Authorization", `Bearer ${operatorToken}`);
      expect(res.status).toBe(200);
    });

    it("should get all sensors (viewer)", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
        .set("Authorization", `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
    });

    it("should return 401 if no token", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`);
      expect(res.status).toBe(401);
    });

    it("should return 404 for non-existent gateway", async () => {
      const res = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/non-existent/sensors`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /networks/:networkCode/gateways/:gatewayMac/sensors", () => {
    const newSensor = {
      macAddress: sensorMac,
      name: "Temp Sensor",
      description: "Test sensor",
      variable: "temperature",
      unit: "C"
    };

    it("should create sensor (admin)", async () => {
      const res = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newSensor);
      expect(res.status).toBe(201);
    });

    it("should create sensor (operator)", async () => {
      const res = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send({ ...newSensor, macAddress: "sensor-002" });
      expect(res.status).toBe(201);
    });

    it("should not allow viewer to create sensor", async () => {
      const res = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .send(newSensor);
      expect(res.status).toBe(403);
    });

    it("should fail for duplicate sensor", async () => {
      const res = await request(app)
        .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newSensor);
      expect(res.status).toBe(409);
    });
  });

  describe("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac", () => {
  it("should return sensor (admin)", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.macAddress).toBe(sensorMac);
  });

  it("should return sensor (operator)", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${operatorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.macAddress).toBe(sensorMac);
  });

  it("should return sensor (viewer)", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.macAddress).toBe(sensorMac);
  });

  it("should return 404 for non-existent sensor", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/non-existent`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});


  describe("PATCH /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac", () => {
  const updateData = {
    name: "Updated Sensor",
    description: "Updated desc"
  };

  it("should update sensor (admin)", async () => {
    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);
    expect(res.status).toBe(204);
  });

  it("should update sensor (operator)", async () => {
    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${operatorToken}`)
      .send(updateData);
    expect(res.status).toBe(204);
  });

  it("should fail to update sensor (viewer)", async () => {
    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send(updateData);
    expect(res.status).toBe(403);
  });

  it("should return 404 for non-existent sensor", async () => {
    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/non-existent`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);
    expect(res.status).toBe(404);
  });
});


  describe("DELETE /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac", () => {
  it("should delete sensor (admin)", async () => {
    const res = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });

  it("should delete sensor (operator)", async () => {
    const res = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${operatorToken}`);
    expect(res.status).toBe(204);
  });

  it("should not allow viewer to delete sensor", async () => {
    const res = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  it("should return 404 for non-existent sensor", async () => {
    const res = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/non-existent`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

});
