import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { AudioProvider } from "@/components/AudioProvider";
import CustomCursor from "@/components/CustomCursor";
import ContextMenu from "@/components/ContextMenu";
import BottomNavCluster from "@/components/BottomNavCluster";
import Terminal from "@/components/Terminal";

const clashDisplay = localFont({
  src: "../public/fonts/clash.woff2",
  variable: "--font-clash-display",
  display: "swap",
  weight: "200 800",
});

const cabinetGrotesk = localFont({
  src: "../public/fonts/cabinet.woff2",
  variable: "--font-cabinet-grotesk",
  display: "swap",
  weight: "200 800",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#060913",
};

export const metadata: Metadata = {
  title: "Nexora | ISE Technical Club",
  description:
    "Official website of the Nexora ISE Club, Department of Information Science and Engineering at AJIET Mangaluru.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${clashDisplay.variable} ${cabinetGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=window.location.pathname;if(p==='/'||p===''){document.documentElement.style.backgroundColor='#dce6ef';}else{document.documentElement.style.backgroundColor='#060913';}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <Suspense fallback={<div className="min-h-screen bg-[#060913]" />}>
          <SmoothScroll>
            <AudioProvider>
              <CustomCursor />
              <ContextMenu />
              <BottomNavCluster />
              <Terminal />
              {children}
            </AudioProvider>
          </SmoothScroll>
        </Suspense>
      </body>
    </html>
  );
}
