import AppError from "@models/errors/AppError";
import { Router } from "express";
import { UserType } from "@models/UserType";
import {
  getAllGateways, 
  getGateway, 
  createGateway,
  updateGateway, 
  deleteGateway,
} from "@controllers/gatewayController";
import { authenticateUser } from "@middlewares/authMiddleware";
import { GatewayFromJSON } from "@models/dto/Gateway";

const router = Router({ mergeParams: true });

// Get all gateways (Any authenticated user)
router.get("/", 
           authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), 
           async (req, res, next) => {
  try {
    const gateways = await getAllGateways(req.params.networkCode);
    res.status(200).json(gateways);
  } catch (error) {
    next(error);
  }
});

// Create a new gateway (Admin & Operator)
router.post("/",
            authenticateUser([UserType.Admin, UserType.Operator]), 
            async (req, res, next) => {
  try {
    await createGateway(GatewayFromJSON(req.body), req.params.networkCode);
    res.status(201).send();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({ message: error.message });
    } else {
      next(error);
    }
  }
});

// Get a specific gateway (Any authenticated user)
router.get("/:macAddress",
          authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
          async (req, res, next) => {
    try {
      const { networkCode, macAddress } = req.params;
      const gateway = await getGateway(macAddress, networkCode);
      res.status(200).json(gateway);
    } catch (error) {
      next(error);
    }
  }
);

// Update a gateway (Admin & Operator)
router.patch(
  "/:macAddress",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await updateGateway(req.params.macAddress, req.params.networkCode, req.body);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// Delete a gateway (Admin & Operator)
router.delete(
  "/:macAddress",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await deleteGateway(req.params.macAddress, req.params.networkCode);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
