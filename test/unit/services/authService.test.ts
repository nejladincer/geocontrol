import jwt from "jsonwebtoken";
import { SECRET_KEY } from "@config";
import { UserType } from "@models/UserType";
import { UserRepository } from "@repositories/UserRepository";
import { UserDAO } from "@dao/UserDAO";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import * as authService from "@services/authService";

jest.mock("@repositories/UserRepository");
jest.mock("jsonwebtoken");

describe("AuthService", () => {
  const mockUser: UserDAO = {
    username: "testuser",
    password: "hashedpassword",
    type: UserType.Admin
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      const mockToken = "mock.jwt.token";
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = authService.generateToken({
        username: mockUser.username,
        type: mockUser.type
      });

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { username: mockUser.username, type: mockUser.type },
        SECRET_KEY,
        expect.any(Object)
      );
    });
  });

  describe("processToken", () => {
    it("should process valid token with correct role", async () => {
      const mockToken = "valid.token";
      const mockUserDTO = { username: mockUser.username, type: mockUser.type };
      
      (jwt.verify as jest.Mock).mockReturnValue(mockUserDTO);
      (UserRepository as jest.Mock).mockImplementation(() => ({
        getUserByUsername: jest.fn().mockResolvedValue(mockUser)
      }));

      await expect(
        authService.processToken(`Bearer ${mockToken}`, [UserType.Admin])
      ).resolves.not.toThrow();
    });

    it("should throw UnauthorizedError when token is missing", async () => {
      await expect(authService.processToken()).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError when token format is invalid", async () => {
      await expect(authService.processToken("InvalidToken")).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError when user not found", async () => {
      const mockToken = "valid.token";
      const mockUserDTO = { username: "nonexistent", type: UserType.Admin };
      
      (jwt.verify as jest.Mock).mockReturnValue(mockUserDTO);
      (UserRepository as jest.Mock).mockImplementation(() => ({
        getUserByUsername: jest.fn().mockRejectedValue(new Error("User not found"))
      }));

      await expect(
        authService.processToken(`Bearer ${mockToken}`)
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw InsufficientRightsError when user role is not allowed", async () => {
      const mockToken = "valid.token";
      const mockUserDTO = { username: mockUser.username, type: UserType.Viewer };
      
      (jwt.verify as jest.Mock).mockReturnValue(mockUserDTO);
      (UserRepository as jest.Mock).mockImplementation(() => ({
        getUserByUsername: jest.fn().mockResolvedValue({ ...mockUser, type: UserType.Viewer })
      }));

      await expect(
        authService.processToken(`Bearer ${mockToken}`, [UserType.Admin])
      ).rejects.toThrow(InsufficientRightsError);
    });
  });
}); 