import { useEffect, useCallback } from "react";

export function useTreeData(members, setTreeData) {
  const buildTree = useCallback(() => {
    if (!members || members.length === 0) {
      setTreeData(null);
      return;
    }
    const map = {};
    members.forEach((m) => {
      map[m.id] = { ...m, children: [] };
    });
    members.forEach((m) => {
      if (m.parentId && map[m.parentId]) {
        map[m.parentId].children.push(map[m.id]);
      }
    });
    const roots = members.filter((m) => !m.parentId).map((m) => map[m.id]);
    if (roots.length === 0) {
      setTreeData(null);
      return;
    }
    roots.sort((a, b) => a.id - b.id);
    setTreeData(roots[0]);
  }, [members, setTreeData]);

  useEffect(() => {
    buildTree();
  }, [members, buildTree]);
}
