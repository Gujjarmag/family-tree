import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../lib/api";
import Tree from "react-d3-tree";
import Modal from "react-modal";

Modal.setAppElement("#root"); // accessibility

export default function FamilyTree() {
  const { treeId } = useParams();
  const navigate = useNavigate();

  const [isEditingMode, setIsEditingMode] = useState(false);

  // data + ui state
  const [members, setMembers] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const [treeName, setTreeName] = useState("");
  useEffect(() => {
    const fetchTree = async () => {
      try {
        const { data } = await API.get(`/trees/${treeId}`);
        setTreeName(data.name);
      } catch (err) {
        console.error("Failed to fetch tree name:", err);
      }
    };
    fetchTree();
  }, [treeId]);

  // --- API: fetch members for this tree ---
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/members/${treeId}`);
      setMembers(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeId]);

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
      await fetchMembers(); // refresh tree
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete member.");
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
      data.append("id", selectedNode?.id ? String(selectedNode.id) : ""); // used by backend for sibling/root logic
      if (formData.photo) data.append("photo", formData.photo);

      // debug: inspect what will be sent
      console.log("📤 Sending FormData:", [...data.entries()]);

      // send multipart/form-data
      const response = await API.post("/members", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ add-member response:", response.status, response.data);

      if (response.status === 201 || response.status === 200) {
        await fetchMembers();
        setIsModalOpen(false);
        setFormData({ name: "", gender: "", dob: "", photo: null });
        setError("");
        return;
      }

      setError(response.data?.message || "Failed to add member.");
      console.error("❌ API returned non-201:", response);
    } catch (err) {
      console.error("❌ API call failed:", err);
      setError(
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

      // ✅ Always append the photo, even if unchanged
      if (editFormData.photo instanceof File) {
        console.log("📸 Adding new photo:", editFormData.photo);
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
        // ✅ Update UI immediately
        setMembers((prevMembers) =>
          prevMembers.map((m) =>
            m.id === response.data.member.id ? response.data.member : m
          )
        );

        setIsEditModalOpen(false);
        setEditFormData({ name: "", gender: "", dob: "", photo: null });

        console.log("✅ Member updated successfully");

        // ✅ Refetch all members to get the latest photo URL
        await fetchMembers();
      } else {
        setError(response.data?.message || "Failed to update member.");
      }
    } catch (err) {
      console.error("❌ Error updating member:", err);
      setError(
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
          style={{
            backgroundColor: "#ffffff",
            border: "2px solid #3B82F6",
            borderRadius: "12px",
            padding: "10px",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
            textAlign: "center",
            position: "relative",
            fontFamily: "sans-serif",
            fontSize: "14px",
            // New styles
            alignItems: "center",
            display: "flex",
          }}
        >
          {/* === Profile Photo or Placeholder === */}
          <div style={{ marginBottom: "6px" }}>
            {nodeDatum.photoUrl ? (
              <img
                src={nodeDatum.photoUrl}
                alt={nodeDatum.name}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  boxShadow: "0px 2px 6px rgba(0,0,0,0.2)",
                  marginRight: "10px",
                }}
              />
            ) : (
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "#D1D5DB",
                  // display: "inline-block",
                  boxShadow: "0px 2px 6px rgba(0,0,0,0.2)",
                  //
                  marginRight: "10px",
                }}
              />
            )}
          </div>

          {/* Name */}
          <div style={{ textAlign: "left" }}>
            <div
              style={{ fontWeight: "600", fontSize: "16px", color: "#1F2937" }}
            >
              {nodeDatum.name}
            </div>
            {/* {nodeDatum.gender && (
              <div style={{ fontSize: "12px", color: "#6B7280" }}>
                Gender: {nodeDatum.gender}
              </div>
            )} */}
            {prettyDob && (
              <div style={{ fontSize: "12px", color: "#6B7280" }}>
                DOB: {prettyDob}
              </div>
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
                style={{
                  position: "absolute",
                  bottom: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "black",
                  fontSize: "20px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
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
                style={{
                  position: "absolute",
                  right: "-0.5px",
                  top: "50%",
                  transform: "translateX(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "black",
                  fontSize: "20px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                title="Add Sibling"
              >
                +
              </button>

              {/* Add Parent Button → Only visible on root node */}
              {!nodeDatum.parentId && (
                <button
                  onClick={(e) => handleAddClick(e, nodeDatum, "parent")}
                  style={{
                    position: "absolute",
                    top: "-8px", // Push above the node
                    left: "50%", // Center horizontally
                    transform: "translateX(-50%)",
                    backgroundColor: "transparent",
                    color: "black",
                    fontSize: "20px",
                    fontWeight: "bold",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
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
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  backgroundColor: "#F59E0B",
                  color: "white",
                  borderRadius: "6px",
                  padding: "2px 6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  border: "none",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}
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
                style={{ marginRight: "6px" }}
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
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Add Member"
        style={{
          content: {
            width: "400px",
            margin: "auto",
            borderRadius: "10px",
            padding: "20px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
          },
        }}
      >
        <h2 style={{ marginBottom: "15px", textAlign: "center" }}>
          Add {relationType.charAt(0).toUpperCase() + relationType.slice(1)}
        </h2>

        <form onSubmit={handleAddMember}>
          <div style={{ marginBottom: "10px" }}>
            <label>Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Gender</label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Date of Birth</label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) =>
                setFormData({ ...formData, dob: e.target.value })
              }
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            {/* New: Upload photo */}
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={(e) =>
                setFormData({ ...formData, photo: e.target.files[0] })
              }
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#3B82F6",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Add Member
          </button>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        contentLabel="Edit Member"
        style={{
          content: {
            width: "400px",
            margin: "auto",
            borderRadius: "10px",
            padding: "20px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
          },
        }}
      >
        <h2 style={{ marginBottom: "15px", textAlign: "center" }}>
          Edit Member
        </h2>

        <form onSubmit={handleEditSave}>
          <div style={{ marginBottom: "10px" }}>
            <label>Name *</label>
            <input
              type="text"
              required
              value={editFormData.name}
              onChange={(e) =>
                setEditFormData({ ...editFormData, name: e.target.value })
              }
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Gender</label>
            <select
              value={editFormData.gender}
              onChange={(e) =>
                setEditFormData({ ...editFormData, gender: e.target.value })
              }
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Date of Birth</label>
            <input
              type="date"
              value={editFormData.dob}
              onChange={(e) =>
                setEditFormData({ ...editFormData, dob: e.target.value })
              }
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={(e) =>
                setEditFormData({ ...editFormData, photo: e.target.files[0] })
              }
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#F59E0B",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            Save Changes
          </button>

          {/* Delete Button inside Edit Modal */}
          <button
            type="button"
            onClick={async () => {
              const ok = window.confirm(
                "Are you sure you want to delete this member and all its children?"
              );
              if (!ok) return;

              try {
                await API.delete(`/members/${selectedNode.id}`);
                setIsEditModalOpen(false);
                await fetchMembers();
              } catch (error) {
                console.error("Failed to delete member:", error);
                alert("Failed to delete member.");
              }
            }}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#EF4444",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Delete Member
          </button>
        </form>
      </Modal>
    </div>
  );
}
