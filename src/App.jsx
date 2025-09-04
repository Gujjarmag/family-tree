import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import FamilyTree from "./pages/FamilyTree.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Signup from "./pages/Signup.jsx";
import { TreeProvider } from "./context/TreeContext.jsx";

function App() {
  return (
    <TreeProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family-tree/:treeId"
          element={
            <ProtectedRoute>
              <FamilyTree />
            </ProtectedRoute>
          }
        />
      </Routes>
    </TreeProvider>
  );
}

export default App;
