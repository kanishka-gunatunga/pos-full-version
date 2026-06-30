import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import MinWidthGuard from "@/components/MinWidthGuard";
import QueryProvider from "@/utils/providers";
import * as Auth from "@/contexts/AuthContext";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { AuthIdleTimeoutProvider } from "@/components/providers/AuthIdleTimeoutProvider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ahas Gawwa POS",
  description: "Point of Sale system for restaurant operations",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased`}>
        <MinWidthGuard>
          <SessionProvider>
            <QueryProvider>
              <Auth.AuthProvider>
                <AuthIdleTimeoutProvider>
                  {children}
                  <Toaster position="top-center" richColors closeButton />
                </AuthIdleTimeoutProvider>
              </Auth.AuthProvider>
            </QueryProvider>
          </SessionProvider>
        </MinWidthGuard>
      </body>
    </html>
  );
}
