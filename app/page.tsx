import { Suspense } from "react";
import { io } from "next/cache";
import HomepageLaunchGate from "@/components/HomepageLaunchGate";
import HomeSections from "@/components/HomeSections";
import { getPublicLaunchState } from "@/lib/launch/state";
import { ANIMATION_SECONDS } from "@/lib/launch/types";

type HomePageProps = {
  searchParams: Promise<{
    launchPreview?: string | string[];
    elapsed?: string | string[];
  }>;
};

const PREVIEW_STATUSES = ["STAY_TUNED", "COUNTDOWN_RUNNING", "ANIMATION"] as const;
type PreviewStatus = typeof PREVIEW_STATUSES[number];

async function HomepageContent({ searchParams }: HomePageProps) {
  await io();
  const [initialLaunchState, params] = await Promise.all([
    getPublicLaunchState(),
    searchParams,
  ]);
  const requestedPreview = Array.isArray(params.launchPreview)
    ? params.launchPreview[0]
    : params.launchPreview;

  if (
    process.env.NODE_ENV === "development" &&
    PREVIEW_STATUSES.includes(requestedPreview as PreviewStatus)
  ) {
    const requestedElapsed = Array.isArray(params.elapsed) ? params.elapsed[0] : params.elapsed;
    const parsedElapsed = Number(requestedElapsed || 0);
    const maximumElapsed = requestedPreview === "COUNTDOWN_RUNNING" ? 10 : ANIMATION_SECONDS;
    const elapsed = Number.isFinite(parsedElapsed)
      ? Math.max(0, Math.min(maximumElapsed, parsedElapsed))
      : 0;
    const serverTime = initialLaunchState.serverTime ?? initialLaunchState.updatedAt;
    const now = Date.parse(serverTime);

    if (requestedPreview === "STAY_TUNED") {
      initialLaunchState.status = "STAY_TUNED";
      initialLaunchState.serverTime = serverTime;
    } else if (requestedPreview === "COUNTDOWN_RUNNING") {
      initialLaunchState.status = "COUNTDOWN_RUNNING";
      initialLaunchState.countdownStartedAt = new Date(now - elapsed * 1000).toISOString();
      initialLaunchState.countdownEndsAt = new Date(now + (10 - elapsed) * 1000).toISOString();
      initialLaunchState.serverTime = serverTime;
    } else {
      initialLaunchState.status = "ANIMATION";
      initialLaunchState.animationStartedAt = new Date(now - elapsed * 1000).toISOString();
      initialLaunchState.animationEndsAt = new Date(
        now + (ANIMATION_SECONDS - elapsed) * 1000,
      ).toISOString();
      initialLaunchState.serverTime = serverTime;
    }
  }

  return (
    <HomepageLaunchGate initialLaunchState={initialLaunchState}>
      <Suspense fallback={null}>
        <HomeSections />
      </Suspense>
    </HomepageLaunchGate>
  );
}

export default function HomePage(props: HomePageProps) {
  return (
    <Suspense fallback={<div aria-hidden="true" style={{ minHeight: "100vh", background: "#000" }} />}>
      <HomepageContent searchParams={props.searchParams} />
    </Suspense>
  );
}
