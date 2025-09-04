import { useState, useEffect } from "react";
import API from "../lib/api";

export function useMembers(treeId, setMembers) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/members/${treeId}`);
        setMembers(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load members");
      } finally {
        setLoading(false);
      }
    };
    if (treeId) fetchMembers();
  }, [treeId, setMembers]);

  return { loading, error };
}
