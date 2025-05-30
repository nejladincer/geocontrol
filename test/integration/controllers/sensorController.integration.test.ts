import * as sensorController from "@controllers/SensorController";
import { SensorRepository } from "@repositories/SensorRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { GatewayDAO } from "@dao/GatewayDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { Sensor as SensorDTO } from "@dto/Sensor";
import { NetworkDAO } from "@dao/NetworkDAO";

jest.mock("@repositories/SensorRepository");
jest.mock("@repositories/GatewayRepository");

describe("SensorController integration", () => {
  const networkCode = "test-network";
  const gatewayMac = "test-gateway";

  const fakeGatewayDAO: GatewayDAO = {
    macAddress: gatewayMac,
    name: "Gateway 1",
    description: "Test gateway",
    network: {} as NetworkDAO,
    networkCode: networkCode,
    sensors: []
  };

  const fakeSensors: SensorDAO[] = [
    {
      macAddress: "sensor-1",
      name: "Sensor 1",
      description: "First sensor",
      variable: "temperature",
      unit: "C",
      gateway: fakeGatewayDAO,
      gatewayMac: gatewayMac,
      measurements: []
    },
    {
      macAddress: "sensor-2",
      name: "Sensor 2",
      description: "Second sensor",
      variable: "humidity",
      unit: "%",
      gateway: fakeGatewayDAO,
      gatewayMac: gatewayMac,
      measurements: []
    }
  ];

  it("getSensor: returns DTO after mapping", async () => {
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getGatewayByMacAddress: jest.fn().mockResolvedValue(fakeGatewayDAO)
    }));
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorByMacAddress: jest.fn().mockResolvedValue(fakeSensors[0])
    }));

    const result = await sensorController.getSensor("sensor-1", gatewayMac, networkCode);

    expect(result).toEqual({
      macAddress: "sensor-1",
      name: "Sensor 1",
      description: "First sensor",
      variable: "temperature",
      unit: "C"
    });
  });

  it("getAllSensors: returns array of DTOs", async () => {
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getGatewayByMacAddress: jest.fn().mockResolvedValue(fakeGatewayDAO)
    }));
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getAllSensorsInGateway: jest.fn().mockResolvedValue(fakeSensors)
    }));

    const result = await sensorController.getAllSensors(networkCode, gatewayMac);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      macAddress: "sensor-1",
      name: "Sensor 1",
      description: "First sensor",
      variable: "temperature",
      unit: "C"
    });
    expect(result[1]).toEqual({
      macAddress: "sensor-2",
      name: "Sensor 2",
      description: "Second sensor",
      variable: "humidity",
      unit: "%"
    });
  });
});
