import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DOJO | Premium Sushi",
  description: "Authentic sushi delivery experience with a minimalistic touch.",
};

import Header from "@/components/layout/Header";
import StoreProvider from "@/providers/StoreProvider";
import PageTransition from "@/components/layout/PageTransition";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <StoreProvider>
          <Header />
          <main>
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </StoreProvider>
      </body>
    </html >
  );
}
