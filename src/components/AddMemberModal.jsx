import Modal from "react-modal";

export default function AddMemberModal({
  isOpen,
  onRequestClose,
  relationType,
  formData,
  setFormData,
  handleAddMember,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Add Member"
      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
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
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
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
          className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition"
        >
          Add Member
        </button>
      </form>
    </Modal>
  );
}
