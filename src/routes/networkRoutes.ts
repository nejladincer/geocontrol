import e, { Router } from "express";
import AppError from "@models/errors/AppError";
import { UserType } from "@models/UserType";
import { NetworkType } from "@models/NetworkType";
import {
  getAllNetworks, 
  getNetworkByCode, 
  createNetwork,
  updateNetwork, 
  deleteNetwork,
} from "@controllers/networkController";
import { authenticateUser } from "@middlewares/authMiddleware";
import { NetworkFromJSON } from "@models/dto/Network";

const router = Router(); 

// Get all networks (Any authenticated user)
router.get("", 
           authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), 
           async (req, res, next) => {
  try {
    const networks = await getAllNetworks();
    res.status(200).json(networks);
  } catch (error) {
    next(error);
  }
});

// Create a new network (Admin & Operator)
router.post("", // TODO: "/:networkCode" ?
            authenticateUser([UserType.Admin, UserType.Operator]), 
            async (req, res, next) => {
    try {
      await createNetwork(NetworkFromJSON(req.body));
      res.status(201).send();
    } catch (error) {
      next(error);
    }
});

// Get a specific network (Any authenticated user)
router.get("/:networkCode", 
           authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
           async (req, res, next) => {
  try {
    const network = await getNetworkByCode(req.params.networkCode);
    res.status(200).json(network);
  } catch (error) {
    next(error);
  }
});

// Update a network (Admin & Operator)
router.patch("/:networkCode", 
            authenticateUser([UserType.Admin, UserType.Operator]), 
            async (req, res, next) => {
  try {
    const network = await updateNetwork(req.params.networkCode, req.body);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Delete a network (Admin & Operator)
router.delete("/:networkCode", 
              authenticateUser([UserType.Admin, UserType.Operator]), 
              async (req, res, next) => {
  try {
    await deleteNetwork(req.params.networkCode);
    res.status(204).send()
  } catch (error) {
    next(error);
  }
});

export default router;
