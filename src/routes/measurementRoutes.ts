import AppError from "@models/errors/AppError";
import { Router, Request } from "express";
import { UserType } from "@models/UserType";
import { authenticateUser } from "@middlewares/authMiddleware";
import {
  getMeasurementsFromSensor,
  getStatsFromSensor,
  getOutliersFromSensor,
  storeMeasurementForSensor,
  storeMeasurementsForSensorBulk,
  getMeasurementsFromSensorsInNetwork,
  getStatsFromSensorsInNetwork,
  getOutliersFromSensorsInNetwork
} from "@controllers/measurementsController";

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: {
    type: UserType;
  };
}

// (4) Store a measurement for a sensor (Admin & Operator)
router.post(
  "/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      const measurements = req.body;
      
      if (!Array.isArray(measurements)) {
        throw new AppError("Request body must be an array of measurements", 400);
      }

      // Validate each measurement
      for (const measurement of measurements) {
        if (!measurement.createdAt || typeof measurement.value !== 'number') {
          throw new AppError("Each measurement must have createdAt and value fields", 400);
        }
      }

      // Store each measurement
      for (const measurement of measurements) {
        await storeMeasurementForSensor(
          networkCode,
          gatewayMac,
          sensorMac,
          measurement.createdAt,
          measurement.value
        );
      }

      res.status(201).send();
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("Internal server error", 500));
    }
  }
);

// (5) GET measurements for a specific sensor (any authenticated user)
router.get(
  "/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      const { startDate, endDate } = req.query;
      
      const measurements = await getMeasurementsFromSensor(
        networkCode, 
        gatewayMac, 
        sensorMac, 
        startDate as string, 
        endDate as string
      );
      res.status(200).json(measurements);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("Internal server error", 500));
    }
  }
);

// (6) GET statistics for a specific sensor (any authenticated user)
router.get(
  "/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/stats",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      const { startDate, endDate } = req.query;
      
      const stats = await getStatsFromSensor(
        networkCode, 
        gatewayMac, 
        sensorMac, 
        startDate as string, 
        endDate as string
      );
      res.status(200).json(stats);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("Internal server error", 500));
    }
  }
);

// (7) GET outliers for a specific sensor (any authenticated user)
router.get(
  "/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/outliers",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      const { startDate, endDate } = req.query;
      
      const outliers = await getOutliersFromSensor(
        networkCode, 
        gatewayMac, 
        sensorMac, 
        startDate as string, 
        endDate as string
      );
      res.status(200).json(outliers);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("Internal server error", 500));
    }
  }
);

// (1) GET measurements for sensors in a network (any authenticated user)
router.get(
  "/networks/:networkCode/measurements",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode } = req.params;
      const { sensorMacs, startDate, endDate } = req.query;
      
      const measurements = await getMeasurementsFromSensorsInNetwork(
        networkCode,
        sensorMacs as string[],
        startDate as string,
        endDate as string
      );
      res.status(200).json(measurements);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("Internal server error", 500));
    }
  }
);

// (2) GET statistics for sensors in a network (any authenticated user)
router.get(
  "/networks/:networkCode/stats",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode } = req.params;
      const { sensorMacs, startDate, endDate } = req.query;
      
      const stats = await getStatsFromSensorsInNetwork(
        networkCode,
        sensorMacs as string[],
        startDate as string,
        endDate as string
      );
      res.status(200).json(stats);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("Internal server error", 500));
    }
  }
);

// (3) GET outliers for sensors in a network (any authenticated user)
router.get(
  "/networks/:networkCode/outliers",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode } = req.params;
      const { sensorMacs, startDate, endDate } = req.query;
      
      const outliers = await getOutliersFromSensorsInNetwork(
        networkCode,
        sensorMacs as string[],
        startDate as string,
        endDate as string
      );
      res.status(200).json(outliers);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("Internal server error", 500));
    }
  }
);

// (4) Store measurements for a sensor in bulk (Admin & Operator)
router.post(
  "/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements/bulk",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      const { measurements } = req.body;
      
      if (!Array.isArray(measurements) || measurements.length === 0) {
        throw new AppError("Measurements must be a non-empty array", 400);
      }

      // Validate each measurement
      for (const measurement of measurements) {
        if (!measurement.createdAt || typeof measurement.value !== 'number') {
          throw new AppError("Each measurement must have createdAt and value fields", 400);
        }
      }

      await storeMeasurementsForSensorBulk(networkCode, gatewayMac, sensorMac, measurements);
      res.status(201).send();
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("Internal server error", 500));
    }
  }
);

export default router;
