import * as networkController from "@controllers/networkController";
import { NetworkDAO } from "@dao/NetworkDAO";
import { NetworkRepository } from "@repositories/NetworkRepository";

jest.mock("@repositories/NetworkRepository");

describe("NetworkController integration", () => {
  it("get Network: mapperService integration", async () => {
    const fakeNetworkDAO: NetworkDAO = {
      code: "test-network",
      name: "Test Network",
      description: "A test network",
      gateways: []
    };

    const expectedDTO = {
      code: fakeNetworkDAO.code,
      name: fakeNetworkDAO.name,
      description: fakeNetworkDAO.description,
      gateways: fakeNetworkDAO.gateways
    };

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getNetworkByCode: jest.fn().mockResolvedValue(fakeNetworkDAO)
    }));

    const result = await networkController.getNetwork("test-network");

    expect(result).toEqual({
      code: expectedDTO.code,
      name: expectedDTO.name,
      description: expectedDTO.description
    });
  });

  it("get all Networks: mapperService integration", async () => {
    const fakeNetworks: NetworkDAO[] = [
      {
        code: "network-1",
        name: "Network 1",
        description: "First network",
        gateways: []
      },
      {
        code: "network-2",
        name: "Network 2",
        description: "Second network",
        gateways: []
      }
    ];

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getAllNetworks: jest.fn().mockResolvedValue(fakeNetworks)
    }));

    const result = await networkController.getAllNetworks();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      code: fakeNetworks[0].code,
      name: fakeNetworks[0].name,
      description: fakeNetworks[0].description
    });
    expect(result[1]).toEqual({
      code: fakeNetworks[1].code,
      name: fakeNetworks[1].name,
      description: fakeNetworks[1].description
    });
  });
}); 