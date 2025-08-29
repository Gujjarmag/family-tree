import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Add a new member to a tree
export const addMember = async (req, res) => {
  try {
    const { treeId, name, dob, gender, parentId, spouseId } = req.body;

    if (!treeId || !name) {
      return res.status(400).json({ message: "Tree ID and name are required" });
    }

    const member = await prisma.member.create({
      data: {
        name,
        dob: dob ? new Date(dob) : null,
        gender,
        treeId,
        parentId: parentId || null,
        spouseId: spouseId || null,
      },
    });

    res.status(201).json(member);
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all members of a tree
export const getTreeMembers = async (req, res) => {
  try {
    const { treeId } = req.params;

    const members = await prisma.member.findMany({
      where: { treeId: parseInt(treeId) },
      include: { children: true, spouse: true }, // fetch relationships
    });

    res.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ message: "Server error" });
  }
};
