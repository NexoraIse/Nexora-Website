import { prisma } from "@/lib/prisma";

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

export type HomepageLearningData = {
  papers: HomepageLearningResource[];
  paperCount: number;
  resources: HomepageLearningResource[];
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
      unavailable: false,
    };
  } catch (error) {
    console.error("Homepage learning resources fetch error:", error);
    return {
      papers: [],
      paperCount: 0,
      resources: [],
      unavailable: true,
    };
  }
}
