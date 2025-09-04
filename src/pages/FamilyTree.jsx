import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, data } from "react-router-dom";
import API from "../lib/api";
import Tree from "react-d3-tree";
import Modal from "react-modal";
import AddMemberModal from "../components/AddMemberModal";
import EditMemberModal from "../components/EditMemberModal";
import { useTree } from "../context/TreeContext";
import { useTreeName } from "../hooks/useTreeName";
import { useMembers } from "../hooks/useMembers";
import { useTreeData } from "../hooks/useTreeData";
// import { useState } from "react";

Modal.setAppElement("#root"); // accessibility

export default function FamilyTree() {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");

  const {
    members,
    setMembers,
    treeData,
    setTreeData,
    isEditingMode,
    setIsEditingMode,
  } = useTree();

  // Use custom hooks
  const { loading, error } = useMembers(treeId, setMembers);
  useTreeData(members, setTreeData);
  const treeName = useTreeName(treeId);

  // data + ui state

  // add-modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [relationType, setRelationType] = useState(""); // "child" | "parent" | "sibling"
  const [selectedNode, setSelectedNode] = useState(null);
  const [formData, setFormData] = useState({ name: "", gender: "", dob: "" });

  // edit-modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    gender: "",
    dob: "",
  });

  // --- Build tree from flat list ---
  const buildTree = useCallback(() => {
    if (!members || members.length === 0) {
      setTreeData(null);
      return;
    }

    // build map
    const map = {};
    members.forEach((m) => {
      map[m.id] = { ...m, children: [] };
    });

    // attach children
    members.forEach((m) => {
      if (m.parentId && map[m.parentId]) {
        map[m.parentId].children.push(map[m.id]);
      }
    });

    // find all roots (members with no parent)
    const roots = members.filter((m) => !m.parentId).map((m) => map[m.id]);

    if (roots.length === 0) {
      setTreeData(null);
      return;
    }

    // deterministic root: pick the smallest id (or change logic to choose whichever root you prefer)
    roots.sort((a, b) => a.id - b.id);
    setTreeData(roots[0]);
  }, [members]);

  useEffect(() => {
    buildTree();
  }, [members, buildTree]);

  // --- Node action buttons ---
  const handleAddClick = (e, nodeDatum, relation) => {
    e.stopPropagation();
    setSelectedNode(nodeDatum);
    setRelationType(relation);
    setIsModalOpen(true);
  };

  const handleDeleteMember = async (e, memberId) => {
    e.stopPropagation();
    const ok = window.confirm("Are you sure you want to delete this member?");
    if (!ok) return;
    try {
      await API.delete(`/members/${memberId}`);
      const response = await API.delete(`/members/${memberId}`);
      setMembers(data); // update state directly
    } catch (error) {
      console.error("Delete failed:", error);
      setFormError("Failed to delete member.");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();

    try {
      let parentIdToSend = null;

      if (relationType === "child") {
        parentIdToSend = selectedNode?.id ?? null;
      } else if (relationType === "sibling") {
        parentIdToSend = selectedNode?.parentId ?? null;
      } else if (relationType === "parent") {
        parentIdToSend = selectedNode?.id ?? null;
      } else if (relationType === "root") {
        parentIdToSend = null;
      }

      // build FormData
      const data = new FormData();
      data.append("treeId", String(treeId));
      data.append("name", formData.name?.trim() || "");
      data.append("dob", formData.dob || "");
      data.append("gender", formData.gender || "");
      data.append(
        "parentId",
        parentIdToSend !== null ? String(parentIdToSend) : ""
      );
      data.append("relationType", relationType || "");
      data.append("id", selectedNode?.id ? String(selectedNode.id) : "");
      if (formData.photo) data.append("photo", formData.photo);

      // send multipart/form-data
      const response = await API.post("/members", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201 || response.status === 200) {
        // Refresh members
        const { data: membersData } = await API.get(`/members/${treeId}`);
        setMembers(membersData);
        setIsModalOpen(false);
        setFormData({ name: "", gender: "", dob: "", photo: null });
        setFormError("");
        return;
      }

      setFormError(response.data?.message || "Failed to add member.");
      console.error("❌ API returned non-201:", response);
    } catch (err) {
      console.error("❌ API call failed:", err);
      setFormError(
        err.response?.data?.message || err.message || "Failed to add member."
      );
    }
  };

  // Call this from the Save Changes button in the Edit modal
  const handleEditSave = async (e) => {
    e.preventDefault();

    if (!selectedNode?.id) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", editFormData.name?.trim() || "");
      formDataToSend.append("gender", editFormData.gender || "");
      formDataToSend.append("dob", editFormData.dob || "");

      if (editFormData.photo instanceof File) {
        formDataToSend.append("photo", editFormData.photo);
      }

      const response = await API.put(
        `/members/${selectedNode.id}`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 200) {
        // Refresh members
        const { data: membersData } = await API.get(`/members/${treeId}`);
        setMembers(membersData);

        setIsEditModalOpen(false);
        setEditFormData({ name: "", gender: "", dob: "", photo: null });
        setFormError("");
        return;
      } else {
        setFormError(response.data?.message || "Failed to update member.");
      }
    } catch (err) {
      console.error("❌ Error updating member:", err);
      setFormError(
        err.response?.data?.message || err.message || "Failed to update member."
      );
    }
  };

  // --- Custom node UI ---
  const renderCustomNode = ({ nodeDatum }) => {
    const prettyDob = nodeDatum.dob ? String(nodeDatum.dob).slice(0, 10) : null;

    return (
      <foreignObject
        width={220}
        height={140}
        x={-110}
        y={-60}
        style={{ overflow: "visible" }}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          // style={{
          //   backgroundColor: "#ffffff",
          //   border: "1px solid #babdc4ff",
          //   borderRadius: "12px",
          //   padding: "10px",
          //   boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          //   textAlign: "center",
          //   position: "relative",
          //   fontFamily: "sans-serif",
          //   fontSize: "14px",
          //   // New styles
          //   alignItems: "center",
          //   display: "flex",
          // }}
          className="bg-white border border-gray-300 rounded-xl p-2 shadow-md text-center relative font-sans text-sm flex items-center"
        >
          {/* === Profile Photo or Placeholder === */}
          <div style={{ marginBottom: "6px" }}>
            {nodeDatum.photoUrl ? (
              <img
                src={nodeDatum.photoUrl}
                alt={nodeDatum.name}
                className="w-12 h-12 rounded-full object-cover shadow mr-2"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-300 shadow mr-2" />
            )}
          </div>

          {/* Name */}
          <div className="text-left">
            <div className="font-semibold text-base text-gray-800">
              {nodeDatum.name}
            </div>
            {/* {nodeDatum.gender && (
              <div style={{ fontSize: "12px", color: "#6B7280" }}>
                Gender: {nodeDatum.gender}
              </div>
            )} */}
            {prettyDob && (
              <div className="text-xs text-gray-500">{prettyDob}</div>
            )}
          </div>

          {/* === EDIT MODE BUTTONS === */}
          {isEditingMode && (
            <>
              {/* Add Child Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddClick(e, nodeDatum, "child");
                }}
                className="absolute bottom-[-12px] left-1/2 -translate-x-1/2 bg-transparent border-none text-black text-xl font-bold cursor-pointer"
                title="Add Child"
              >
                +
              </button>

              {/* Add Sibling Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddClick(e, nodeDatum, "sibling");
                }}
                className="absolute right-0 top-1/2 -translate-x-1/2 bg-transparent border-none text-black text-xl font-bold cursor-pointer"
                title="Add Sibling"
              >
                +
              </button>

              {/* Add Parent Button → Only visible on root node */}
              {!nodeDatum.parentId && (
                <button
                  onClick={(e) => handleAddClick(e, nodeDatum, "parent")}
                  className="absolute top-[-8px] left-1/2 -translate-x-1/2 bg-transparent text-black text-xl font-bold border-none cursor-pointer p-0"
                  title="Add Parent"
                >
                  +
                </button>
              )}

              {/* Edit Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(nodeDatum);
                  setEditFormData({
                    name: nodeDatum.name || "",
                    gender: nodeDatum.gender || "",
                    dob: nodeDatum.dob
                      ? String(nodeDatum.dob).slice(0, 10)
                      : "",
                  });
                  setIsEditModalOpen(true);
                }}
                className="absolute top-1 right-1 bg-yellow-500 text-white rounded px-1 py-0.5 text-xs font-bold cursor-pointer border-none shadow"
                title="Edit Member"
              >
                ✎
              </button>
            </>
          )}
        </div>
      </foreignObject>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{treeName}</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-black transition"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Tree */}
        <div
          id="treeWrapper"
          style={{ width: "100%", height: "600px", border: "1px solid #ccc" }}
        >
          {/* Editing Mode Toggle */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ cursor: "pointer", fontWeight: "bold" }}>
              <input
                type="checkbox"
                checked={isEditingMode}
                onChange={(e) => setIsEditingMode(e.target.checked)}
                // style={{ marginRight: "6px" }}
                className="mr-2 accent-blue-600"
              />
              Editing Mode
            </label>
          </div>
          {loading ? (
            <p className="p-4">Loading tree...</p>
          ) : treeData ? (
            <Tree
              data={treeData}
              orientation="vertical"
              translate={{ x: 600, y: 80 }} // Moves entire tree, giving space on top
              separation={{ siblings: 1, nonSiblings: 2.5 }} // <-- Add spacing
              nodeSize={{ x: 250, y: 150 }}
              renderCustomNodeElement={renderCustomNode}
              collapsible={true}
              zoomable={true}
              centeringTransitionDuration={0}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="p-4 text-gray-600">
                No members yet. Start by adding the first member!
              </p>
              <button
                onClick={() => {
                  setRelationType("root"); // Special case for root member
                  setIsModalOpen(true); // Open your Add Member modal
                }}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
              >
                + Add Root Member
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        relationType={relationType}
        formData={formData}
        setFormData={setFormData}
        handleAddMember={handleAddMember}
      />

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        handleEditSave={handleEditSave}
        handleDeleteMember={(memberId) => {
          // You may want to pass the event as null or refactor handleDeleteMember to not require event
          handleDeleteMember({ stopPropagation: () => {} }, memberId);
          setIsEditModalOpen(false);
        }}
        selectedNode={selectedNode}
      />
    </div>
  );
}
