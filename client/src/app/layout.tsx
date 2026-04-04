import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tapcet",
  description: "Quiz platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${plexMono.variable}`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border py-8 mt-auto">
            <div className="mx-auto max-w-3xl px-6">
              <p className="text-xs text-muted-foreground font-mono tracking-tight">
                tapcet <span className="text-primary">_</span> quiz platform
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
