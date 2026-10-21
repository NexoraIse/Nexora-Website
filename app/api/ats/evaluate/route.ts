import { rateLimit } from "@/lib/rateLimit";
import { evaluateResume } from "@/lib/ats/evaluator";
import { extractResumeText } from "@/lib/ats/resume-parser";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
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
    const file = formData.get("resume");

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

    if (!(file instanceof File)) {
      return Response.json({ error: "Upload one PDF or DOCX resume." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: `${file.name} is larger than the 8 MB limit.` }, { status: 413 });
    }

    const resumeText = await extractResumeText(file);
    return Response.json(await evaluateResume(file.name, resumeText, description.trim()));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to evaluate the resume.";
    console.error("ATS evaluation failed:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
