import { NetworkRepository } from "@repositories/NetworkRepository";
import { NetworkDAO } from "@dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("NetworkRepository: SQLite in-memory", () => {
  const repo = new NetworkRepository();

  it("create and retrieve network", async () => {
    const network = await repo.createNetwork("net1", "Network 1", "First network");

    expect(network).toMatchObject({
      code: "net1",
      name: "Network 1",
      description: "First network"
    });

    const found = await repo.getNetworkByCode("net1");
    expect(found.code).toBe("net1");
  });

  it("create network: conflict", async () => {
    await repo.createNetwork("net1", "Network 1", "First network");

    await expect(
      repo.createNetwork("net1", "Another Network", "Second network")
    ).rejects.toThrow(ConflictError);
  });

  it("get all networks", async () => {
    await repo.createNetwork("net1", "Network 1", "First network");
    await repo.createNetwork("net2", "Network 2", "Second network");

    const networks = await repo.getAllNetworks();
    expect(networks).toHaveLength(2);
    expect(networks.map(n => n.code)).toContain("net1");
    expect(networks.map(n => n.code)).toContain("net2");
  });

  it("get network by code: not found", async () => {
    await expect(repo.getNetworkByCode("non-existent"))
      .rejects.toThrow("Network with code 'non-existent' not found");
  });

  it("update network", async () => {
    await repo.createNetwork("net1", "Old Name", "Old description");

    const updated = await repo.updateNetwork(
      "net1",
      "New Name",
      "New description"
    );

    expect(updated.name).toBe("New Name");
    expect(updated.description).toBe("New description");
    expect(updated.code).toBe("net1");

    const found = await repo.getNetworkByCode("net1");
    expect(found.name).toBe("New Name");
    expect(found.description).toBe("New description");
  });

  it("update network: not found", async () => {
    await expect(
      repo.updateNetwork("non-existent", "New Name", "New description")
    ).rejects.toThrow(NotFoundError);
  });

  it("delete network", async () => {
    await repo.createNetwork("net1", "Network 1", "Test network");
    await repo.deleteNetwork("net1");

    await expect(repo.getNetworkByCode("net1"))
      .rejects.toThrow(NotFoundError);
  });

  it("delete network: not found", async () => {
    await expect(repo.deleteNetwork("non-existent"))
      .rejects.toThrow(NotFoundError);
  });
}); 