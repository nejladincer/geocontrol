import { NetworkRepository } from "@repositories/NetworkRepository";
import { NetworkDAO } from "@dao/NetworkDAO";
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

describe("NetworkRepository: mocked database", () => {
  const repo = new NetworkRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("get all networks", async () => {
    const networks = [
      { code: "net1", name: "Network 1", description: "First network", gateways: [] },
      { code: "net2", name: "Network 2", description: "Second network", gateways: [] }
    ];
    mockFind.mockResolvedValue(networks);

    const result = await repo.getAllNetworks();

    expect(result).toEqual(networks);
    expect(mockFind).toHaveBeenCalledWith({
      relations: {
        gateways: true
      }
    });
  });

  it("get network by code", async () => {
    const network = { code: "net1", name: "Network 1", description: "Test network", gateways: [] };
    mockFind.mockResolvedValue([network]);

    const result = await repo.getNetworkByCode("net1");

    expect(result).toEqual(network);
    expect(mockFind).toHaveBeenCalledWith({
      where: { code: "net1" },
      relations: {
        gateways: true
      }
    });
  });

  it("get network by code: not found", async () => {
    mockFind.mockResolvedValue([]);

    await expect(repo.getNetworkByCode("non-existent")).rejects.toThrow(
      NotFoundError
    );
  });

  it("create network", async () => {
    mockFind.mockResolvedValue([]);
    const network = { code: "net1", name: "Network 1", description: "Test network" };
    mockSave.mockResolvedValue(network);

    const result = await repo.createNetwork("net1", "Network 1", "Test network");

    expect(result).toEqual(network);
    expect(mockSave).toHaveBeenCalledWith(network);
  });

  it("create network: conflict", async () => {
    mockFind.mockResolvedValue([{ code: "net1" }]);

    await expect(
      repo.createNetwork("net1", "Network 1", "Test network")
    ).rejects.toThrow(ConflictError);
  });

  it("update network", async () => {
    const existingNetwork = { code: "net1", name: "Old Name", description: "Old description" };
    mockFind.mockResolvedValue([existingNetwork]);
    
    const updatedNetwork = { ...existingNetwork, name: "New Name", description: "New description" };
    mockSave.mockResolvedValue(updatedNetwork);

    const result = await repo.updateNetwork("net1", "New Name", "New description");

    expect(result).toEqual(updatedNetwork);
    expect(mockSave).toHaveBeenCalledWith(updatedNetwork);
  });

  it("update network: not found", async () => {
    mockFind.mockResolvedValue([]);

    await expect(
      repo.updateNetwork("non-existent", "New Name", "New description")
    ).rejects.toThrow(NotFoundError);
  });

  it("delete network", async () => {
    const network = { code: "net1", name: "Network 1", description: "Test network" };
    mockFind.mockResolvedValue([network]);
    mockRemove.mockResolvedValue(undefined);

    await repo.deleteNetwork("net1");

    expect(mockRemove).toHaveBeenCalledWith(network);
  });

  it("delete network: not found", async () => {
    mockFind.mockResolvedValue([]);

    await expect(repo.deleteNetwork("non-existent")).rejects.toThrow(
      NotFoundError
    );
  });
}); 