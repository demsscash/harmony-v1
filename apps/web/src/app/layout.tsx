import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harmony | HR Management Hub",
  description: "Next Generation HR & Payroll Management System for Mauritania",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
