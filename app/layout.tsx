/** @format */

import "./global.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import { baseUrl } from "./sitemap";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Salary management",
    template: "%s | Next.js Portfolio Starter",
  },
  description: "This is my portfolio.",
  openGraph: {
    title: "My Portfolio",
    description: "This is my portfolio.",
    url: baseUrl,
    siteName: "My Portfolio",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cx("", GeistSans.variable, GeistMono.variable)}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="mx-auto" style={{ width: "900px" }}>
        <div
          style={{
            textAlign: "left",
            marginBottom: "2rem",
            padding: "10px",
            borderRadius: "0.5rem",
          }}
        >
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#1f2937",
            }}
          >
            Salary Loan Tracker
          </h1>
          <p
            style={{
              color: "#6b7280",
              fontSize: "12px",
            }}
          >
            Manage your salary periods, loans, and deductions
          </p>
        </div>
        <div className="flex bg-white mx-auto">
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
