import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@/styles/themes/kingdom.css";
import "@/styles/themes/pirate.css";
import "@/styles/themes/greek.css";
import "@/styles/themes/animations.css";
import { ThemeProvider } from "@/lib/ThemeContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Outrank — Online Multiplayer",
  description: "Classic strategy board game — play online with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
