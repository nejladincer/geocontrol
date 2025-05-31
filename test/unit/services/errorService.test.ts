import { AppError } from "@models/errors/AppError";
import { createAppError } from "@services/errorService";
import { logError } from "@services/loggingService";

jest.mock("@services/loggingService");
jest.mock("@services/mappings/errorMapperService", () => ({
  createErrorDTO: jest.fn((status, message, name) => ({
    status,
    message,
    name
  }))
}));

describe("ErrorService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAppError", () => {
    it("should handle AppError instances", () => {
      const appError = new AppError("Test error", 400);
      const result = createAppError(appError);

      expect(result).toEqual({
        status: 400,
        message: "Test error",
        name: "Error"
      });
      expect(logError).toHaveBeenCalled();
    });

    it("should handle errors with status property", () => {
      const error = {
        status: 404,
        message: "Not found",
        name: "NotFoundError"
      };
      const result = createAppError(error);

      expect(result).toEqual({
        status: 404,
        message: "Not found",
        name: "NotFoundError"
      });
      expect(logError).toHaveBeenCalled();
    });

    it("should handle generic errors", () => {
      const error = new Error("Generic error");
      const result = createAppError(error);

      expect(result).toEqual({
        status: 500,
        message: "Generic error",
        name: "InternalServerError"
      });
      expect(logError).toHaveBeenCalled();
    });

    it("should handle undefined errors", () => {
      const result = createAppError(undefined);

      expect(result).toEqual({
        status: 500,
        message: "Internal Server Error",
        name: "InternalServerError"
      });
      expect(logError).toHaveBeenCalled();
    });

    it("should log error stack trace when available", () => {
      const error = new Error("Test error");
      error.stack = "test stack trace";
      createAppError(error);

      expect(logError).toHaveBeenCalledWith(error);
      expect(logError).toHaveBeenCalledWith(
        expect.stringContaining("test stack trace")
      );
    });
  });
}); 