import AppError from "@models/errors/AppError";
import { Router, Request } from "express";
import { Network } from "@dto/Network";
import {
  getAllNetworks,
  getNetwork,
  createNetwork,
  updateNetwork,
  deleteNetwork
} from "@controllers/networkController";
import { UserType } from "@models/UserType";
import { authenticateUser } from "@middlewares/authMiddleware";

// Extend Request type to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    type: UserType;
  };
}

const router = Router();

// Get all networks (Any authenticated user)
router.get("", authenticateUser(), async (req, res, next) => {
  try {
    const networks = await getAllNetworks();
    res.status(200).json(networks);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Internal server error", 500));
    }
  }
});

// Create a new network (Admin & Operator)
router.post("", authenticateUser([UserType.Admin, UserType.Operator]), async (req: AuthenticatedRequest, res, next) => {
  try {
    // Validate required fields
    const networkDto = req.body as Network;
    if (!networkDto.code) {
      throw new AppError("Network code is required", 400);
    }

    await createNetwork(networkDto);
    res.status(201).send();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Internal server error", 500));
    }
  }
});

// Get a specific network (Any authenticated user)
router.get("/:networkCode", authenticateUser(), async (req, res, next) => {
  try {
    const network = await getNetwork(req.params.networkCode);
    res.status(200).json(network);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Internal server error", 500));
    }
  }
});

// Update a network (Admin & Operator)
router.patch("/:networkCode", authenticateUser([UserType.Admin, UserType.Operator]), async (req: AuthenticatedRequest, res, next) => {
  try {
    const networkDto = req.body as Network;
    await updateNetwork(req.params.networkCode, networkDto);
    res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Internal server error", 500));
    }
  }
});

// Delete a network (Admin & Operator)
router.delete("/:networkCode", authenticateUser([UserType.Admin, UserType.Operator]), async (req: AuthenticatedRequest, res, next) => {
  try {
    await deleteNetwork(req.params.networkCode);
    res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Internal server error", 500));
    }
  }
});

export default router;
