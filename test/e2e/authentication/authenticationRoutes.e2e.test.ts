import request from "supertest";
import { app } from "@app";
import { AppDataSource } from "@database";
import { beforeAllE2e, afterAllE2e } from "@test/e2e/lifecycle";
import { UserDAO } from "@dao/UserDAO";
import { UserType } from "@models/UserType";

describe("POST /api/v1/auth", () => {
  const validUser = {
    username: "test-user",
    password: "securepassword",
    type: UserType.Admin, 
  };

  beforeAll(async () => {
    await beforeAllE2e();

    const repo = AppDataSource.getRepository(UserDAO);
    const existing = await repo.findOneBy({ username: validUser.username });
    if (!existing) {
      const user = repo.create(validUser);
      await repo.save(user);
    }
  });

  afterAll(async () => {
    const repo = AppDataSource.getRepository(UserDAO);
    await repo.delete({ username: validUser.username });

    await afterAllE2e();
  });

  it("should return 200 and a token for valid credentials", async () => {
    const res = await request(app).post("/api/v1/auth").send({
      username: validUser.username,
      password: validUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe("string");
  });

  it("should return 401 for invalid password", async () => {
    const res = await request(app).post("/api/v1/auth").send({
      username: validUser.username,
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid password/i);
  });

  it("should return 404 for non-existent user", async () => {
    const res = await request(app).post("/api/v1/auth").send({
      username: "nonexistent",
      password: "doesntmatter",
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/user.*not found/i);
  });
});
