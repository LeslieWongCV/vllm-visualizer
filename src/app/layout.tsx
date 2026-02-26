import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SpeedProvider } from "@/components/SpeedProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "vLLM Architecture Visualizer",
  description:
    "Interactive visualizer for vLLM, the high-throughput LLM serving engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider>
          <SpeedProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-[240px] flex flex-col min-h-screen">
              <main className="flex-1 px-10 py-8 max-w-5xl w-full mx-auto">
                {children}
              </main>
              <Footer />
            </div>
          </div>
          </SpeedProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
