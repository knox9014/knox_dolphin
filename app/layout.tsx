import type { ReactNode } from "react";

export const metadata = {
  title: "Knox_Dolphin",
  description: "Local-first project memory — stores the why behind the code.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          padding: "3rem",
          background: "#0b0f14",
          color: "#e6edf3",
        }}
      >
        {children}
      </body>
    </html>
  );
}
