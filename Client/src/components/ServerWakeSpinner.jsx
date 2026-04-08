// Animated spinner shown during cold start wait
export const ServerWakeSpinner = ({ message = "Connecting..." }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem",
    }}
  >
    <div
      style={{
        width: "20px",
        height: "20px",
        border: "2px solid var(--border)",
        borderTop: "2px solid var(--teal)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
      {message}
    </span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);
