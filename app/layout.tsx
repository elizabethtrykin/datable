import type { Metadata } from "next";
import { GeistSans, GeistMono } from 'geist/font';
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";

export const metadata: Metadata = {
  title: "Dating App",
  description: "A dating app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      <html lang="en">
        <body
          className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </UserProvider>
  );
}
