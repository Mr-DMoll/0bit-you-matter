import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@repo/database";
import env from "../config/env.config.js";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export type QualityReport = {
  promptTemplateId:     string;
  promptName:           string;
  contentType:          string;
  totalJobs:            number;
  approvalRate:         number;
  rejectionReasons:     string[];
  suggestedRevision:    string;
  estimatedImprovement: string;
};

export async function runQualityImprovementAgent(): Promise<QualityReport[]> {
  const templates = await prisma.promptTemplate.findMany({
    where: { isActive: true },
    include: {
      jobs: {
        where:   { status: "COMPLETED" },
        include: {
          outputCareer: {
            include: {
              reviews: {
                where:  { status: { in: ["APPROVED", "REJECTED"] } },
                select: { status: true, notes: true },
              },
            },
          },
        },
        take:    50,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const reports: QualityReport[] = [];

  for (const template of templates) {
    const jobs = template.jobs;
    if (jobs.length === 0) continue;

    const allReviews = jobs
      .flatMap((j) => j.outputCareer?.reviews ?? []);

    const approved  = allReviews.filter((r) => r.status === "APPROVED").length;
    const rejected  = allReviews.filter((r) => r.status === "REJECTED");
    const total     = allReviews.length;

    if (total === 0) continue;

    const approvalRate     = Math.round((approved / total) * 100);
    const rejectionReasons = rejected.map((r) => r.notes).filter(Boolean) as string[];

    if (approvalRate >= 80 || rejectionReasons.length === 0) continue;

    const message = await anthropic.messages.create({
      model:      "claude-opus-4-8",
      max_tokens: 1024,
      system:     `You are a prompt engineer specialising in improving AI content generation for South African education.
Return ONLY valid JSON — no markdown.`,
      messages: [{
        role:    "user",
        content: `Analyse this prompt template and suggest an improved version.

Template name: ${template.name}
Content type: ${template.contentType}
Current system prompt:
${template.systemPrompt}

Current user prompt:
${template.userPrompt}

Current approval rate: ${approvalRate}%
Rejection reasons from reviewers:
${rejectionReasons.slice(0, 10).map((r, i) => `${i + 1}. ${r}`).join("\n")}

Return JSON:
{
  "suggestedSystemPrompt": string,
  "suggestedUserPrompt": string,
  "keyChanges": string[],
  "estimatedImprovement": string
}`,
      }],
    });

    const raw    = (message.content[0] as any).text as string;
    const parsed = JSON.parse(raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim());

    reports.push({
      promptTemplateId:     template.id,
      promptName:           template.name,
      contentType:          template.contentType,
      totalJobs:            jobs.length,
      approvalRate,
      rejectionReasons:     rejectionReasons.slice(0, 5),
      suggestedRevision:    `SYSTEM: ${parsed.suggestedSystemPrompt ?? ""}\n\nUSER: ${parsed.suggestedUserPrompt ?? ""}`,
      estimatedImprovement: parsed.estimatedImprovement ?? "",
    });
  }

  console.log(`[QualityAgent] Analysed ${templates.length} templates, generated ${reports.length} improvement reports`);
  return reports;
}
