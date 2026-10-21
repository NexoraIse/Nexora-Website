"use client";

import React, { useState, useEffect } from "react";
import LearnHero from "./LearnHero";
import ExploreLearning from "./ExploreLearning";
import UpcomingExams from "./UpcomingExams";
import StudyMaterialsSection from "./StudyMaterialsSection";
import SkillDevelopment from "./SkillDevelopment";
import {
  LearningResource,
  ExamSchedule,
  SkillResource,
  INITIAL_STUDY_MATERIALS,
  INITIAL_EXAMS,
  INITIAL_SKILLS,
} from "./learnData";

interface ApiResource {
  id: string;
  title: string;
  subject: string;
  semester?: number | string;
  category?: LearningResource["category"];
  description: string;
  resourceType?: LearningResource["fileType"];
  fileUrl?: string;
  createdAt?: string;
  tags?: string[];
}

export default function LearnPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [materials, setMaterials] = useState<LearningResource[]>(INITIAL_STUDY_MATERIALS);
  const [exams] = useState<ExamSchedule[]>(INITIAL_EXAMS);
  const [skills] = useState<SkillResource[]>(INITIAL_SKILLS);

  // Real-time integration with backend database
  useEffect(() => {
    async function fetchFromDatabase() {
      try {
        const res = await fetch("/api/resources");
        if (!res.ok) return;
        const data = await res.json();
        if (data.resources && data.resources.length > 0) {
          const mapped: LearningResource[] = data.resources.map((r: ApiResource) => ({
            id: r.id,
            title: r.title,
            subject: r.subject,
            semester: r.semester || 3,
            category: r.category || "notes",
            description: r.description,
            fileType: r.resourceType || "PDF",
            fileUrl: r.fileUrl || "#",
            uploadedAt: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : "2026-03-01",
            tags: r.tags || [],
          }));
          setMaterials(mapped);
        }
      } catch (err) {
        console.warn("Fallback to initial study materials", err);
      }
    }

    fetchFromDatabase();
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Hero Section */}
      <LearnHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Explore Learning Grid */}
      <ExploreLearning
        materialsCount={materials.length}
        examsCount={exams.length}
        skillsCount={skills.length}
      />

      {/* Upcoming Exams Section */}
      <UpcomingExams exams={exams} />

      {/* Study Materials & Recently Added Resources */}
      <StudyMaterialsSection
        resources={materials}
        searchQuery={searchQuery}
      />

      {/* Skill Development Tracks */}
      <SkillDevelopment
        skills={skills}
        searchQuery={searchQuery}
      />

      {/* Subtle bottom padding for aesthetic spacing before footer */}
      <div className="h-16" />
    </div>
  );
}
