"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="dark" 
      enableSystem={true} 
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
