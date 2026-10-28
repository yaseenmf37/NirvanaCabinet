import type { Metadata } from "next";
import { Geist, Geist_Mono, Estedad } from "next/font/google";
import { AppStateProvider } from "./components/AppStateProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const estedad = Estedad({
  variable: "--font-estedad",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "New Nirvana | Cabinet Industry Platform",
  description:
    "Platform for cabinet-design workflow management, project tracking, and industry operations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${estedad.variable}`}
    >
      <body>
        <AppStateProvider>{children}</AppStateProvider>
        <footer className="site-credit">
          <span className="site-credit__label">طراحی و توسعه</span>
          <span className="site-credit__dot" aria-hidden="true" />
          <a
            href="https://hiradcode.ir"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="وب‌سایت هیراد کد"
          >
            هیراد کد
          </a>
        </footer>
      </body>
    </html>
  );
}
