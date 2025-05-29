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
import { Gateway, GatewayFromJSON } from "@models/dto/Gateway";

const router = Router({ mergeParams: true });

// Get all gateways (Any authenticated user)
router.get("/", 
           authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), 
           async (req, res, next) => {
  try {
    const gateways = await getAllGateways(req.params.networkCode);
    res.status(200).json(gateways);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
    next(new AppError("Internal server error", 500));    //da coprire
    }
  }
});

// Create a new gateway (Admin & Operator)
router.post("/",
            authenticateUser([UserType.Admin, UserType.Operator]), 
  async (req, res, next) => {
  try {
    const gatewayDto = req.body as Gateway;
    if (!gatewayDto.macAddress) {
      throw new AppError("MacAddress is required", 400);
    }
    else if (!req.params.networkCode) {
      throw new AppError("NetworkCode is required", 400);    //da coprire
    }
    await createGateway(gatewayDto, req.params.networkCode);
    res.status(201).send();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Internal server error", 500));   //da coprire
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
      const newValues = {
        newMacAddress: req.body.macAddress,
        newName: req.body.name,
        newDescription: req.body.description
      };
      await updateGateway(req.params.macAddress, req.params.networkCode, newValues);
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
