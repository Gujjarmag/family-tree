import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../lib/api";

export default function FamilyTree() {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // form state
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [parentId, setParentId] = useState("");
  const [spouseId, setSpouseId] = useState("");

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
  }, [treeId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        treeId: Number(treeId),
        name: name.trim(),
        gender: gender || null,
        dob: dob || null,
        parentId: parentId ? Number(parentId) : null,
        spouseId: spouseId ? Number(spouseId) : null,
      };

      const { data } = await API.post("/members", payload);
      setMembers((prev) => [...prev, data]);

      // reset form
      setName("");
      setDob("");
      setGender("");
      setParentId("");
      setSpouseId("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to add member");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Family Tree #{treeId}</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-black transition"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Add Member */}
        <form
          onSubmit={handleAddMember}
          className="bg-white rounded-lg shadow p-4 mb-6"
        >
          <h2 className="text-lg font-semibold mb-3">Add Member</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              className="border rounded px-3 py-2"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />

            <select
              className="border rounded px-3 py-2"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Gender (optional)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <select
              className="border rounded px-3 py-2"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">Parent (optional)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (#{m.id})
                </option>
              ))}
            </select>

            <select
              className="border rounded px-3 py-2 md:col-span-2"
              value={spouseId}
              onChange={(e) => setSpouseId(e.target.value)}
            >
              <option value="">Spouse (optional)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (#{m.id})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Add Member
          </button>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>

        {/* Members list (for now) */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Members</h2>
          {loading ? (
            <p>Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-gray-600">No members yet.</p>
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li key={m.id} className="border rounded px-3 py-2">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-sm text-gray-600">
                    id: {m.id}
                    {m.gender ? ` • ${m.gender}` : ""}
                    {m.parentId ? ` • child of #${m.parentId}` : ""}
                    {m.spouseId ? ` • spouse #${m.spouseId}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
