import { useState, useEffect } from "react";
import API from "../lib/api";

export function useTreeName(treeId) {
  const [treeName, setTreeName] = useState("");
  useEffect(() => {
    const fetchTree = async () => {
      try {
        const { data } = await API.get(`/trees/${treeId}`);
        setTreeName(data.name);
      } catch (err) {
        setTreeName("");
      }
    };
    if (treeId) fetchTree();
  }, [treeId]);
  return treeName;
}
