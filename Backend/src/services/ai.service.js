const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "The match score between the candidate and the job describe, which is a number between 0 and 100, where 0 means no match at all and 100 means a perfect match",
    ),
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take, etc.",
          ),
      }),
    )
    .describe("Technical questions that can be asked in the interview"),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The behavioral question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take, etc.",
          ),
      }),
    )
    .describe("Behavioral questions that can be asked in the interview"),
  skillGaps: z
    .array(
      z.object({
        skill: z
          .string()
          .describe(
            "The skill which the candidate is lacking based on the resume, self describe and job describe",
          ),
        severity: z
          .enum(["low", "medium", "high"])
          .describe("The severity of the skill gap"),
      }),
    )
    .describe("The skill gaps that the candidate has"),
  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("The day number in the preparation plan, starting from 1"),
        focus: z
          .string()
          .describe("The main focus for that day in the preparation plan"),
        tasks: z.array(z.string()).describe("The tasks to be done on that day"),
      }),
    )
    .describe("The preparation plan for the candidate"),
  title: z
    .string()
    .describe(
      "The title of the job for which the interview report is generated",
    ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `
Generate interview report.

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

Return ONLY VALID JSON.

Required structure:

{
title:string,
matchScore:number,

technicalQuestions:[
{
question,
intention,
answer
}
],

behavioralQuestions:[
{
question,
intention,
answer
}
],

skillGaps:[
{
skill,
severity:
low|medium|high
}
],

preparationPlan:[
{
day:number,
focus:string,
tasks:string[]
}
]
}

`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseFormat: {
        text: {
          mimeType: "application/json",
          schema: z.toJSONSchema(interviewReportSchema),
        },
      },
    },
  });

  console.log("RAW GEMINI RESPONSE:\n", response.text);

  let parsedJSON;

  try {
    parsedJSON = JSON.parse(response.text);
  } catch (error) {
    console.log("Invalid JSON:", error);
    throw new Error("Gemini returned invalid JSON");
  }

  const report = interviewReportSchema.safeParse(parsedJSON);

  if (!report.success) {
    console.log(report.error);
    throw new Error("Invalid AI response");
  }

  console.log(report.data);

  return report.data;
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "10mm",
      right: "10mm",
    },
  });

  await browser.close();

  return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    html: z
      .string()
      .describe(
        "The HTML content of the resume which can be converted to PDF using any library like puppeteer",
      ),
  });

  const prompt = `Generate a resume PDF for the candidate with the following details:
                    Resume: ${resume}
                    Self Description: ${selfDescription}
                    Job Description: ${jobDescription}

                    the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.

                    IMPORTANT CONTENT RULES:

- Use ONLY information present in the Resume and Self Description.
- Do NOT invent work experience, internships, certifications, achievements, metrics, responsibilities, or skills.
- Tailor the wording and ordering of content to match the Job Description, but never fabricate qualifications.

- The resume must sound like it was written by an experienced recruiter for a real candidate.
- Avoid generic AI-style phrases such as:
  * Results-oriented professional
  * Passionate developer
  * Proven ability to
  * Highly motivated
  * Dynamic individual
  * Strong analytical mindset
  * Fast-paced environment
  * Team player

- Prefer concrete descriptions of actual work over buzzwords.
- Focus on what the candidate built, implemented, improved, or learned.
- Do not exaggerate seniority. If the candidate is a student or early-career engineer, the resume should reflect that naturally.
- Keep the summary to 2-4 sentences.

PROJECT WRITING RULES:

- Every project bullet should clearly mention:
  * what was built
  * technologies used
  * technical implementation details
  * outcome or benefit when available

- Avoid excessive use of words like:
  * Architected
  * Spearheaded
  * Revolutionized
  * Transformed
  * Enterprise-grade
  * World-class
  * Cutting-edge

ATS RULES:

- Extract important keywords from the Job Description and naturally incorporate matching keywords that are genuinely supported by the candidate's background.
- Optimize for ATS matching without keyword stuffing.
- Use clear section headings and standard resume formatting.

HTML RULES:

- Generate a complete HTML document.
- Use inline CSS only.
- Ensure the layout converts cleanly to PDF using Puppeteer.
- Keep the resume within 1-2 pages when rendered as PDF.
- Use professional typography and spacing.
- Include clickable links for GitHub, LinkedIn, Portfolio, and project URLs when available.

- Return ONLY VALID JSON.

Required structure: 
{
html:string
}

  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseFormat: {
        text: {
          mimeType: "application/json",
          schema: z.toJSONSchema(resumePdfSchema),
        },
      },
    },
  });

  const jsonContent = JSON.parse(response.text);

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

  console.log(pdfBuffer);

  return pdfBuffer;
}

module.exports = { generateInterviewReport, generateResumePdf };
