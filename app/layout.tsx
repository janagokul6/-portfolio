import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gokul Janarthanan — Full Stack Engineer",
  description:
    "Full Stack Engineer with 4+ years building performant web applications, scalable systems, and interfaces that people enjoy using.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
