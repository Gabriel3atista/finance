import type { Metadata, Viewport } from "next";
import { Inter, Kantumruy_Pro } from "next/font/google";
import { cn } from "@/shared/lib/utils";
import { QueryProvider } from "@/shared/components/query-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const kantumruyPro = Kantumruy_Pro({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-kantumruy-pro",
});

export const metadata: Metadata = {
  title: "Finance — finanças da família",
  description: "Uma visão simples e compartilhada das finanças da família.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/finance-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Finance",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "hsl(225 15.38% 5.1%)",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      className={cn(
        inter.variable,
        kantumruyPro.variable,
        "min-h-full overscroll-none bg-graphite-900 [color-scheme:dark] [-webkit-text-size-adjust:100%]",
      )}
      lang="pt-BR"
    >
      <body className="min-h-[100dvh] bg-graphite-900 font-sans text-muted antialiased [font-optical-sizing:auto] selection:bg-moon-800 selection:text-moon-50">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
