import { createErrorDTO, mapUserDAOToDTO } from "@services/mappings/errorMapperService";
import { UserType } from "@models/UserType";

describe("ErrorMapperService", () => {
  describe("createErrorDTO", () => {
    it("should create error DTO with all properties", () => {
      const result = createErrorDTO(400, "Bad Request", "ValidationError");

      expect(result).toEqual({
        code: 400,
        message: "Bad Request",
        name: "ValidationError"
      });
    });

    it("should create error DTO with only code", () => {
      const result = createErrorDTO(500);

      expect(result).toEqual({
        code: 500
      });
    });

    it("should create error DTO with code and message", () => {
      const result = createErrorDTO(404, "Not Found");

      expect(result).toEqual({
        code: 404,
        message: "Not Found"
      });
    });

    it("should remove null attributes", () => {
      const result = createErrorDTO(500, null, null);

      expect(result).toEqual({
        code: 500
      });
    });
  });

  describe("mapUserDAOToDTO", () => {
    it("should map UserDAO to UserDTO", () => {
      const userDAO = {
        username: "testuser",
        password: "hashedpassword",
        type: UserType.Admin
      };

      const result = mapUserDAOToDTO(userDAO);

      expect(result).toEqual({
        username: "testuser",
        type: UserType.Admin
      });
    });

    it("should handle different user types", () => {
      const userDAO = {
        username: "testuser",
        password: "hashedpassword",
        type: UserType.Viewer
      };

      const result = mapUserDAOToDTO(userDAO);

      expect(result).toEqual({
        username: "testuser",
        type: UserType.Viewer
      });
    });
  });
}); 