import { NetworkRepository } from "@repositories/NetworkRepository";
import { NetworkDAO } from "@dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();
const mockDelete = jest.fn();
const mockCreate = jest.fn(); // Add a mock for create method

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      find: mockFind,
      findOne: mockFindOne,
      save: mockSave,
      remove: mockRemove,
      delete: mockDelete,
      create: mockCreate // Add the create mock to the returned object
    })),
    transaction: jest.fn(async (callback) => callback({
      getRepository: () => ({
        find: mockFind,
        findOne: mockFindOne,
        save: mockSave,
        remove: mockRemove,
        delete: mockDelete,
        create: mockCreate
      })
    }))
  }
}));

describe("NetworkRepository: mocked database", () => {
  const repo = new NetworkRepository();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default implementation for mockCreate
    mockCreate.mockImplementation(entity => entity);
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
    
    mockFindOne.mockResolvedValue(existingNetwork);
    
    const updatedNetwork = { ...existingNetwork, name: "New Name", description: "New description" };
    mockSave.mockResolvedValue(updatedNetwork);

    const result = await repo.updateNetwork("net1", "net1", "New Name", "New description");

    expect(result).toEqual(updatedNetwork);
    expect(mockSave).toHaveBeenCalledWith(updatedNetwork);
  });

  it("update network: without changing code", async () => {
    // Mock network found
    mockFindOne.mockResolvedValueOnce({
      code: "net1",
      name: "Old Name",
      description: "Old description"
    });
    
    const updatedNetwork = {
      code: "net1",
      name: "New Name",
      description: "New description"
    };
    
    mockSave.mockResolvedValue(updatedNetwork);

    // Update call with all 4 parameters
    const result = await repo.updateNetwork("net1", "net1", "New Name", "New description");

    expect(result).toEqual(updatedNetwork);
    // Rest of the test remains the same
  });

  it("update network: with code change", async () => {
    // First mock finding the original network
    mockFindOne.mockResolvedValueOnce({ 
      code: "net1", 
      name: "Old Name", 
      description: "Old description",
      gateways: []
    });
    
    // Then mock checking for existing network with new code (should return null)
    mockFindOne.mockResolvedValueOnce(null);
    
    // Mock the newly created network
    mockCreate.mockReturnValue({
      code: "net2",
      name: "New Name",
      description: "New description"
    });
    
    const updatedNetwork = { code: "net2", name: "New Name", description: "New description" };
    mockSave.mockResolvedValue(updatedNetwork);
    
    // Mock findOne for retrieving the final result
    mockFindOne.mockResolvedValueOnce(updatedNetwork);

    // Call with 4 parameters (old code, new code, new name, new description)
    const result = await repo.updateNetwork("net1", "net2", "New Name", "New description");
    
    expect(result).toEqual(updatedNetwork);
    expect(mockCreate).toHaveBeenCalledWith({
      code: "net2",
      name: "New Name",
      description: "New description"
    });
  });

  it("update network: conflict on code change", async () => {
    mockFind.mockResolvedValue([{ code: "net2" }]);

    await expect(
      repo.updateNetwork("net1", "net2", "New Name", "New description")
    ).rejects.toThrow(ConflictError);
  });

  it("update network: not found", async () => {
    mockFindOne.mockResolvedValue(null);

    await expect(
      repo.updateNetwork("non-existent", "net1", "New Name", "New description")
    ).rejects.toThrow(NotFoundError);
  });

  it("delete network", async () => {
    const network = { 
      code: "net1", 
      name: "Network 1", 
      description: "Test network",
      gateways: [] 
    };
    
    mockFindOne.mockResolvedValue(network);
    mockDelete.mockResolvedValue(undefined);

    await repo.deleteNetwork("net1");

    expect(mockDelete).toHaveBeenCalledWith({ code: "net1" });
  });

  it("delete network: not found", async () => {
    mockFindOne.mockResolvedValue(null);

    await expect(repo.deleteNetwork("non-existent")).rejects.toThrow(
      NotFoundError
    );
  });
});