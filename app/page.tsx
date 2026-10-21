import { Suspense } from "react";
import HomepageLaunchGate from "@/components/HomepageLaunchGate";
import HomeSections from "@/components/HomeSections";
import type { PublicLaunchState } from "@/lib/launch/types";

const initialLaunchState: PublicLaunchState = {
  status: "NORMAL",
  countdownStartedAt: null,
  countdownEndsAt: null,
  animationStartedAt: null,
  animationEndsAt: null,
  launchedAt: null,
  version: "0",
  updatedAt: "1970-01-01T00:00:00.000Z",
};

export default function HomePage() {
  return (
    <HomepageLaunchGate initialLaunchState={initialLaunchState}>
      <Suspense fallback={null}>
        <HomeSections />
      </Suspense>
    </HomepageLaunchGate>
  );
}
