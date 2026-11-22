import { ImageResponse } from "next/og";

/** Renders the EE app icon as a PNG (used for the home-screen / PWA icons). */
export function renderAppIcon(size: number, maskable = false) {
  const pad = maskable ? size * 0.12 : 0; // keep the mark inside Android's safe zone
  const inner = size - pad * 2;
  const u = inner / 64;
  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1A3A",
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        <div style={{ position: "relative", width: inner, height: inner, display: "flex" }}>
          {/* "E" built from blocks to match the SVG logo */}
          <div style={{ position: "absolute", left: 18 * u, top: 20 * u, width: 7 * u, height: 26 * u, background: "#fff" }} />
          <div style={{ position: "absolute", left: 18 * u, top: 20 * u, width: 22 * u, height: 6 * u, background: "#fff" }} />
          <div style={{ position: "absolute", left: 18 * u, top: 30 * u, width: 20 * u, height: 6 * u, background: "#fff" }} />
          <div style={{ position: "absolute", left: 18 * u, top: 40 * u, width: 22 * u, height: 6 * u, background: "#fff" }} />
          <div
            style={{ position: "absolute", left: 43 * u, top: 40 * u, width: 8 * u, height: 8 * u, borderRadius: 999, background: "#0E9F6E" }}
          />
          <div
            style={{ position: "absolute", left: 44 * u, top: 17 * u, width: 6 * u, height: 6 * u, borderRadius: 999, background: "#D9650B" }}
          />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
