// Font handling removed for build compatibility
// const inter = {};

import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "./Providers";
import "./globals.css";



import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata();

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="font-sans antialiased bg-[#08090c] text-white selection:bg-[#00D18F]/20 selection:text-[#00D18F]">
        <ThemeProvider>
          <Providers>
            {children}
            <Analytics />
            <SpeedInsights />
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(13, 16, 23, 0.9)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 12px 36px 0 rgba(0, 0, 0, 0.5)',
                  borderRadius: '1rem',
                  padding: '16px',
                },
                success: {
                  iconTheme: {
                    primary: '#00D18F',
                    secondary: '#000',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
