import "./globals.css";
import type { ReactNode } from "react";
import { AppShell } from "../components/app-shell/app-shell";
import { AuthModalProvider } from "../components/auth/AuthModalProvider";
import { AuthProvider } from "../components/auth/AuthProvider";

export const metadata = {
  title: "DarePot",
  description: "Localhost-only virtual credits party game",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans antialiased">
        <AuthProvider>
          <AuthModalProvider>
            <AppShell>{children}</AppShell>
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
