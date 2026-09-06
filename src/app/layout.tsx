import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import ProjectInfo from "./components/project-info";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "SSSVT Tools",
  description: "made by matrn.dev",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${rubik.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ProjectInfo />
      </body>
      
    </html>
  );
}
