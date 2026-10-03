import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { Bebas_Neue, IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./ui-system.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PWARegister from "@/components/PWARegister";
import { Toaster } from "@/components/ui/toaster";
import ReminderNudges from "@/components/ReminderNudges";
import ScrollToTop from "@/components/ScrollToTop";
import DistractionInterceptor from "@/components/study/DistractionInterceptor";
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
    metadataBase: new URL(isTracker ? "https://personal.buildora.work" : "https://buildora.work"),
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
    openGraph: {
      type: "website" as const,
      url: isTracker ? "https://personal.buildora.work" : "https://buildora.work",
      title: isTracker ? `${TRACKER_BRAND.name} | Personal Operating System` : PORTFOLIO_BRAND.title,
      description: brand.description,
      images: [
        {
          url: isTracker ? "/icons/icon-512.png" : PORTFOLIO_BRAND.ogImagePath,
          width: 1200,
          height: 630,
          alt: isTracker ? `${TRACKER_BRAND.name} Personal Operating System` : "Vamsi Krishna portfolio",
        },
      ],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: isTracker ? `${TRACKER_BRAND.name} | Personal Operating System` : PORTFOLIO_BRAND.title,
      description: brand.description,
      images: [isTracker ? "/icons/icon-512.png" : PORTFOLIO_BRAND.ogImagePath],
    },
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

  const jsonLd = !trackerSurface
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Person",
            "@id": "https://buildora.work/#person",
            name: "Vamsi Krishna Chandaluri",
            alternateName: "Vamsi Krishna",
            url: "https://buildora.work",
            jobTitle: "Senior Full Stack & Systems Engineer",
            description: brand.description,
            knowsAbout: [
              "TypeScript",
              "React",
              "Next.js",
              "Node.js",
              "NestJS",
              "PostgreSQL",
              "Prisma",
              "Distributed Systems",
              "Full Stack Architecture",
              "Microservices",
            ],
            sameAs: [
              "https://github.com/CVamsi27",
              "https://github.com/CVamsi27/software-developer-bible",
              "https://study.buildora.work",
              "https://www.linkedin.com/in/vamsikrishnachandaluri/",
              "https://x.com/Vamsikrishna99C",
              "https://stackoverflow.com/users/14019992/vamsi-krishna",
              "https://leetcode.com/u/cvamsik99/",
            ],
          },
          {
            "@type": "ProfilePage",
            "@id": "https://buildora.work/#profilepage",
            url: "https://buildora.work",
            name: PORTFOLIO_BRAND.title,
            mainEntity: { "@id": "https://buildora.work/#person" },
          },
          {
            "@type": "WebSite",
            "@id": "https://buildora.work/#website",
            url: "https://buildora.work",
            name: PORTFOLIO_BRAND.siteName,
            publisher: { "@id": "https://buildora.work/#person" },
          },
        ],
      }
    : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href={brand.iconPath} type="image/svg+xml" />
        {jsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        ) : null}
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
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:border focus:border-[var(--portfolio-accent)] focus:bg-[var(--portfolio-paper)] focus:px-4 focus:py-2 focus:font-utility focus:text-xs focus:font-semibold focus:text-[var(--portfolio-accent)] focus:shadow-lg focus:outline-none"
          >
            Skip to main content
          </a>
          <main id="main-content" className="relative flex flex-col min-h-screen">
            <Navbar initialIsTracker={trackerSurface} />
            <Suspense fallback={null}>
              <DistractionInterceptor />
            </Suspense>
            <div className="flex-1">{children}</div>
            <Toaster />
            {trackerSurface ? <ReminderNudges /> : null}
            <ScrollToTop isPortfolio={!trackerSurface} />
            <Footer initialIsTracker={trackerSurface} />
            <PWARegister />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
