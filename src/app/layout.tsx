import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/comun/layout/Providers";
import { QuickCSSInjector } from "@/components/comun/QuickCSSInjector";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LifeTracker",
  description: "Seguimiento de hábitos y finanzas para tu mejora personal.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body-md antialiased bg-background text-on-surface">
        {/* Inyecta el QuickCSS del usuario antes de la hidratación (sin FOUC).
            next/script beforeInteractive: Next lo posiciona correctamente. */}
        <QuickCSSInjector />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
