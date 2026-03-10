import React from "react";

export const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div style={{
      background: "#fef2f2", border: "1px solid #fecaca",
      borderRadius: "8px", padding: "0.75rem 1rem",
      color: "#dc2626", fontSize: "0.85rem",
      display: "flex", alignItems: "center", gap: "0.5rem",
      marginBottom: "1rem"
    }}>
      <span style={{ fontSize: "1rem" }}>⚠</span>
      <span>{message}</span>
    </div>
  );
};
