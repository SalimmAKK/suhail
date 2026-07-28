import { ImageResponse } from "next/og";

/* The PWA install icon, rendered rather than committed as a binary.
 *
 * BrandMark.tsx is plain CSS: a gold square with a cream square inset,
 * scaled by a fraction of its own size. This is the same shape, rendered to
 * a real PNG at whatever size the manifest asks for, so there is one
 * definition of the mark rather than a component and a set of exported
 * bitmaps that can drift apart.
 *
 * Padded to roughly 80% of the canvas on all sides: most Android launchers
 * crop an icon to a circle or squircle regardless of whether the manifest
 * entry claims "maskable", and an icon drawn edge to edge loses its corners
 * to that crop. The inset keeps the mark whole under any of them.
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const px = Number(size);

  if (!Number.isFinite(px) || px < 16 || px > 1024) {
    return new Response("Invalid icon size", { status: 400 });
  }

  const inset = Math.round(px * 0.18);
  const markSize = px - inset * 2;
  const coreInset = Math.round(markSize * 0.27);

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf8f3",
        }}
      >
        <div
          style={{
            width: markSize,
            height: markSize,
            background: "#c9a961",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: markSize - coreInset * 2,
              height: markSize - coreInset * 2,
              background: "#faf8f3",
            }}
          />
        </div>
      </div>
    ),
    { width: px, height: px },
  );
}
