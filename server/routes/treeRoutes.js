import express from "express";
import { createTree, getUserTrees } from "../controllers/treeController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const router = express.Router();

// Create a new tree
router.post("/", verifyToken, createTree);

// Get all trees for a logged-in user
router.get("/", verifyToken, getUserTrees);

export default router;
