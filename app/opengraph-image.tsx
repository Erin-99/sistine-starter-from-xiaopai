import { ImageResponse } from "next/og";

export const alt = "ClothCraft AI virtual try-on";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "76px",
          background: "#ffffff",
          color: "#18181b",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, fontWeight: 700 }}>
            <span
              style={{
                width: 58,
                height: 58,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                background: "#7bbf1f",
                color: "#ffffff",
                fontSize: 24,
              }}
            >
              CC
            </span>
            ClothCraft
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 54,
              fontSize: 76,
              lineHeight: 1.05,
              fontWeight: 700,
            }}
          >
            AI virtual try-on,
            <span>made for real outfits.</span>
          </div>
          <div style={{ marginTop: 30, fontSize: 28, color: "#626262" }}>
            Style up to three garments into one polished 2K look.
          </div>
        </div>
        <div
          style={{
            width: 250,
            height: 420,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "3px solid #d9d9d9",
            borderRadius: 18,
            background: "#f4f4f4",
            color: "#7bbf1f",
            fontSize: 108,
            fontWeight: 700,
          }}
        >
          +
        </div>
      </div>
    ),
    size
  );
}
