import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DOJO | Premium Sushi",
  description: "Authentic sushi delivery experience with a minimalistic touch.",
};

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from '@/context/UIContext';
import PageTransition from "@/components/layout/PageTransition";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <UIProvider>
            <CartProvider>
              <Header />
              <main>
                <PageTransition>
                  {children}
                </PageTransition>
              </main>
              <Footer />
            </CartProvider>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
