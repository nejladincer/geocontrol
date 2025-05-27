import * as gatewayController from "@controllers/gatewayController";
import { GatewayDAO } from "@dao/GatewayDAO";

const fakeGatewayDAO: GatewayDAO = {
  macAddress: "test-mac-address",
  name: "Test Gateway",
  description: "A test gateway",
  networkCode: "test-network",
  sensors: []
};

const fakeGateways: GatewayDAO[] = [
  {
    macAddress: "gateway-1",
    name: "Gateway 1",
    description: "First gateway",
    networkCode: "test-network",
    sensors: []
  },
  {
    macAddress: "gateway-2",
    name: "Gateway 2",
    description: "Second gateway",
    networkCode: "test-network",
    sensors: []
  }
];

jest.mock("@repositories/GatewayRepository", () => {
  return {
    GatewayRepository: jest.fn().mockImplementation(() => ({
      getGatewayByMacAddress: jest.fn().mockResolvedValue(fakeGatewayDAO),
      getAllGatewaysInNetwork: jest.fn().mockResolvedValue(fakeGateways),
    })),
  };
});

describe("GatewayController integration", () => {
  it("get Gateway: mapperService integration", async () => {
    const result = await gatewayController.getGateway("test-mac-address", "test-network");

    expect(result).toEqual(fakeGatewayDAO);
  });

  it("get all Gateways: mapperService integration", async () => {
    const result = await gatewayController.getAllGateways("test-network");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(fakeGateways[0]);
    expect(result[1]).toEqual(fakeGateways[1]);
  });
});