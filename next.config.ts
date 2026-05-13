import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

let supabaseImagePattern: { protocol: "http" | "https"; hostname: string } | null =
  null;
try {
  if (supabaseUrl) {
    const u = new URL(supabaseUrl);
    supabaseImagePattern = {
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
    };
  }
} catch {
  // ignore — env not set or malformed
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow public Supabase Storage URLs
      ...(supabaseImagePattern ? [supabaseImagePattern] : []),
      // Local dev fallback
      { protocol: "http", hostname: "127.0.0.1", port: "54321" },
      // Seed data (Unsplash demo photo)
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
