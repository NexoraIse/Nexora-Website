import { Suspense } from "react";
import { connection } from "next/server";
import HomepageLaunchGate from "@/components/HomepageLaunchGate";
import HomeSections from "@/components/HomeSections";
import { getPublicLaunchState } from "@/lib/launch/state";

export const instant = false;

export default async function HomePage() {
  await connection();
  const launchState = await getPublicLaunchState().catch(() => null);

  const fallbackLaunchState = {
    status: "NORMAL" as const,
    countdownStartedAt: null,
    countdownEndsAt: null,
    animationStartedAt: null,
    animationEndsAt: null,
    launchedAt: null,
    version: "0",
    updatedAt: new Date().toISOString(),
  };

  return (
    <HomepageLaunchGate initialLaunchState={launchState ?? fallbackLaunchState}>
      <Suspense fallback={null}>
        <HomeSections />
      </Suspense>
    </HomepageLaunchGate>
  );
}

