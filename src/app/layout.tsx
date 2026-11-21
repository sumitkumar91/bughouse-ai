import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bughouse AI | MCTS Decision Engine",
  description: "Bughouse Chess Multi-Agent AI powered by Monte Carlo Tree Search (MCTS) with partner uncertainty modeling.",
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
