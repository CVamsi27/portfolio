import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Bebas_Neue, IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PWARegister from "@/components/PWARegister";
import { Toaster } from "@/components/ui/toaster";
import ReminderNudges from "@/components/ReminderNudges";
import {
  getBrandForHost,
  isTrackerHost,
  PORTFOLIO_BRAND,
  TRACKER_BRAND,
} from "@/lib/brand";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-ibm-plex-mono",
});

const novaDisplay = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-nova-display",
});

async function requestBrand() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  const trackerSurface =
    requestHeaders.get("x-product-surface") === "tracker" || isTrackerHost(host);
  return trackerSurface ? TRACKER_BRAND : getBrandForHost(host);
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await requestBrand();
  const isTracker = brand === TRACKER_BRAND;

  return {
    metadataBase: new URL("https://buildora.work"),
    title: isTracker ? `${TRACKER_BRAND.name} | Personal Operating System` : PORTFOLIO_BRAND.title,
    description: brand.description,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: isTracker ? TRACKER_BRAND.name : PORTFOLIO_BRAND.siteName,
      statusBarStyle: "black-translucent",
    },
    icons: {
      icon: brand.iconPath,
      apple: isTracker ? "/icons/icon-192.png" : PORTFOLIO_BRAND.iconPath,
    },
    ...(isTracker
      ? {}
      : {
          openGraph: {
            type: "website" as const,
            url: "https://buildora.work",
            title: PORTFOLIO_BRAND.title,
            description: PORTFOLIO_BRAND.description,
            images: [
              {
                url: PORTFOLIO_BRAND.ogImagePath,
                width: 1200,
                height: 630,
                alt: "Vamsi Krishna portfolio",
              },
            ],
          },
          twitter: {
            card: "summary_large_image" as const,
            title: PORTFOLIO_BRAND.title,
            description: PORTFOLIO_BRAND.description,
            images: [PORTFOLIO_BRAND.ogImagePath],
          },
        }),
  };
}

export async function generateViewport(): Promise<Viewport> {
  const brand = await requestBrand();
  return {
    themeColor: brand === TRACKER_BRAND ? TRACKER_BRAND.themeColor : "#0b0d12",
    viewportFit: "cover",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = await requestBrand();
  const trackerSurface = brand === TRACKER_BRAND;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href={brand.iconPath} type="image/svg+xml" />
      </head>
      <body
        className={cn(
          inter.variable,
          spaceGrotesk.variable,
          ibmPlexMono.variable,
          novaDisplay.variable,
          "font-sans antialiased",
          trackerSurface ? "tracker-surface" : "portfolio-surface",
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={trackerSurface ? "dark" : "light"}
          enableSystem
          disableTransitionOnChange
        >
          <main className="relative flex flex-col min-h-screen">
            <Navbar initialIsTracker={trackerSurface} />
            <div className="flex-1">{children}</div>
            <Toaster />
            {trackerSurface ? <ReminderNudges /> : null}
            <Footer initialIsTracker={trackerSurface} />
            <PWARegister />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
