import { prisma } from "@/lib/prisma";
import { INITIAL_ANNOUNCEMENTS } from "@/components/learn/learnData";

export type HomepageLearningResource = {
  id: string;
  title: string;
  subject: string;
  semester: number | null;
  category: string;
  description: string;
  resourceType: string;
  fileUrl: string | null;
  academicYear: string | null;
  tags: string[];
};

export type HomepageAcademicUpdate = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  category: string;
};

export type HomepageLearningData = {
  papers: HomepageLearningResource[];
  paperCount: number;
  resources: HomepageLearningResource[];
  updates: HomepageAcademicUpdate[];
  unavailable: boolean;
};

export async function getHomepageLearningData(): Promise<HomepageLearningData> {
  try {
    const [papers, resources] = await Promise.all([
      prisma.learningResource.findMany({
        where: {
          status: "PUBLISHED",
          category: { equals: "question_papers", mode: "insensitive" },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          subject: true,
          semester: true,
          category: true,
          description: true,
          resourceType: true,
          fileUrl: true,
          academicYear: true,
          tags: true,
        },
      }),
      prisma.learningResource.findMany({
        where: {
          status: "PUBLISHED",
          category: { not: "question_papers", mode: "insensitive" },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          title: true,
          subject: true,
          semester: true,
          category: true,
          description: true,
          resourceType: true,
          fileUrl: true,
          academicYear: true,
          tags: true,
        },
      }),
    ]);

    return {
      papers,
      paperCount: papers.length,
      resources,
      updates: INITIAL_ANNOUNCEMENTS.slice(0, 4).map((update) => ({
        id: update.id,
        title: update.title,
        description: update.description,
        publishedAt: update.publishedAt,
        category: update.category,
      })),
      unavailable: false,
    };
  } catch (error) {
    console.error("Homepage learning resources fetch error:", error);
    return {
      papers: [],
      paperCount: 0,
      resources: [],
      updates: INITIAL_ANNOUNCEMENTS.slice(0, 4).map((update) => ({
        id: update.id,
        title: update.title,
        description: update.description,
        publishedAt: update.publishedAt,
        category: update.category,
      })),
      unavailable: true,
    };
  }
}
