import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Networks API (e2e)", () => {
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

  describe("GET /networks", () => {
    it("should get all networks (admin)", async () => {
      const res = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should get all networks (operator)", async () => {
      const res = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should get all networks (viewer)", async () => {
      const res = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should fail without auth token", async () => {
      const res = await request(app).get("/api/v1/networks");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /networks", () => {
    const newNetwork = {
      code: "test-network",
      name: "Test Network",
      description: "A test network for e2e testing"
    };

    it("should create network (admin)", async () => {
      const res = await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newNetwork);

      expect(res.status).toBe(201);
    });

    it("should create network (operator)", async () => {
      const operatorNetwork = { ...newNetwork, code: "operator-network" };
      const res = await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(operatorNetwork);

      expect(res.status).toBe(201);
    });

    it("should fail to create network (viewer)", async () => {
      const res = await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${viewerToken}`)
        .send(newNetwork);

      expect(res.status).toBe(403);
    });

    it("should fail without auth token", async () => {
      const res = await request(app)
        .post("/api/v1/networks")
        .send(newNetwork);

      expect(res.status).toBe(401);
    });

    it("should fail with duplicate network code", async () => {
      const res = await request(app)
        .post("/api/v1/networks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newNetwork);

      expect(res.status).toBe(409);
    });
  });

  describe("GET /networks/:networkCode", () => {
    it("should get specific network (admin)", async () => {
      const res = await request(app)
        .get("/api/v1/networks/test-network")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe("test-network");
    });

    it("should get specific network (operator)", async () => {
      const res = await request(app)
        .get("/api/v1/networks/test-network")
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe("test-network");
    });

    it("should get specific network (viewer)", async () => {
      const res = await request(app)
        .get("/api/v1/networks/test-network")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe("test-network");
    });

    it("should fail for non-existent network", async () => {
      const res = await request(app)
        .get("/api/v1/networks/non-existent")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /networks/:networkCode", () => {
    const updateData = {
      name: "Updated Network",
      description: "Updated description"
    };

    it("should update network (admin)", async () => {
      const res = await request(app)
        .patch("/api/v1/networks/test-network")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(204);
    });

    it("should update network (operator)", async () => {
      const res = await request(app)
        .patch("/api/v1/networks/operator-network")
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(updateData);

      expect(res.status).toBe(204);
    });

    it("should fail to update network (viewer)", async () => {
      const res = await request(app)
        .patch("/api/v1/networks/test-network")
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
  });

  describe("DELETE /networks/:networkCode", () => {
    it("should delete network (admin)", async () => {
      const res = await request(app)
        .delete("/api/v1/networks/test-network")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    it("should delete network (operator)", async () => {
      const res = await request(app)
        .delete("/api/v1/networks/operator-network")
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(res.status).toBe(204);
    });

    it("should fail to delete network (viewer)", async () => {
      const res = await request(app)
        .delete("/api/v1/networks/test-network")
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
}); 