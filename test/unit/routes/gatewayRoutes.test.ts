import { getMockReq, getMockRes } from "@jest-mock/express";
import { authenticateUser } from "@middlewares/authMiddleware";
import * as gatewayController from "@controllers/gatewayController";
import AppError from "@models/errors/AppError";

const routerMock = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};
jest.mock("express", () => ({
  ...jest.requireActual("express"),
  Router: () => routerMock,
}));

jest.mock("@middlewares/authMiddleware", () => ({
  authenticateUser: jest.fn(() => (req: any, res: any, next: any) => next()),
  authenticateAdminOrOperator: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

jest.mock("@controllers/gatewayController", () => ({
  getAllGateways: jest.fn(),
  getGateway: jest.fn(),
  createGateway: jest.fn(),
  updateGateway: jest.fn(),
  deleteGateway: jest.fn()
}));

require("@routes/gatewayRoutes");

describe("Gateway Routes", () => {
  it("should register GET /", () => {
    expect(routerMock.get).toHaveBeenCalledWith(
      "/",
      expect.any(Function),
      expect.any(Function)
    );
  });

  it("should register POST /", () => {
    expect(routerMock.post).toHaveBeenCalledWith(
      "/",
      expect.any(Function),
      expect.any(Function)
    );
  });

  it("should register GET /:macAddress", () => {
    expect(routerMock.get).toHaveBeenCalledWith(
      "/:macAddress",
      expect.any(Function),
      expect.any(Function)
    );
  });

  it("should register PATCH /:macAddress", () => {
    expect(routerMock.patch).toHaveBeenCalledWith(
      "/:macAddress",
      expect.any(Function),
      expect.any(Function)
    );
  });

  it("should register DELETE /:macAddress", () => {
    expect(routerMock.delete).toHaveBeenCalledWith(
      "/:macAddress",
      expect.any(Function),
      expect.any(Function)
    );
  });
});