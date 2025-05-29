import * as gatewayController from "@controllers/gatewayController";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { GatewayRepository } from "@repositories/GatewayRepository";

jest.mock("@repositories/GatewayRepository");

describe("GatewayController integration", () => {
  it("get Gateway: mapperService integration", async () => {

    const fakeGatewayDAO: GatewayDAO = {
      macAddress: "test-mac-address",
      name: "Test Gateway",
      description: "A test gateway",
      network: {} as NetworkDAO,
      networkCode: "test-network",
      sensors: []
    };
    
    const expectedDTO = {
      macAddress: fakeGatewayDAO.macAddress,
      name: fakeGatewayDAO.name,
      description: fakeGatewayDAO.description,
      sensors: fakeGatewayDAO.sensors
    };
    

    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getGatewayByMacAddress: jest.fn().mockResolvedValue(fakeGatewayDAO)
    }));

    const result = await gatewayController.getGateway("test-mac-address", "test-network");

    expect(result).toEqual({
      macAddress: expectedDTO.macAddress,
      name: expectedDTO.name,
      description: expectedDTO.description});
  });

  it("get all Gateways: mapperService integration", async () => {
    
    const fakeGateways: GatewayDAO[] = [
      {
        macAddress: "gateway-1",
        name: "Gateway 1",
        description: "First gateway",
        network: {} as NetworkDAO,
        networkCode: "test-network",
        sensors: []
      },
      {
        macAddress: "gateway-2",
        name: "Gateway 2",
        description: "Second gateway",
        network: {} as NetworkDAO,
        networkCode: "test-network",
        sensors: []
      }
    ];
    
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getAllGatewaysInNetwork: jest.fn().mockResolvedValue(fakeGateways)
    }));

    const result = await gatewayController.getAllGateways("test-network");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      macAddress: fakeGateways[0].macAddress,
      name: fakeGateways[0].name,
      description: fakeGateways[0].description});
    expect(result[1]).toEqual({
      macAddress: fakeGateways[1].macAddress,
      name: fakeGateways[1].name,
      description: fakeGateways[1].description});
  });
});