import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tapcet — Free CET Review Platform",
  description:
    "Free community-driven reviewers for UPCAT, ACET, USTET, DLSUCET, PUPCET, DOST-SEI, JLSS and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${jakarta.variable} ${plexMono.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border py-10 mt-auto">
            <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm text-foreground tracking-tight">tapcet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Free CET review for Filipino students
                </p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                {["UPCAT", "ACET", "USTET", "DLSUCET", "PUPCET", "DOST-SEI", "JLSS"].map((exam) => (
                  <span key={exam} className="font-mono text-xs text-muted-foreground/60">
                    {exam}
                  </span>
                ))}
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
