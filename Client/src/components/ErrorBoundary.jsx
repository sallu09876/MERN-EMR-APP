import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.error("UI crashed:", error, info);
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{ padding: "1.25rem", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #fecaca", padding: "1rem" }}>
          <div style={{ fontWeight: 800, color: "#b91c1c", marginBottom: "0.5rem" }}>
            Something crashed on this page
          </div>
          <div style={{ color: "#111827", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", whiteSpace: "pre-wrap" }}>
            {String(error?.message || error)}
          </div>
          {import.meta?.env?.DEV && error?.stack && (
            <div style={{ marginTop: "0.75rem", color: "#374151", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", whiteSpace: "pre-wrap", fontSize: 12 }}>
              {error.stack}
            </div>
          )}
        </div>
      </div>
    );
  }
}

