import type { Metadata } from "next";
import OnboardingForm from "./onboarding-form";
import { getOnboardingClasses } from "@/lib/timetable-data";
import { connection } from "next/server";

export const metadata: Metadata = { title: "Welcome | SSSVT Tools" };

export default async function OnboardingPage() {
  await connection();
  const classes = await getOnboardingClasses();
  return (
    <OnboardingForm classes={classes} />
  );
}
