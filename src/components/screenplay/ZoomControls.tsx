import React from "react";

export function ZoomControls({
  pageScale,
  userZoom,
  zoomOut,
  zoomIn,
  zoomReset,
  ZOOM_MIN,
  ZOOM_MAX,
}: {
  pageScale: number;
  userZoom: number;
  zoomOut: () => void;
  zoomIn: () => void;
  zoomReset: () => void;
  ZOOM_MIN: number;
  ZOOM_MAX: number;
}) {
  return (
    <div
      className="sp-no-print"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "var(--sp-toolbar)",
        border: "1px solid var(--sp-border)",
        borderRadius: 999,
        padding: "6px 10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        zIndex: 45,
        backdropFilter: "blur(10px)",
        userSelect: "none",
      }}
    >
      <button
        onClick={zoomOut}
        disabled={userZoom <= ZOOM_MIN}
        title="Zoom out"
        style={{
          background: "none",
          border: "none",
          cursor: userZoom <= ZOOM_MIN ? "not-allowed" : "pointer",
          color: userZoom <= ZOOM_MIN ? "var(--sp-muted)" : "var(--sp-text)",
          fontSize: 18,
          lineHeight: 1,
          padding: "2px 8px",
          borderRadius: 999,
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,184,75,0.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        −
      </button>

      <button
        onClick={zoomReset}
        title="Reset zoom"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: userZoom === 1 ? "var(--sp-muted)" : "var(--sp-accent)",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "ui-monospace, monospace",
          minWidth: 46,
          textAlign: "center",
          padding: "2px 4px",
          borderRadius: 999,
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,184,75,0.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        {Math.round(pageScale * 100)}%
      </button>

      <button
        onClick={zoomIn}
        disabled={userZoom >= ZOOM_MAX}
        title="Zoom in"
        style={{
          background: "none",
          border: "none",
          cursor: userZoom >= ZOOM_MAX ? "not-allowed" : "pointer",
          color: userZoom >= ZOOM_MAX ? "var(--sp-muted)" : "var(--sp-text)",
          fontSize: 18,
          lineHeight: 1,
          padding: "2px 8px",
          borderRadius: 999,
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,184,75,0.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        +
      </button>
    </div>
  );
}
