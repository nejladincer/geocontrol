import { MeasurementsRepository } from "@repositories/MeasurementsRepository";
import * as measurementsController from "@controllers/measurementsController";
import AppError from "@models/errors/AppError";
import { Measurements } from "@models/dto/Measurements";
import { Stats } from "@models/dto/Stats";

jest.mock("@repositories/MeasurementsRepository");

describe("MeasurementsController", () => {
  const networkCode = "test-network";
  const gatewayMac = "test-gateway";
  const sensorMac = "test-sensor";
  const startDate = "2024-01-01";
  const endDate = "2024-01-31";

  const mockMeasurements: Measurements = {
    sensorMacAddress: sensorMac,
    stats: {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      mean: 25.5,
      variance: 2.5,
      upperThreshold: 30.5,
      lowerThreshold: 20.5
    },
    measurements: [
      { createdAt: new Date("2024-01-15"), value: 25.5, isOutlier: false }
    ]
  };

  const mockStats: Stats = {
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    mean: 25.5,
    variance: 2.5,
    upperThreshold: 30.5,
    lowerThreshold: 20.5
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMeasurementsFromSensorsInNetwork", () => {
    it("should return measurements for sensors in network", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensorsInNetwork: jest.fn().mockResolvedValue([mockMeasurements])
      }));

      const result = await measurementsController.getMeasurementsFromSensorsInNetwork(
        networkCode,
        [sensorMac],
        startDate,
        endDate
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMeasurements);
    });

    it("should pass through AppError", async () => {
      const error = new AppError("Custom error", 400);
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensorsInNetwork: jest.fn().mockRejectedValue(error)
      }));

      await expect(measurementsController.getMeasurementsFromSensorsInNetwork(networkCode))
        .rejects.toThrow(error);
    });

    it("should throw 500 on other errors", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensorsInNetwork: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(measurementsController.getMeasurementsFromSensorsInNetwork(networkCode))
        .rejects.toThrow("Failed to get measurements");
    });

    it("should handle optional parameters", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensorsInNetwork: jest.fn().mockResolvedValue([mockMeasurements])
      }));

      const result = await measurementsController.getMeasurementsFromSensorsInNetwork(networkCode);
      expect(result).toHaveLength(1);
    });
  });

  describe("getStatsFromSensorsInNetwork", () => {
    it("should return stats for sensors in network", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getStatsFromSensorsInNetwork: jest.fn().mockResolvedValue([mockStats])
      }));

      const result = await measurementsController.getStatsFromSensorsInNetwork(
        networkCode,
        [sensorMac],
        startDate,
        endDate
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockStats);
    });

    it("should pass through AppError", async () => {
      const error = new AppError("Custom error", 400);
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getStatsFromSensorsInNetwork: jest.fn().mockRejectedValue(error)
      }));

      await expect(measurementsController.getStatsFromSensorsInNetwork(networkCode))
        .rejects.toThrow(error);
    });

    it("should throw 500 on other errors", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getStatsFromSensorsInNetwork: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(measurementsController.getStatsFromSensorsInNetwork(networkCode))
        .rejects.toThrow("Failed to get statistics");
    });

    it("should handle optional parameters", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getStatsFromSensorsInNetwork: jest.fn().mockResolvedValue([mockStats])
      }));

      const result = await measurementsController.getStatsFromSensorsInNetwork(networkCode);
      expect(result).toHaveLength(1);
    });
  });

  describe("getOutliersFromSensorsInNetwork", () => {
    it("should return outliers for sensors in network", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getOutliersFromSensorsInNetwork: jest.fn().mockResolvedValue([mockMeasurements])
      }));

      const result = await measurementsController.getOutliersFromSensorsInNetwork(
        networkCode,
        [sensorMac],
        startDate,
        endDate
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMeasurements);
    });

    it("should pass through AppError", async () => {
      const error = new AppError("Custom error", 400);
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getOutliersFromSensorsInNetwork: jest.fn().mockRejectedValue(error)
      }));

      await expect(measurementsController.getOutliersFromSensorsInNetwork(networkCode))
        .rejects.toThrow(error);
    });

    it("should throw 500 on other errors", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getOutliersFromSensorsInNetwork: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(measurementsController.getOutliersFromSensorsInNetwork(networkCode))
        .rejects.toThrow("Failed to get outliers");
    });

    it("should handle optional parameters", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getOutliersFromSensorsInNetwork: jest.fn().mockResolvedValue([mockMeasurements])
      }));

      const result = await measurementsController.getOutliersFromSensorsInNetwork(networkCode);
      expect(result).toHaveLength(1);
    });
  });

  describe("storeMeasurementForSensor", () => {
    const createdAt = "2024-01-15T12:00:00Z";
    const value = 25.5;

    it("should store measurement for sensor", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        storeMeasurementForSensor: jest.fn().mockResolvedValue(undefined)
      }));

      await expect(measurementsController.storeMeasurementForSensor(
        networkCode,
        gatewayMac,
        sensorMac,
        createdAt,
        value
      )).resolves.not.toThrow();
    });

    it("should pass through AppError", async () => {
      const error = new AppError("Custom error", 400);
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        storeMeasurementForSensor: jest.fn().mockRejectedValue(error)
      }));

      await expect(measurementsController.storeMeasurementForSensor(
        networkCode,
        gatewayMac,
        sensorMac,
        createdAt,
        value
      )).rejects.toThrow(error);
    });

    it("should throw 500 on other errors", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        storeMeasurementForSensor: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(measurementsController.storeMeasurementForSensor(
        networkCode,
        gatewayMac,
        sensorMac,
        createdAt,
        value
      )).rejects.toThrow("Failed to store measurement");
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        storeMeasurementForSensor: jest.fn().mockRejectedValue(validationError)
      }));

      await expect(measurementsController.storeMeasurementForSensor(
        networkCode,
        gatewayMac,
        sensorMac,
        createdAt,
        value
      )).rejects.toThrow("Failed to store measurement");
    });
  });

  describe("getMeasurementsFromSensor", () => {
    it("should return measurements for specific sensor", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensor: jest.fn().mockResolvedValue(mockMeasurements)
      }));

      const result = await measurementsController.getMeasurementsFromSensor(
        networkCode,
        gatewayMac,
        sensorMac,
        startDate,
        endDate
      );

      expect(result).toEqual(mockMeasurements);
    });

    it("should pass through AppError", async () => {
      const error = new AppError("Custom error", 400);
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensor: jest.fn().mockRejectedValue(error)
      }));

      await expect(measurementsController.getMeasurementsFromSensor(
        networkCode,
        gatewayMac,
        sensorMac
      )).rejects.toThrow(error);
    });

    it("should throw 500 on other errors", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensor: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(measurementsController.getMeasurementsFromSensor(
        networkCode,
        gatewayMac,
        sensorMac
      )).rejects.toThrow("Failed to get measurements");
    });

    it("should handle optional date parameters", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsFromSensor: jest.fn().mockResolvedValue(mockMeasurements)
      }));

      const result = await measurementsController.getMeasurementsFromSensor(
        networkCode,
        gatewayMac,
        sensorMac
      );

      expect(result).toEqual(mockMeasurements);
    });
  });

  describe("getStatsFromSensor", () => {
    it("should return stats for specific sensor", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getStatsFromSensor: jest.fn().mockResolvedValue(mockStats)
      }));

      const result = await measurementsController.getStatsFromSensor(
        networkCode,
        gatewayMac,
        sensorMac,
        startDate,
        endDate
      );

      expect(result).toEqual(mockStats);
    });

    it("should pass through AppError", async () => {
      const error = new AppError("Custom error", 400);
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getStatsFromSensor: jest.fn().mockRejectedValue(error)
      }));

      await expect(measurementsController.getStatsFromSensor(
        networkCode,
        gatewayMac,
        sensorMac
      )).rejects.toThrow(error);
    });

    it("should throw 500 on other errors", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getStatsFromSensor: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(measurementsController.getStatsFromSensor(
        networkCode,
        gatewayMac,
        sensorMac
      )).rejects.toThrow("Failed to get statistics");
    });

    it("should handle optional date parameters", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getStatsFromSensor: jest.fn().mockResolvedValue(mockStats)
      }));

      const result = await measurementsController.getStatsFromSensor(
        networkCode,
        gatewayMac,
        sensorMac
      );

      expect(result).toEqual(mockStats);
    });
  });

  describe("getOutliersFromSensor", () => {
    it("should return outliers for specific sensor", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getOutliersFromSensor: jest.fn().mockResolvedValue(mockMeasurements)
      }));

      const result = await measurementsController.getOutliersFromSensor(
        networkCode,
        gatewayMac,
        sensorMac,
        startDate,
        endDate
      );

      expect(result).toEqual(mockMeasurements);
    });

    it("should pass through AppError", async () => {
      const error = new AppError("Custom error", 400);
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getOutliersFromSensor: jest.fn().mockRejectedValue(error)
      }));

      await expect(measurementsController.getOutliersFromSensor(
        networkCode,
        gatewayMac,
        sensorMac
      )).rejects.toThrow(error);
    });

    it("should throw 500 on other errors", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getOutliersFromSensor: jest.fn().mockRejectedValue(new Error())
      }));

      await expect(measurementsController.getOutliersFromSensor(
        networkCode,
        gatewayMac,
        sensorMac
      )).rejects.toThrow("Failed to get outliers");
    });

    it("should handle optional date parameters", async () => {
      (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
        getOutliersFromSensor: jest.fn().mockResolvedValue(mockMeasurements)
      }));

      const result = await measurementsController.getOutliersFromSensor(
        networkCode,
        gatewayMac,
        sensorMac
      );

      expect(result).toEqual(mockMeasurements);
    });
  });
}); 