import "./globals.css";
import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans, Sora, Space_Grotesk } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  preload: false,
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "SellCore", template: "%s · SellCore" },
  description: "Hosted ecommerce infrastructure for digital products and services.",
  icons: { icon: "/assets/sellcore-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const fontVariables = `${manrope.variable} ${spaceGrotesk.variable} ${sora.variable} ${plusJakartaSans.variable}`;
  return <html lang="en" className={fontVariables}><body>{children}</body></html>;
}
