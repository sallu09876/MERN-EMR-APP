import React from "react";

export const Loader = ({ text = "Loading…" }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem", gap: "1rem" }}>
    <div style={{
      width: "36px", height: "36px",
      border: "3px solid var(--border)",
      borderTop: "3px solid var(--teal)",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }} />
    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{text}</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);
