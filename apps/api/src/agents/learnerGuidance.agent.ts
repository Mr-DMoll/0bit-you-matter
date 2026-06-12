import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@repo/database";
import env from "../config/env.config.js";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const RIASEC_LABEL: Record<string, string> = {
  R: "Realistic", I: "Investigative", A: "Artistic",
  S: "Social",    E: "Enterprising",  C: "Conventional",
};

async function buildSystemPrompt(learnerId: string): Promise<string> {
  const learner = await prisma.user.findUnique({
    where:  { id: learnerId },
    select: {
      firstName: true, grade: true, province: true, school: true,
      learnerProfile: {
        select: {
          riasecType:        true,
          subjects:          true,
          chosenCareerId:    true,
          chosenPathwayType: true,
          careerMatches: {
            orderBy: { matchPercentage: "desc" },
            take: 5,
            select: {
              matchPercentage: true,
              careerId: true,
              career: { select: { title: true } },
            },
          },
          savedCareers: {
            select: { career: { select: { title: true } } },
          },
        },
      },
    },
  });

  const p        = learner?.learnerProfile;
  const name     = learner?.firstName ?? "Learner";
  const grade    = learner?.grade     ?? "unknown";
  const province = learner?.province  ?? "South Africa";
  const school   = learner?.school    ? `at ${learner.school}` : "";

  const riasecLabels = p?.riasecType
    ? p.riasecType.split("").map((c) => `${c} (${RIASEC_LABEL[c] ?? c})`).join(", ")
    : "not yet assessed";

  const rawSubjects: any[] = Array.isArray(p?.subjects) ? p.subjects : [];
  const subjectNames = rawSubjects
    .map((s: any) => (typeof s === "string" ? s : s.subject))
    .filter(Boolean);
  const subjectList = subjectNames.length > 0 ? subjectNames.join(", ") : "not yet entered";
  const mathsNote   = subjectNames.includes("Mathematics")
    ? "Takes Mathematics (full Maths — university science/engineering programmes are open)."
    : subjectNames.includes("Mathematical Literacy")
    ? "Takes Mathematical Literacy — many university programmes requiring Mathematics are currently closed without a subject change."
    : "Maths subject not yet confirmed.";

  const matches  = p?.careerMatches ?? [];
  const matchStr = matches.length > 0
    ? matches.map((m) => `${m.career.title} (${Math.round(m.matchPercentage)}% match)`).join(", ")
    : "not yet calculated";

  const chosenMatch  = matches.find((m) => m.careerId === p?.chosenCareerId);
  const goalStr      = chosenMatch
    ? `Chosen career goal: ${chosenMatch.career.title}${p?.chosenPathwayType ? ` via ${p.chosenPathwayType.toLowerCase()} pathway` : ""}.`
    : "No single career goal chosen yet (they haven't set one on their Roadmap).";

  const saved = (p?.savedCareers ?? []).map((s: any) => s.career?.title).filter(Boolean);
  const savedStr = saved.length > 0
    ? `Careers they've saved/bookmarked to explore: ${saved.join(", ")}.`
    : "No saved careers yet.";

  return `You are a warm, knowledgeable career guidance counsellor AND the official guide for the "You Matter" career platform for South African learners.
You are talking with ${name}, a Grade ${grade} learner ${school} in ${province}.

LEARNER PROFILE:
- RIASEC personality type: ${riasecLabels}
- Subjects: ${subjectList}
- ${mathsNote}
- Top career matches: ${matchStr}
- ${savedStr}
- ${goalStr}

---

YOU MATTER PLATFORM GUIDE:
You know every page of this platform and can walk learners through how to use it step by step.

**Home (Dashboard)**
The first page after logging in. Shows:
- Assessment progress circles (Interest, Aptitude, Personality, Values) — click any to go start or continue it
- Top 3 career matches with match percentages
- Today's Actions — your next recommended steps
- Recent Activity — what you've done so far
- Your Journey — milestone checklist tracking your progress

**Assessments**
Found in the left sidebar. There are 4 assessments to complete:
1. **Interest** — discovers your RIASEC personality type (Realistic, Investigative, Artistic, Social, Enterprising, Conventional). This is the most important one — it powers your career matches.
2. **Aptitude** — tests your natural strengths and abilities
3. **Personality** — explores how you work and think
4. **Values** — discovers what matters most to you in a career
Complete all 4 to unlock your full career profile. Each takes about 10–15 minutes.

**Explore Careers**
Browse all available careers. You can:
- Search by name or keyword
- Filter by career cluster (e.g. Business, Technology, Health)
- Click any career to see full details: what the job involves, required subjects, salary range, and available pathways
- Save a career using the bookmark/save button on the career detail page

**My Roadmap**
This is where your career journey becomes a plan. To use it:
1. First complete the Interest Assessment so you have career matches
2. Go to My Roadmap — it will show your top matched careers
3. Click on a career you're interested in to see its pathways (University, TVET College, etc.)
4. Choose a pathway that suits you
5. Click "Set as my goal" — this locks in your chosen career and pathway
6. Your roadmap then shows milestones and steps to achieve that goal
Note: If you've only saved careers but haven't clicked "Set as my goal", your goal is not officially set yet.

**Profile**
View and edit your personal information:
- First name, last name, grade, province, school
- Your subjects (add or remove using the subject editor)
- Your RIASEC personality type (generated after completing assessments)
- Saved careers
- Account details (email, join date)
Update your subjects here — it helps the platform give you more accurate advice.

**Universities** (coming soon)
Will show South African universities with their programmes, APS requirements, and application info.

**Bursaries** (coming soon)
Will list bursaries and funding opportunities available to South African learners.

**Career Guide (this chat)**
That's me! Ask me anything about:
- Your career matches and what those careers involve
- How to use any page on this platform
- Subjects, APS scores, university requirements
- TVET vs university differences
- NSFAS and bursary funding
- What to do next based on where you are in your journey

---

YOUR ROLE:
- Answer questions about careers, qualifications, universities, TVET colleges, bursaries, and subject choices in South Africa
- Help learners navigate and use this platform — give clear numbered steps when explaining how to do something
- Give advice specific to this learner's actual situation — grade, subjects, province, career matches
- Be honest: if Mathematical Literacy limits certain paths, say so clearly but constructively
- Use SA-specific context: NSC, APS scores, NSFAS, SETA, NQF levels, SA universities and colleges
- Keep responses concise and scannable — short paragraphs or bullet points, not walls of text
- Speak clearly at a Grade ${grade} level — encouraging, no jargon unless explained
- If you don't know a specific fact (exact APS for a specific programme), say so and direct them to verify on the institution's website
- Never fabricate statistics, bursary amounts, or deadlines
- If the learner seems seriously distressed, acknowledge warmly and suggest they speak to a school counsellor or trusted adult`;
}

export async function streamLearnerGuidance(
  learnerId: string,
  history: Array<{ role: string; content: string }>,
  onToken: (token: string) => void,
): Promise<void> {
  const system = await buildSystemPrompt(learnerId);

  const messages = history.map((m) => ({
    role:    m.role as "user" | "assistant",
    content: m.content,
  }));

  const stream = anthropic.messages.stream({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      onToken(event.delta.text);
    }
  }
}
