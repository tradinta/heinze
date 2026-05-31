import type { Metadata } from "next";
import "./globals.css";
import { ReaderProvider } from "@/context/ReaderContext";
import { ToastProvider } from "@/context/ToastContext";
import Navigation from "@/components/Navigation";
import CommandCenter from "@/components/CommandCenter";
import RouteLoader from "@/components/RouteLoader";
import AnalyticsTracker from "@/components/AnalyticsTracker";
 
import Footer from "@/components/Footer";
 
export const metadata: Metadata = {
  title: "Robert Heinze | Intelligence, AI & Solitude",
  description: "Perspectives and essays on cognitive evolution, artificial intelligence systems, philosophy, and focus in an automated world by Robert Heinze.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-250 font-sans">
        <ToastProvider>
          <RouteLoader />
          <ReaderProvider>
            <Navigation />
            <main className="flex-1 flex flex-col">{children}</main>
            <CommandCenter />
            <AnalyticsTracker />
            <Footer />
          </ReaderProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
