import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../lib/api";

export default function Dashboard() {
  const [trees, setTrees] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const fetchTrees = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/trees");
      setTrees(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load trees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrees();
  }, []);

  const handleCreateTree = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return;

    try {
      const { data } = await API.post("/trees", { name: name.trim() });
      setTrees((prev) => [data, ...prev]);
      setName("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create tree");
    }
  };

  return (
    <div className="min-h-screen bg-green-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            Welcome to the Family Tree Dashboard 🎉
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        <form
          onSubmit={handleCreateTree}
          className="bg-white rounded-lg shadow p-4 mb-6"
        >
          <h2 className="text-xl font-semibold mb-3">Create a new tree</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., Gujjar Family Tree"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Create
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-3">Your Family Trees</h2>
          {loading ? (
            <p>Loading...</p>
          ) : trees.length === 0 ? (
            <p className="text-gray-600">
              No trees yet. Create your first one!
            </p>
          ) : (
            <ul className="space-y-2">
              {trees.map((tree) => (
                <li
                  key={tree.id}
                  className="flex items-center justify-between border rounded-lg px-3 py-2"
                >
                  <span>{tree.name}</span>
                  <button
                    onClick={() => navigate(`/family-tree/${tree.id}`)}
                    className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-black transition"
                  >
                    Open
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
