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
  applicationName: "pinutie",
  title: "pinutie — suas finanças",
  description: "Organize suas finanças pessoais e compartilhadas.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/icons/pinutie-mascot.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "pinutie",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "overlays-content",
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
