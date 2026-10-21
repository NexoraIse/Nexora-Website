import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LearnPageContent from "@/components/learn/LearnPageContent";
import ContourBackdrop from "@/components/ContourBackdrop";

export const metadata: Metadata = {
  title: "Learning Hub | Nexora ISE Club",
  description:
    "Your space for academic resources, exam updates, VTU question papers and skill development curated by Nexora ISE Club.",
};

export default function LearnPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[var(--theme-bg-main,#060913)] text-[var(--theme-bg-hero,#dce6ef)]">
      <Navbar />

      <main className="relative isolate flex-1 w-full bg-[var(--theme-bg-main,#060913)] text-[var(--theme-bg-hero,#dce6ef)] overflow-hidden">
        <ContourBackdrop className="z-0" />

        <div className="relative z-10">
          <LearnPageContent />
        </div>
      </main>

      <Footer />
    </div>
  );
}
