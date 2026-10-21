import mammoth from "mammoth";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

const MAX_EXTRACTED_TEXT = 60_000;

export async function extractResumeText(file: File): Promise<string> {
  const extension = file.name.toLowerCase().split(".").pop();
  const buffer = Buffer.from(await file.arrayBuffer());
  let text: string;

  if (extension === "pdf") {
    text = (await pdfParse(buffer)).text;
  } else if (extension === "docx") {
    text = (await mammoth.extractRawText({ buffer })).value;
  } else {
    throw new Error(`${file.name} is not a supported resume. Upload a PDF or DOCX file.`);
  }

  const normalizedText = text.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
  if (!normalizedText) {
    throw new Error(`No readable text was found in ${file.name}.`);
  }

  return normalizedText.slice(0, MAX_EXTRACTED_TEXT);
}
