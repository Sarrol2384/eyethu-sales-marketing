import type { Metadata } from "next";
import { StaffLandingHero } from "@/components/public/StaffLandingHero";

export const metadata: Metadata = {
  title: "Staff portal",
  description: "Eyethu Property Group staff sign-in.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StaffLandingPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col">
      <StaffLandingHero />
    </main>
  );
}
