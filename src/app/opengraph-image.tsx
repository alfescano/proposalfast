import { ImageResponse } from "next/og";

export const runtime = "edge";
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
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#152033",
          color: "#F6F1E8",
          padding: 72,
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: "#C9A227" }}>
          ProposalFast
        </div>
        <div style={{ fontSize: 72, lineHeight: 1.05, maxWidth: 900 }}>
          Client proposals that close — without invented numbers.
        </div>
        <div style={{ fontSize: 24, color: "#C9A227" }}>proposalfast.ai</div>
      </div>
    ),
    size,
  );
}
