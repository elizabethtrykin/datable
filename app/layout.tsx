import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { MatchedPersonProvider } from "@/contexts/MatchedPersonContext";

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
      <MatchedPersonProvider>
        <MessagesProvider>
          <html lang="en">
            <body
              className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
            >
              {children}
            </body>
          </html>
        </MessagesProvider>
      </MatchedPersonProvider>
    </UserProvider>
  );
}
