import AppError from "@models/errors/AppError";
import { Router, Request } from "express";
import { Sensor } from "@dto/Sensor";
import {
  getAllSensors,
  getSensor,
  createSensor,
  updateSensor,
  deleteSensor
} from "@controllers/SensorController";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";

const router = Router({ mergeParams: true });

interface AuthenticatedRequest extends Request {
  user?: {
    type: UserType;
  };
}

// GET all sensors in a gateway (any authenticated user)
router.get(
  "/",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac } = req.params;
      const sensors = await getAllSensors(networkCode, gatewayMac);
      res.status(200).json(sensors);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("Internal server error", 500));
    }
  }
);

// GET specific sensor (any authenticated user)
router.get(
  "/:sensorMac",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      const sensor = await getSensor(sensorMac, gatewayMac, networkCode);
      res.status(200).json(sensor);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("Internal server error", 500));
    }
  }
);

// POST new sensor (Admin & Operator)
router.post(
  "/",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const sensorDto = req.body as Sensor;
      const { networkCode, gatewayMac } = req.params;
      await createSensor(sensorDto, gatewayMac, networkCode);
      res.status(201).send();
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("Internal server error", 500));
    }
  }
);

// PATCH existing sensor (Admin & Operator)
router.patch(
  "/:sensorMac",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      await updateSensor(sensorMac, gatewayMac, networkCode, req.body);
      res.status(204).send();
    } catch (error) {
      console.error("UPDATE SENSOR ROUTE ERROR:", error);
      next(error instanceof AppError ? error : new AppError("Internal server error", 500));
    }
  }
);

// DELETE sensor (Admin & Operator)
router.delete(
  "/:sensorMac",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      await deleteSensor(sensorMac, gatewayMac, networkCode);
      res.status(204).send();
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("Internal server error", 500));
    }
  }
);

router.all("/", (req, res, next) => {
  if (["GET", "POST"].includes(req.method)) {
    return next(); // allow valid methods through
  }
  res.status(405).json({ error: "Method Not Allowed" });
});


export default router;
