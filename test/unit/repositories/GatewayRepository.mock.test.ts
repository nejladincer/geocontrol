import { GatewayRepository } from "@repositories/GatewayRepository";
import { GatewayDAO } from "@dao/GatewayDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      find: mockFind,
      findOne: mockFind,
      save: mockSave,
      remove: mockRemove
    }))
  }
}));

describe("GatewayRepository: mocked database", () => {
  const repo = new GatewayRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create gateway", async () => {
    mockFind.mockResolvedValue([]);
    const savedGateway = new GatewayDAO();
    savedGateway.macAddress = "mac1";
    savedGateway.name = "Gateway";
    savedGateway.description = "Test";
    mockSave.mockResolvedValue(savedGateway);

    const result = await repo.createGateway("mac1", "Gateway", "Test", "net1");

    expect(mockSave).toHaveBeenCalledWith({
      macAddress: "mac1",
      name: "Gateway",
      description: "Test",
      network: { code: "net1" }
    });
    expect(result.macAddress).toBe("mac1");
  });

  it("create gateway: conflict", async () => {
    mockFind.mockResolvedValue([new GatewayDAO()]);

    await expect(
      repo.createGateway("mac1", "Gateway", "Test", "net1")
    ).rejects.toThrow(ConflictError);
  });

  it("get gateway by mac: not found", async () => {
    mockFind.mockResolvedValue(undefined);

    await expect(repo.getGatewayByMacAddress("mac1", "net1")).rejects.toThrow(NotFoundError);
  });

  it("delete gateway", async () => {
    const gateway = new GatewayDAO();
    gateway.macAddress = "mac1";
    mockFind.mockResolvedValue(gateway);
    mockRemove.mockResolvedValue(undefined);

    await repo.deleteGateway("mac1", "net1");

    expect(mockRemove).toHaveBeenCalledWith(gateway);
  });
});