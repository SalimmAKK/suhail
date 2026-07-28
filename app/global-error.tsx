"use client";

/* Catches a failure in the root layout itself — the one place app/error.tsx
 * cannot reach, since an error boundary can't catch a throw in its own
 * ancestor. Next requires this file to render a full document: the root
 * layout that would normally supply <html> and <body> is exactly what may
 * have failed.
 *
 * Deliberately not importing globals.css, next/font, or any app component:
 * all of those are things that could themselves be implicated in whatever
 * broke the root layout, and a fallback that depends on the thing that just
 * failed is not a fallback. Inline styles only, so this renders no matter
 * what upstream did.
 */
export default function GlobalError() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#faf8f3",
          color: "#1a1d2e",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ width: 30, height: 30, background: "#c9a961" }} />
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 12px" }}>
            Suhail is unavailable right now.
          </h1>
          <p style={{ maxWidth: "40ch", margin: "0 auto", lineHeight: 1.6, opacity: 0.75 }}>
            Something failed to load. Refreshing usually fixes it.
          </p>
        </div>
        {/* Not next/link, deliberately: this file's whole point is to render
            without depending on anything else in the app, and if the root
            layout is what failed, staying off any app-level import is the
            safer bet. A plain anchor is what Next's own docs use here. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          style={{
            background: "#c9a961",
            color: "#1a1d2e",
            padding: "12px 24px",
            fontWeight: 700,
            textTransform: "uppercase",
            fontSize: 13,
            letterSpacing: "0.06em",
            textDecoration: "none",
          }}
        >
          Reload
        </a>
      </body>
    </html>
  );
}
