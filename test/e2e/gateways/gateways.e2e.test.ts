import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Gateways API (e2e)", () => {
  let adminToken: string;
  let operatorToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    await beforeAllE2e();
    adminToken = generateToken(TEST_USERS.admin);
    operatorToken = generateToken(TEST_USERS.operator);
    viewerToken = generateToken(TEST_USERS.viewer);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  describe("GET /networks/:networkCode/gateways", () => {
    it("should get all gateways (admin)", async () => {
      const res = await request(app)
        .get("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should get all networks (operator)", async () => {
      const res = await request(app)
        .get("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should get all networks (viewer)", async () => {
      const res = await request(app)
        .get("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should fail without auth token", async () => {
      const res = await request(app).get("/api/v1/networks/:networkCode/gateways");
      expect(res.status).toBe(401);
    });

    it("should fail for non-existent network", async () => {
      const res = await request(app)
        .get("/api/v1/networks/non-existent/gateways")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
  });

  describe("POST /networks/:networkCode/gateways", () => {
    const newGateway = {
      macAddress: "test-mac-address",
      name: "Test Gateway",
      description: "A gateway for testing",
      sensors: []
    };

    it("should create gateway (admin)", async () => {
      const res = await request(app)
        .post("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newGateway);

      expect(res.status).toBe(201);
    });

    it("should create gateway (operator)", async () => {
      const res = await request(app)
        .post("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(newGateway);

      expect(res.status).toBe(201);
    });

    it("should create network (operator)", async () => {
      const operatorGateway = { ...newGateway, macAddress: "operator-mac-address" };
      const res = await request(app)
        .post("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(operatorGateway);

      expect(res.status).toBe(201);
    });

    it("should fail to create gateway (viewer)", async () => {
      const res = await request(app)
        .post("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", `Bearer ${viewerToken}`)
        .send(newGateway);

      expect(res.status).toBe(403);
    });

    it("should fail without auth token", async () => {
      const res = await request(app)
        .post("/api/v1/networks/:networkCode/gateways")
        .send(newGateway);

      expect(res.status).toBe(401);
    });

    it("should fail for non-existent network", async () => {
      const res = await request(app)
        .get("/api/v1/networks/non-existent")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it("should fail with duplicate gateway mac address", async () => {
      const res = await request(app)
        .post("/api/v1/networks/:networkCode/gateways")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newGateway);

      expect(res.status).toBe(409);
    });
  });

  describe("GET /networks/:networkCode/gateways/:macAddress", () => {
    it("should get specific gateway (admin)", async () => {
      const res = await request(app)
        .get("/api/v1/networks/:networkCode/gateways/test-mac-address")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.macAddress).toBe("test-mac-address");
    });

    it("should get specific gateway (operator)", async () => {
      const res = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-mac-address")
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.macAddress).toBe("test-mac-address");
    });

    it("should get specific gateway (viewer)", async () => {
      const res = await request(app)
        .get("/api/v1/networks/test-network/gateways/test-mac-address")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.macAddress).toBe("test-mac-address");
    });

    it("should fail for non-existent network", async () => {
      const res = await request(app)
        .get("/api/v1/networks/non-existent")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it("should fail for non-existent gateway", async () => {
      const res = await request(app)
        .get("/api/v1/networks/:networkCode/gateways/non-existent")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /networks/:networkCode/gateways/:macAddress", () => {
    const updateData = {
      name: "Updated Gateway",
      description: "Updated description"
    };

    it("should update gateway (admin)", async () => {
      const res = await request(app)
        .patch("/api/v1/networks/:networkCode/gateways/test-mac-address")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(204);
    });

    it("should update gateway (operator)", async () => {
      const res = await request(app)
        .patch("/api/v1/networks/:networkCode/gateways/test-mac-address")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(updateData);

      expect(res.status).toBe(204);
    });

    it("should fail to update gateway (viewer)", async () => {
      const res = await request(app)
        .patch("/api/v1/networks/:networkCode/gateways/test-mac-address")
        .set("Authorization", `Bearer ${viewerToken}`)
        .send(updateData);

      expect(res.status).toBe(403);
    });

    it("should fail for non-existent network", async () => {
      const res = await request(app)
        .patch("/api/v1/networks/non-existent")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(404);
    });

    it("should fail for non-existent gateway", async () => {
      const res = await request(app)
        .patch("/api/v1/networks/:networkCode/gateways/non-existent")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /networks/:networkCode/gateways/:macAddress", () => {
    it("should delete gateway (admin)", async () => {
      const res = await request(app)
        .delete("/api/v1/networks/:networkCode/gateways/test-mac-address")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    it("should delete network (operator)", async () => {
      const res = await request(app)
        .delete("/api/v1/networks/:networkCode/gateways/operator-mac-address")
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.status).toBe(204);
    });

    it("should fail to delete gateway (viewer)", async () => {
      const res = await request(app)
        .delete("/api/v1/networks/:networkCode/gateways/test-mac-address")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it("should fail for non-existent network", async () => {
      const res = await request(app)
        .delete("/api/v1/networks/non-existent")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  it("should fail for non-existent gateway", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/:networkCode/gateways/non-existent")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
})