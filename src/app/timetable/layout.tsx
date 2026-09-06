import { Suspense, type ReactNode } from "react";
import PreferencesGate from "./preferences-gate";
import Loading from "./loading";

export default function TimetableLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}><PreferencesGate>{children}</PreferencesGate></Suspense>;
}
