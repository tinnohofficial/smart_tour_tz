import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/error/ErrorBoundary";


const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Smart Tour Tanzania",
  description: "Book your next adventure with ease",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-white min-h-screen flex flex-col`}
      >
        <ErrorBoundary>
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8 md:px-6 lg:px-8">{children}</main>
          <Toaster className="bg-white" />
        </ErrorBoundary>
      </body>
    </html>
  );
}
