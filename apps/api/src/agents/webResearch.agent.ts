import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@repo/database";
import env from "../config/env.config.js";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export type WebResearchTarget = {
  type:     "BURSARY_DEADLINE" | "APS_SCORE" | "SALARY_RANGE" | "PROGRAMME_FEES";
  entityId: string;
  name:     string;
  url?:     string;
};

export async function runWebResearchAgent(target: WebResearchTarget): Promise<{
  found:      boolean;
  data:       Record<string, any>;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  notes:      string;
}> {
  const sources = await prisma.source.findMany({
    where:   { isActive: true, reliabilityRating: { gte: 4 } },
    orderBy: { reliabilityRating: "desc" },
    take:    10,
  });

  const sourceList = sources.map((s) => `- ${s.name}: ${s.url}`).join("\n");

  const prompts: Record<WebResearchTarget["type"], string> = {
    BURSARY_DEADLINE: `Research the current application deadline for the bursary: "${target.name}".
${target.url ? `Provider website: ${target.url}` : ""}
Trusted SA sources:\n${sourceList}
Return JSON: { "deadline": "YYYY-MM-DD or null", "amount": number or null, "stillOpen": boolean, "notes": string }`,

    APS_SCORE: `Research the current minimum APS score required for: "${target.name}".
${target.url ? `University website: ${target.url}` : ""}
Trusted SA sources:\n${sourceList}
Use the SA APS scale (1–7). Return JSON: { "apsRequired": number or null, "subjectRequirements": string, "notes": string }`,

    SALARY_RANGE: `Research the current salary range in South Africa for: "${target.name}".
Trusted SA sources:\n${sourceList}
Return JSON: { "salaryMin": number (ZAR annual), "salaryMax": number (ZAR annual), "source": string, "notes": string }`,

    PROGRAMME_FEES: `Research the current annual fees for the programme: "${target.name}".
${target.url ? `University website: ${target.url}` : ""}
Trusted SA sources:\n${sourceList}
Return JSON: { "annualFees": number or null, "currency": "ZAR", "academicYear": string, "notes": string }`,
  };

  const message = await anthropic.messages.create({
    model:      "claude-opus-4-8",
    max_tokens: 1024,
    system:     `You are a South African education data researcher. You have deep knowledge of SA universities, bursaries and careers.
Only state facts you are confident about. If uncertain, set confidence to LOW and explain in notes.
Return ONLY valid JSON — no markdown, no explanation.`,
    messages: [{ role: "user", content: prompts[target.type] }],
  });

  const raw    = (message.content[0] as any).text as string;
  const parsed = JSON.parse(raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim());

  const confidence: "HIGH" | "MEDIUM" | "LOW" =
    parsed.source || parsed.deadline ? "HIGH" : parsed.notes?.includes("uncertain") ? "LOW" : "MEDIUM";

  return {
    found:      Object.values(parsed).some((v) => v != null && v !== ""),
    data:       parsed,
    confidence,
    notes:      parsed.notes ?? "",
  };
}
