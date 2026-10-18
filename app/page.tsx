import { Suspense } from "react";
import HomePageExperience from "@/components/HomePageExperience";
import HomeSections from "@/components/HomeSections";
import HomeSectionsLoading from "@/components/HomeSectionsLoading";

export default function HomePage() {
  return (
    <HomePageExperience>
      <Suspense fallback={<HomeSectionsLoading />}>
        <HomeSections />
      </Suspense>
    </HomePageExperience>
  );
}