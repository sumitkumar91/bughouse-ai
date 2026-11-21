import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bughouse.sumitk.me"),
  title: "Bughouse AI | MCTS Decision Engine",
  description: "Bughouse Chess Multi-Agent AI powered by Monte Carlo Tree Search (MCTS) with partner uncertainty modeling.",
  icons: {
    icon: "/icon.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Bughouse AI | MCTS Decision Engine",
    description: "Bughouse Chess Multi-Agent AI powered by Monte Carlo Tree Search (MCTS) with partner uncertainty modeling.",
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: "Bughouse AI Logo" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
