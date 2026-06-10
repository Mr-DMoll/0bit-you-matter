import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@repo/database";
import env from "../config/env.config.js";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export type GuidanceMessage = { role: "user" | "assistant"; content: string };

export async function runLearnerGuidanceAgent(
  learnerId: string,
  userMessage: string,
  history: GuidanceMessage[] = []
): Promise<string> {
  const learner = await prisma.user.findUnique({
    where:   { id: learnerId },
    include: {
      learnerProfile: {
        include: {
          chosenCareer: { select: { title: true, description: true } },
          savedCareers: { select: { title: true } },
        },
      },
      assessmentSessions: {
        where:   { status: "COMPLETED" },
        select:  { assessmentType: true, result: true },
        orderBy: { completedAt: "desc" },
      },
      grade: true,
    } as any,
  });

  const profile    = (learner as any)?.learnerProfile;
  const sessions   = (learner as any)?.assessmentSessions ?? [];
  const riasec     = profile?.riasecType ?? "Not assessed yet";
  const chosen     = profile?.chosenCareer?.title ?? "Not chosen yet";
  const grade      = (learner as any)?.grade ?? "Unknown";
  const savedNames = (profile?.savedCareers ?? []).map((c: any) => c.title).join(", ") || "None";

  const system = `You are a warm, encouraging career guidance counsellor for South African learners.
You are chatting with a Grade ${grade} learner.

Learner profile:
- RIASEC type: ${riasec}
- Chosen career: ${chosen}
- Saved careers: ${savedNames}
- Completed assessments: ${sessions.map((s: any) => s.assessmentType).join(", ") || "None"}

Guidelines:
- Speak in simple, clear English suitable for Grade 9–12
- Reference their RIASEC type and chosen career when relevant
- Suggest specific South African universities, bursaries and pathways when asked
- Be honest about APS requirements and subject choices
- Encourage without being dismissive of challenges
- Keep responses concise (3–5 sentences max unless detailed comparison requested)
- Never fabricate statistics — if unsure, say so and suggest they verify with a counsellor`;

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model:      "claude-opus-4-8",
    max_tokens: 512,
    system,
    messages,
  });

  return (response.content[0] as any).text as string;
}
