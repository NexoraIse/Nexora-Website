import { rateLimit } from "@/lib/rateLimit";
import { evaluateResumes } from "@/lib/ats/evaluator";
import { extractResumeText } from "@/lib/ats/resume-parser";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_RESUMES = 10;
const MAX_DESCRIPTION_LENGTH = 50_000;

export async function POST(request: Request) {
  if (!rateLimit(request, "ats-evaluate", 5)) {
    return Response.json(
      { error: "Too many evaluation requests. Please try again in a minute." },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const description = formData.get("jobDescription");
    const files = formData.getAll("resumes");

    if (typeof description !== "string") {
      return Response.json(
        { error: "The job description must be text." },
        { status: 400 },
      );
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return Response.json(
        { error: "The job description is too long. Keep it below 50,000 characters." },
        { status: 413 },
      );
    }

    if (!files.length || files.length > MAX_RESUMES) {
      return Response.json(
        { error: `Upload between 1 and ${MAX_RESUMES} resumes.` },
        { status: 400 },
      );
    }

    const resumeFiles = files.filter((file): file is File => file instanceof File);
    if (resumeFiles.length !== files.length) {
      return Response.json({ error: "One or more uploaded resumes are invalid." }, { status: 400 });
    }

    for (const file of resumeFiles) {
      if (file.size > MAX_FILE_SIZE) {
        return Response.json(
          { error: `${file.name} is larger than the 8 MB limit.` },
          { status: 413 },
        );
      }
    }

    const resumes = await Promise.all(
      resumeFiles.map(async (file) => ({
        fileName: file.name,
        text: await extractResumeText(file),
      })),
    );

    return Response.json(await evaluateResumes(description.trim(), resumes));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to evaluate resumes.";
    console.error("ATS evaluation failed:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
