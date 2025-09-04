import Modal from "react-modal";

export default function EditMemberModal({
  isOpen,
  onRequestClose,
  editFormData,
  setEditFormData,
  handleEditSave,
  handleDeleteMember,
  selectedNode,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Edit Member"
      className="w-[400px] px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
    >
      <h2 style={{ marginBottom: "15px", textAlign: "center" }}>Edit Member</h2>
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
          className="w-full p-2 bg-yellow-500 text-white rounded cursor-pointer font-bold mb-2"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={() => handleDeleteMember(selectedNode.id)}
          className="w-full p-2 bg-red-500 text-white rounded cursor-pointer font-bold"
        >
          Delete Member
        </button>
      </form>
    </Modal>
  );
}
