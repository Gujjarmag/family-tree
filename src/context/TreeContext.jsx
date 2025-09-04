import { createContext, useContext, useState } from "react";

const TreeContext = createContext();

export function TreeProvider({ children }) {
  const [members, setMembers] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  return (
    <TreeContext.Provider
      value={{
        members,
        setMembers,
        treeData,
        setTreeData,
        isEditingMode,
        setIsEditingMode,
      }}
    >
      {children}
    </TreeContext.Provider>
  );
}

export function useTree() {
  return useContext(TreeContext);
}
