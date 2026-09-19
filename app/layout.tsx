import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "SellCore", template: "%s · SellCore" },
  description: "Hosted ecommerce infrastructure for digital products and services.",
  icons: { icon: "/assets/sellcore-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
