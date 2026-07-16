import React from "react";

/**
 * Reusable avatar/logo. Renders `src` if given, else the name's initial on
 * ink. `shape` circle (user) or square (org logo, 7px radius).
 */
export function Avatar({ src, name, size = 26, shape = "circle", style, ...rest }) {
  const radius = shape === "square" ? "7px" : "var(--radius-pill)";
  const initial = (name || "?").trim().charAt(0).toLowerCase() || "?";
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, overflow: "hidden",
        background: "var(--color-ink)", color: "var(--color-bg)",
        width: size, height: size, borderRadius: radius,
        ...style,
      }}
      {...rest}
    >
      {src ? (
        <img src={src} alt={name || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: radius }} />
      ) : (
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontStyle: "italic", lineHeight: 1, fontSize: Math.round(size * 0.42) }}>{initial}</span>
      )}
    </span>
  );
}
