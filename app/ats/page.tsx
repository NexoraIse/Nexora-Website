import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContourBackdrop from "@/components/ContourBackdrop";
import ATSWorkspace from "@/components/ats/ATSWorkspace";

export const metadata: Metadata = {
  title: "Resume Evaluator | Nexora ISE Club",
  description: "Compare and rank resumes against a job description using AI-powered screening.",
};

export default function ATSPage() {
  return (
    <main className="relative isolate min-h-screen w-full overflow-hidden bg-[var(--theme-bg-main,#060913)] text-[var(--theme-bg-hero,#dce6ef)]">
      <ContourBackdrop />
      <Navbar />
      <div className="relative z-10">
        <ATSWorkspace />
      </div>
      <Footer />
    </main>
  );
}
