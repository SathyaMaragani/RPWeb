import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RPWeb - Story First",
  description: "A private roleplay continuation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
