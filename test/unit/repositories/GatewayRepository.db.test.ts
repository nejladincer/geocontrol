import { GatewayRepository } from "@repositories/GatewayRepository";
import { GatewayDAO } from "@dao/GatewayDAO";
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
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("GatewayRepository: SQLite in-memory", () => {
  const repo = new GatewayRepository();

  it("create and retrieve gateway", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({
      code: "net1",
      name: "Test Network",
      description: "A test network"
    });

    const gateway = await repo.createGateway("mac1", "Gateway 1", "First gateway", network.code);

    expect(gateway).toMatchObject({
      macAddress: "mac1",
      name: "Gateway 1",
      description: "First gateway"
    });

    const found = await repo.getGatewayByMacAddress("mac1", "net1");
    expect(found.macAddress).toBe("mac1");
  });

  it("create gateway: conflict", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({ code: "net1", name: "Test", description: "Create test"});

    await repo.createGateway("mac1", "Gateway 1", "Desc", "net1");

    await expect(
      repo.createGateway("mac1", "Another Gateway", "Desc", "net1")
    ).rejects.toThrow(ConflictError);
  });

  it("get all gateways in network", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({ code: "net1", name: "Test", description: "Get all test" });

    await repo.createGateway("mac1", "Gateway 1", "Desc", "net1");
    await repo.createGateway("mac2", "Gateway 2", "Desc", "net1");

    const gateways = await repo.getAllGatewaysInNetwork("net1");
    expect(gateways).toHaveLength(2);
  });

  it("getAllGatewaysInNetwork: throws if network not found", async () => {
    await expect(repo.getAllGatewaysInNetwork("non-existent-code"))
      .rejects.toThrow("Network with code 'non-existent-code' not found");
  });

  it("getGatewayByMacAddress: throws if gateway not found", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({
      code: "net1",
      name: "Test",
      description: "desc"
    });
  
    await expect(repo.getGatewayByMacAddress("unknown-mac", "net1"))
      .rejects.toThrow("Gateway with macAddress 'unknown-mac' not found");
  });

  it("delete gateway", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({ code: "net1", name: "Test", description: "Delete test" });

    await repo.createGateway("mac1", "Gateway 1", "Desc", "net1");

    await repo.deleteGateway("mac1", "net1");

    await expect(repo.getGatewayByMacAddress("mac1", "net1")).rejects.toThrow(NotFoundError);
  });

  it("deleteGateway: throws if gateway does not exist", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({
      code: "net1",
      name: "Test",
      description: "desc"
    });
  
    await expect(repo.deleteGateway("non-existent-mac", "net1"))
      .rejects.toThrow("Gateway with macAddress 'non-existent-mac' not found");
  });

  it("update gateway", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({ code: "net1", name: "Test", description: "Update test" });

    await repo.createGateway("mac1", "Old Name", "Old Desc", "net1");

    const updated = await repo.updateGateway("mac1", "net1", {
      newName: "New Name",
      newDescription: "New Desc"
    });

    expect(updated.name).toBe("New Name");
    expect(updated.description).toBe("New Desc");
  });

  it("updateGateway: throws ConflictError if newMacAddress already exists", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({
      code: "net1",
      name: "Test",
      description: "desc"
    });
  
    await repo.createGateway("mac1", "Name 1", "Desc 1", "net1");
    await repo.createGateway("mac2", "Name 2", "Desc 2", "net1");
  
    await expect(
      repo.updateGateway("mac1", "net1", { newMacAddress: "mac2" })
    ).rejects.toThrow(ConflictError);
  });

  it("updateGateway: handles empty update gracefully", async () => {
    const network = await TestDataSource.getRepository(NetworkDAO).save({
      code: "net1",
      name: "Test",
      description: "desc"
    });
  
    await repo.createGateway("mac1", "Old Name", "Old Desc", "net1");
  
    const updated = await repo.updateGateway("mac1", "net1", {});
  
    expect(updated.macAddress).toBe("mac1");
    expect(updated.name).toBe("Old Name");
    expect(updated.description).toBe("Old Desc");
  });
});