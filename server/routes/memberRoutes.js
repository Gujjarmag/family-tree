import express from "express";
import { addMember, getTreeMembers } from "../controllers/memberController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const router = express.Router();

// Add a member to a tree
router.post("/", verifyToken, addMember);

// Get all members for a tree
router.get("/:treeId", verifyToken, getTreeMembers);

export default router;
