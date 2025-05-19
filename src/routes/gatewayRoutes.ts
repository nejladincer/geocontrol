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
router.get("/:networkCode/gateways", 
           authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), 
           async (req, res, next) => {
  try {
    const gateways = await getAllGateways(req.params.networkCode);
    res.status(200).json(gateways);
  } catch (error) {
    next(error);

});

// Create a new gateway (Admin & Operator)
router.post("/:networkCode/gateways", // TODO: "/:networkCode" ?
            authenticateUser([UserType.Admin, UserType.Operator]), 
            async (req, res, next) => {
try {
  await createGateway(GatewayFromJSON(req.body));
  res.status(201).send();
} catch (error) {
  next(error);
}
});

// Get a specific gateway (Any authenticated user)
router.get("/:networkCode/gateways/:macAddress",
          authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
          async (req, res, next) => {
    try {
      const { networkCode, macAddress } = req.params;

      // Get the gateway with the given macAddress in the specified network 
      const gateway = await getGateway(networkCode, macAddress);


      res.status(200).json(gateway);
    } catch (error) {
      next(error);
    }
  }
);


// Update a gateway (Admin & Operator)
router.patch(
  "/:networkCode/gateways/:macAddress",
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
  "/:networkCode/gateways/:macAddress",
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
