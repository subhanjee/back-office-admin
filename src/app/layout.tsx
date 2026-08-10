import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZapCruise Admin Portal",
  description: "Enterprise Operations & Analytics Dashboard",
};

export const viewport = {
  themeColor: "#0F172A",
};

// Runs before paint: applies the persisted theme to <html> so there is no flash
// of the wrong theme. Must stay in sync with themeStore (key + values).
const themeInitScript = `(function(){try{var k='zc-admin-theme';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t='light';}var r=document.documentElement;if(t==='dark'){r.classList.add('dark');}r.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
