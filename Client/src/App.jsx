import React from "react";
import { AppRoutes } from "./routes/AppRoutes.jsx";
import { Navbar } from "./components/Navbar.jsx";
import { useAuth } from "./context/AuthContext.jsx";

const App = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: isAuthenticated ? "1200px" : "100%", width: "100%", margin: "0 auto", padding: isAuthenticated ? "2rem 1.5rem" : "0" }}>
        <AppRoutes />
      </main>
    </div>
  );
};

export default App;
