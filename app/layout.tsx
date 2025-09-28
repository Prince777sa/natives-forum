import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "NativesForum",
  description: "A platform for native empowerment and community-driven policy development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="NativesForum" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="antialiased">
        <AuthProvider>
        <Navbar/>
        {children}
        <Footer/>
        <Toaster/>
        </AuthProvider>
        
      </body>
    </html>
  );
}