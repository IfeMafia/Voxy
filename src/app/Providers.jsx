"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query/queryClient";
import { SidebarProvider } from "@/contexts/SidebarContext";

export default function Providers({ children }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </QueryClientProvider>
  );
}
