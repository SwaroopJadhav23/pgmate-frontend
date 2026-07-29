// ErrorBoundary.jsx
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log to console for developers — never expose raw errors to users
    console.error("App crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          padding: "40px 20px",
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a2e", marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 24, maxWidth: 360 }}>
            An unexpected error occurred. Please refresh the page to continue.
            If this keeps happening, please contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#5B5BD6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
