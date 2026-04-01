"use client";

import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { CartProvider } from "@/lib/cart";
import { CommentsProvider } from "@/lib/comments";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider defaultBrightness={0}>
        <CartProvider>
          <CommentsProvider>{children}</CommentsProvider>
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
