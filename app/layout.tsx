import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Knox_Dolphin",
  description: "Local-first project memory — stores the why behind the code.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
