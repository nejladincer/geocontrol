import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as userController from "@controllers/userController";
import { UserType } from "@models/UserType";
import { User as UserDTO } from "@dto/User";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";

jest.mock("@services/authService");
jest.mock("@controllers/userController");

describe("UserRoutes Integration", () => {
  const token = "Bearer faketoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /users", () => {
    it("should return all users", async () => {
      const mockUsers: UserDTO[] = [
        { username: "admin", type: UserType.Admin },
        { username: "viewer", type: UserType.Viewer }
      ];

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (userController.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get("/api/v1/users")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(authService.processToken).toHaveBeenCalledWith(token, [UserType.Admin]);
      expect(userController.getAllUsers).toHaveBeenCalled();
    });

    it("should return 401 without token", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized: No token provided");
      });

      const response = await request(app)
        .get("/api/v1/users")
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("should return 403 with insufficient rights", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const response = await request(app)
        .get("/api/v1/users")
        .set("Authorization", token);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Insufficient rights/);
    });
  });

  describe("POST /users", () => {
    it("should create a new user", async () => {
      const newUser: UserDTO = {
        username: "newuser",
        password: "password123",
        type: UserType.Operator
      };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (userController.createUser as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/v1/users")
        .set("Authorization", token)
        .send(newUser);

      expect(response.status).toBe(201);
      expect(authService.processToken).toHaveBeenCalledWith(token, [UserType.Admin]);
      expect(userController.createUser).toHaveBeenCalledWith(newUser);
    });

    it("should return 401 without token", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized: No token provided");
      });

      const response = await request(app)
        .post("/api/v1/users")
        .set("Authorization", "Bearer invalid")
        .send({ username: "newuser", password: "pass", type: UserType.Operator });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
    });
  });

  describe("GET /users/:userName", () => {
    it("should return a specific user", async () => {
      const mockUser: UserDTO = { 
        username: "testuser", 
        type: UserType.Operator 
      };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (userController.getUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/api/v1/users/testuser")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(authService.processToken).toHaveBeenCalledWith(token, [UserType.Admin]);
      expect(userController.getUser).toHaveBeenCalledWith("testuser");
    });

    it("should return 401 without token", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized: No token provided");
      });

      const response = await request(app)
        .get("/api/v1/users/testuser")
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
    });
  });

  describe("DELETE /users/:userName", () => {
    it("should delete a user", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (userController.deleteUser as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete("/api/v1/users/testuser")
        .set("Authorization", token);

      expect(response.status).toBe(204);
      expect(authService.processToken).toHaveBeenCalledWith(token, [UserType.Admin]);
      expect(userController.deleteUser).toHaveBeenCalledWith("testuser");
    });

    it("should return 401 without token", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized: No token provided");
      });

      const response = await request(app)
        .delete("/api/v1/users/testuser")
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
    });
  });
}); 