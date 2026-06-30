import React, { useState } from "react";

export function Avatar({
  src,
  name,
  size = 28,
  style = {},
}: {
  src?: string;
  name: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  const [error, setError] = useState(false);
  const initial = name ? name.trim().charAt(0).toUpperCase() : "?";

  // Consistent background colors based on user name hash
  const colors = [
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "var(--sp-accent)", // Blue
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#ef4444", // Red
    "#06b6d4", // Cyan
    "#14b8a6", // Teal
    "#a855f7", // Purple
    "#f43f5e", // Rose
  ];

  let hash = 0;
  const cleanName = name || "";
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];

  if (src && !error) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          display: "block",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(10, size * 0.45),
        fontWeight: 700,
        textTransform: "uppercase",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        userSelect: "none",
        fontFamily: "var(--sp-font-ui)",
        ...style,
      }}
    >
      {initial}
    </div>
  );
}
