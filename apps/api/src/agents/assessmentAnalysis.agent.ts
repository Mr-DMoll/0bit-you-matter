import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@repo/database";
import env from "../config/env.config.js";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

type RiasecScores = { R: number; I: number; A: number; S: number; E: number; C: number };

function computeRiasecTopCodes(scores: RiasecScores): string {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => k)
    .join("");
}

export async function runAssessmentAnalysisAgent(learnerId: string): Promise<{
  riasecType:       string;
  riasecScores:     RiasecScores;
  topCareers:       string[];
  profileSummary:   string;
  strengthsSummary: string;
}> {
  const sessions = await prisma.learnerAssessmentSession.findMany({
    where:   { learnerId, status: "COMPLETED" },
    include: {
      answers: {
        include: { question: { select: { riasecMapping: true } } },
      },
    },
  });

  if (sessions.length < 4)
    throw new Error("All four assessments must be completed before analysis");

  // Compute RIASEC scores from INTEREST session answers
  const interestSession = sessions.find((s) => s.assessmentType === "INTEREST");
  const riasecScores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  if (interestSession) {
    for (const answer of interestSession.answers) {
      const mapping = answer.question?.riasecMapping ?? [];
      const score   = parseInt(answer.answerValue, 10) || 0;
      for (const code of mapping) {
        const key = code as keyof RiasecScores;
        if (key in riasecScores) riasecScores[key] += score;
      }
    }
  }

  const riasecType = computeRiasecTopCodes(riasecScores);

  const sessionSummary = sessions.map((s) => {
    const result = s.results as any;
    return `${s.assessmentType}: ${JSON.stringify(result ?? {})}`;
  }).join("\n");

  const matchingCareers = await prisma.career.findMany({
    where:   { status: "VERIFIED" },
    take:    20,
    select:  { id: true, title: true },
  });

  const careerList = matchingCareers.map((c) => c.title).join(", ");

  const message = await anthropic.messages.create({
    model:      "claude-opus-4-8",
    max_tokens: 1024,
    system:     `You are an expert career psychologist analysing South African learner assessment results.
Return ONLY valid JSON — no markdown.`,
    messages: [{
      role:    "user",
      content: `Analyse these assessment results and generate a learner career profile.

RIASEC type: ${riasecType}
RIASEC scores: ${JSON.stringify(riasecScores)}
Assessment results:
${sessionSummary}

Available verified careers: ${careerList}

Return JSON:
{
  "topCareers": string[] (3-5 career titles from the list above that best match),
  "profileSummary": string (2-3 sentences on work style and motivations),
  "strengthsSummary": string (key strengths, 2-3 sentences)
}`,
    }],
  });

  const raw    = (message.content[0] as any).text as string;
  const parsed = JSON.parse(raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim());

  await prisma.learnerProfile.upsert({
    where:  { learnerId },
    create: { learnerId, riasecType, riasecScores: riasecScores as any },
    update: { riasecType, riasecScores: riasecScores as any },
  });

  return {
    riasecType,
    riasecScores,
    topCareers:       parsed.topCareers ?? [],
    profileSummary:   parsed.profileSummary ?? "",
    strengthsSummary: parsed.strengthsSummary ?? "",
  };
}
