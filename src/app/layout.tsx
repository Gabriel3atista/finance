import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance — finanças da família",
  description: "Uma visão simples e compartilhada das finanças da família.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://rsms.me" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
