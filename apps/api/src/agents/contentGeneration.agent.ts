import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@repo/database";
import env from "../config/env.config.js";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

type ContentType = "CAREER" | "UNIVERSITY_PROGRAMME" | "UNIVERSITY_PROGRAMMES_BULK" | "TVET_PROGRAMMES_BULK" | "PATHWAY" | "BURSARY" | "ASSESSMENT_QUESTION" | "ASSESSMENT_QUESTIONS_BULK";

const DEFAULT_SYSTEM: Record<ContentType, string> = {
  CAREER: `You are an expert career guidance counsellor for South African learners in Grades 9–12.
Generate accurate, factual career profiles based on the South African labour market.
Always return valid JSON matching the schema provided. Never fabricate institutions or statistics.`,

  UNIVERSITY_PROGRAMME: `You are an expert on South African higher education.
Generate accurate university programme data based on official prospectus information.
Always return valid JSON. Use APS scoring: 80%=7, 70%=6, 60%=5, 50%=4, 40%=3, 30%=2, <30%=1.`,

  TVET_PROGRAMMES_BULK: `You are an expert on South African TVET (Technical and Vocational Education and Training) colleges with comprehensive knowledge of DHET's national NCV and NATED programme frameworks.
Generate a complete, accurate list of programmes offered at the specified TVET college.
Include both NCV (National Certificate Vocational, Levels 2–4) and NATED (N1–N6) programmes.
Base your response on DHET official programme frameworks. The NCV and NATED programme lists are nationalised — all public TVET colleges offer the core fields.
Always return valid JSON as an array. Source: dhet.gov.za`,

  PATHWAY: `You are a South African career guidance expert with deep knowledge of all qualification routes available to SA Grade 9–12 learners.
Generate a detailed career pathway for the specified career and pathway type (UNIVERSITY, TVET, LEARNERSHIP, or DIRECT).
Include practical, accurate information about SA-specific funding (NSFAS, SETA bursaries), SETAs for learnerships, and realistic entry requirements.
Always return valid JSON matching the schema provided.`,

  UNIVERSITY_PROGRAMMES_BULK: `You are an expert on South African higher education with comprehensive knowledge of all public universities' official prospectuses.
Generate a complete, accurate list of undergraduate degree programmes offered at the specified university.
Always return valid JSON as an array. Use APS scoring: 80%=7, 70%=6, 60%=5, 50%=4, 40%=3, 30%=2, <30%=1.
Base your response on the official university prospectus. Include all major undergraduate qualifications (Bachelor degrees, BTech, BEd, BNurs, etc).`,

  BURSARY: `You are an expert on South African bursaries and financial aid for students.
Generate accurate bursary information based on publicly available South African data.
Always return valid JSON. Do not fabricate deadlines or amounts.`,

  ASSESSMENT_QUESTION: `You are an expert psychometrician specialising in RIASEC career assessments for South African youth.
Generate assessment questions appropriate for Grades 9–12 learners.
Always return valid JSON with the question, options array, and correct scoring type.`,

  ASSESSMENT_QUESTIONS_BULK: `You are a registered psychometrician and career guidance expert specialising in South African youth (Grades 9–12).
You design psychometrically valid career assessment questions grounded in Holland's RIASEC theory and adapted for the SA context.
Each question must be culturally relevant, age-appropriate, free of bias, and clearly worded for a learner with English as a second language.
Return ONLY a valid JSON array — no markdown, no explanation.`,
};

const OUTPUT_SCHEMA: Record<ContentType, string> = {
  CAREER: `{
  "title": string,
  "overview": string (2-3 paragraphs suitable for Grade 9-12),
  "dayInTheLife": string,
  "howToGetThere": string,
  "nqfLevelMin": number (1-10),
  "earningsMin": number (ZAR annual),
  "earningsMax": number (ZAR annual),
  "earningsNote": string,
  "riasecCodes": string[] (1-3 codes e.g. ["R","I","A"])
}`,

  UNIVERSITY_PROGRAMME: `{
  "name": string,
  "faculty": string,
  "duration": string,
  "nqfLevel": number (5-10),
  "apsRequired": number (1-7 APS scale),
  "subjectRequirements": string,
  "description": string
}`,

  TVET_PROGRAMMES_BULK: `Return ONLY a JSON array (no wrapper object). Each element:
{
  "name": string (full programme name e.g. "NCV Engineering Studies Level 4" or "NATED Electrical Engineering N3"),
  "programmeType": "NCV" | "NATED" | "OCCUPATIONAL",
  "field": string (e.g. "Engineering Studies", "Business Studies", "Information Technology", "Hospitality"),
  "ncvLevel": number | null (2, 3, or 4 for NCV; null for NATED),
  "natedLevel": string | null ("N1"–"N6" for NATED; null for NCV),
  "duration": number (months, e.g. 12 for one year),
  "entryRequirement": string (e.g. "Grade 9 pass" or "Grade 11 with Mathematics"),
  "careerOutcomes": string[] (2–4 careers this leads to),
  "subjectRequirements": string (key subjects needed)
}
Include all NCV fields (L2, L3, L4) and all NATED streams (N1–N6) the college offers. Return only the array, no other text.`,

  PATHWAY: `{
  "title": string (descriptive e.g. "Become an Electrician via TVET N1–N6 + Trade Test"),
  "durationLabel": string (e.g. "3–4 years"),
  "durationMonths": number,
  "estimatedCostMin": number (ZAR per year),
  "estimatedCostMax": number (ZAR per year),
  "costNote": string (e.g. "NSFAS covers fees for qualifying students"),
  "earnWhileLearn": boolean,
  "entryRequirements": string,
  "apsMin": number | null,
  "gradeMin": number | null (minimum school grade, e.g. 9),
  "steps": [{ "step": number, "title": string, "description": string, "duration": string }],
  "fundingOptions": string[] (e.g. ["NSFAS", "MERSETA Bursary"]),
  "setaName": string | null (for LEARNERSHIP type),
  "qualificationEarned": string,
  "nqfLevelEarned": number | null,
  "employmentNote": string,
  "pros": string[] (3–5 plain-language advantages),
  "cons": string[] (2–4 honest trade-offs)
}`,

  UNIVERSITY_PROGRAMMES_BULK: `Return ONLY a JSON array (no wrapper object). Each element:
{
  "name": string (full qualification name e.g. "Bachelor of Science in Computer Science"),
  "faculty": string (e.g. "Faculty of Science"),
  "duration": number (years, e.g. 3),
  "nqfLevel": number (5-10),
  "apsMin": number (minimum APS on 1-7 scale),
  "subjectRequirements": string (e.g. "Mathematics 5, Physical Science 4, English 4")
}
Include 25-50 programmes covering all faculties. Return only the array, no other text.`,

  BURSARY: `{
  "name": string,
  "provider": string,
  "amount": number (ZAR annual, null if variable),
  "sector": string,
  "eligibilityCriteria": string,
  "applicationDeadline": string (ISO date or null),
  "applicationUrl": string (null if unknown),
  "description": string
}`,

  ASSESSMENT_QUESTION: `{
  "questionText": string,
  "assessmentType": "INTEREST" | "APTITUDE" | "PERSONALITY" | "VALUES",
  "options": [{"label": string, "value": string, "score": number}] (4 options),
  "riasecMapping": string[] (RIASEC letters this question maps to, empty array if not RIASEC),
  "contextNote": string | null
}`,

  ASSESSMENT_QUESTIONS_BULK: `Return ONLY a JSON array of exactly {{count}} questions. Each element:
{
  "questionText": string (clear, plain English, max 25 words),
  "contextNote": string | null (optional SA-relevant scenario, e.g. "You are helping at a community clinic."),
  "assessmentType": "{{assessmentType}}",
  "riasecMapping": string[] (for INTEREST: 1-2 RIASEC codes ["R","I","A","S","E","C"]; for others: []),
  "options": [
    { "label": string (short answer text, max 10 words), "value": string (A/B/C/D), "score": number (1-5) }
  ] (exactly 4 options, ordered from least to most aligned with the trait)
}

ASSESSMENT TYPE GUIDANCE:
- INTEREST: "I enjoy / I like / I prefer / Would you rather…" — maps to RIASEC codes. Each question targets 1-2 codes. Cover all 6 codes proportionally.
- APTITUDE: Tests logical/numerical/verbal/spatial ability with a correct answer (score 1=wrong, 5=correct). Use simple SA scenarios (spaza shop pricing, taxi routes, garden measurements).
- PERSONALITY: Work-style traits — structured vs. spontaneous, alone vs. team, leader vs. follower. No right/wrong (score 1-5 on a trait axis).
- VALUES: Career values — income, job security, helping others, creativity, status, independence. Reveals what motivates the learner (score 1-5 importance).

Generate questions that AVOID:
- Gender/cultural bias
- Urban-only contexts (include rural/township)
- Advanced vocabulary
- Obvious "correct" answers that learners game

Return only the array, no other text.`,
};

export async function runContentGenerationAgent(jobId: string): Promise<void> {
  const job = await prisma.generationJob.findUnique({
    where:   { id: jobId },
    include: { promptTemplate: true },
  });

  if (!job) throw new Error(`Generation job ${jobId} not found`);

  await prisma.generationJob.update({
    where: { id: jobId },
    data:  { status: "PROCESSING", startedAt: new Date() },
  });

  try {
    const contentType = job.contentType as ContentType;
    const params      = (job.parameters as Record<string, any>) ?? {};

    const userPromptBase = job.promptTemplate?.userPrompt
      ?? buildDefaultPrompt(contentType, params);

    const filledPrompt = Object.entries(params).reduce(
      (p, [k, v]) => p.replaceAll(`{{${k}}}`, String(v)),
      userPromptBase
    );

    const systemPrompt = job.promptTemplate?.systemPrompt
      ?? `${DEFAULT_SYSTEM[contentType]}\n\nOutput schema (return ONLY valid JSON, no markdown):\n${OUTPUT_SCHEMA[contentType]}`;

    const LARGE_OUTPUT = ["UNIVERSITY_PROGRAMMES_BULK", "TVET_PROGRAMMES_BULK", "ASSESSMENT_QUESTIONS_BULK"];
    const MEDIUM_OUTPUT = ["PATHWAY", "CAREER"];
    const max_tokens = LARGE_OUTPUT.includes(contentType) ? 8192
      : MEDIUM_OUTPUT.includes(contentType) ? 4096
      : 2048;

    const message = await anthropic.messages.create({
      model:      "claude-opus-4-8",
      max_tokens,
      system:     systemPrompt,
      messages:   [{ role: "user", content: filledPrompt }],
    });

    const raw = (message.content[0] as any).text as string;
    // Strip markdown code fences (```json ... ``` or ``` ... ```)
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      // If truncated, try to extract the largest valid JSON object/array from the response
      const objMatch = cleaned.match(/(\{[\s\S]*\})/);
      const arrMatch = cleaned.match(/(\[[\s\S]*\])/);
      const candidate = (objMatch?.[1] ?? "") || (arrMatch?.[1] ?? "");
      if (!candidate) throw new Error(`Claude returned invalid JSON. Raw (first 500 chars): ${cleaned.slice(0, 500)}`);
      try {
        parsed = JSON.parse(candidate);
      } catch {
        throw new Error(`Claude returned unparseable JSON. Raw (first 500 chars): ${cleaned.slice(0, 500)}`);
      }
    }

    let outputCareerId: string | undefined;

    if (contentType === "UNIVERSITY_PROGRAMME") {
      const { universityId } = params;
      if (!universityId) throw new Error("universityId is required in parameters for UNIVERSITY_PROGRAMME generation");

      await prisma.programme.create({
        data: {
          universityId,
          name:               parsed.name,
          faculty:            parsed.faculty,
          duration:           parsed.duration ? parseInt(String(parsed.duration)) : undefined,
          nqfLevel:           parsed.nqfLevel,
          apsMin:             parsed.apsRequired ?? parsed.apsMin,
          subjectRequirements: parsed.subjectRequirements,
          status:             "AI_GENERATED",
        },
      });
    }

    if (contentType === "UNIVERSITY_PROGRAMMES_BULK") {
      const { universityId } = params;
      if (!universityId) throw new Error("universityId is required for UNIVERSITY_PROGRAMMES_BULK generation");

      // parsed is an array of programmes
      const programmes: any[] = Array.isArray(parsed) ? parsed : [];
      if (programmes.length === 0) throw new Error("AI returned no programmes — check the prompt or try again");

      await prisma.programme.createMany({
        data: programmes.map((p: any) => ({
          universityId,
          name:                p.name,
          faculty:             p.faculty,
          duration:            p.duration ? parseInt(String(p.duration)) : undefined,
          nqfLevel:            p.nqfLevel  ? parseInt(String(p.nqfLevel)) : undefined,
          apsMin:              p.apsMin    ? parseInt(String(p.apsMin))   : undefined,
          subjectRequirements: p.subjectRequirements,
          status:              "AI_GENERATED",
        })),
        skipDuplicates: true,
      });

      console.log(`[ContentGenAgent] Bulk saved ${programmes.length} programmes for university ${universityId}`);
    }

    if (contentType === "TVET_PROGRAMMES_BULK") {
      const { collegeId } = params;
      if (!collegeId) throw new Error("collegeId is required for TVET_PROGRAMMES_BULK generation");

      const programmes: any[] = Array.isArray(parsed) ? parsed : [];
      if (programmes.length === 0) throw new Error("AI returned no TVET programmes — check the prompt or try again");

      await prisma.tvetProgramme.createMany({
        data: programmes.map((p: any) => ({
          collegeId,
          name:                p.name,
          programmeType:       p.programmeType ?? "NCV",
          field:               p.field ?? "General",
          ncvLevel:            p.ncvLevel   ? parseInt(String(p.ncvLevel))  : undefined,
          natedLevel:          p.natedLevel ?? undefined,
          duration:            p.duration   ? parseInt(String(p.duration))  : undefined,
          entryRequirement:    p.entryRequirement,
          careerOutcomes:      Array.isArray(p.careerOutcomes) ? p.careerOutcomes : [],
          subjectRequirements: p.subjectRequirements,
          status:              "AI_GENERATED",
        })),
        skipDuplicates: true,
      });
      console.log(`[ContentGenAgent] Bulk saved ${programmes.length} TVET programmes for college ${collegeId}`);
    }

    if (contentType === "PATHWAY") {
      const { careerId } = params;
      if (!careerId) throw new Error("careerId is required for PATHWAY generation");

      await prisma.pathway.create({
        data: {
          careerId,
          type:               params.pathwayType,
          title:              parsed.title,
          durationLabel:      parsed.durationLabel,
          durationMonths:     parsed.durationMonths ? parseInt(String(parsed.durationMonths)) : undefined,
          estimatedCostMin:   parsed.estimatedCostMin,
          estimatedCostMax:   parsed.estimatedCostMax,
          costNote:           parsed.costNote,
          earnWhileLearn:     parsed.earnWhileLearn ?? false,
          entryRequirements:  parsed.entryRequirements,
          apsMin:             parsed.apsMin,
          gradeMin:           parsed.gradeMin,
          steps:              parsed.steps,
          fundingOptions:     Array.isArray(parsed.fundingOptions) ? parsed.fundingOptions : [],
          setaName:           parsed.setaName,
          qualificationEarned: parsed.qualificationEarned,
          nqfLevelEarned:     parsed.nqfLevelEarned,
          employmentNote:     parsed.employmentNote,
          pros:               Array.isArray(parsed.pros) ? parsed.pros : [],
          cons:               Array.isArray(parsed.cons) ? parsed.cons : [],
          status:             "AI_GENERATED",
        },
      });
      console.log(`[ContentGenAgent] Pathway saved for career ${careerId} type ${params.pathwayType}`);
    }

    if (contentType === "BURSARY") {
      await prisma.bursary.create({
        data: {
          name:               parsed.name,
          provider:           parsed.provider,
          description:        parsed.description,
          amount:             parsed.amount ? String(parsed.amount) : null,
          fieldsOfStudy:      Array.isArray(parsed.fieldsOfStudy) ? parsed.fieldsOfStudy : (parsed.sector ? [parsed.sector] : []),
          eligibilityCriteria: parsed.eligibilityCriteria ? { raw: parsed.eligibilityCriteria } : {},
          applicationUrl:     parsed.applicationUrl ?? null,
          closeDate:          parsed.applicationDeadline ? new Date(parsed.applicationDeadline) : null,
          sourceUrl:          null,
          status:             "AI_GENERATED",
        },
      });
      console.log(`[ContentGenAgent] Bursary saved: ${parsed.name}`);
    }

    if (contentType === "ASSESSMENT_QUESTION") {
      const questionType = parsed.assessmentType ?? params.type ?? "INTEREST";
      const maxOrder = await prisma.assessmentQuestion.aggregate({
        where: { assessmentType: questionType },
        _max:  { orderIndex: true },
      });
      await prisma.assessmentQuestion.create({
        data: {
          assessmentType: questionType,
          questionText:   parsed.questionText,
          contextNote:    parsed.contextNote ?? null,
          riasecMapping:  Array.isArray(parsed.riasecMapping) ? parsed.riasecMapping : [],
          options:        parsed.options ?? [],
          orderIndex:     (maxOrder._max.orderIndex ?? 0) + 1,
          status:         "AI_GENERATED",
        },
      });
      console.log(`[ContentGenAgent] Assessment question saved: ${questionType}`);
    }

    if (contentType === "ASSESSMENT_QUESTIONS_BULK") {
      const questionType = params.assessmentType ?? "INTEREST";
      const questions: any[] = Array.isArray(parsed) ? parsed : [];
      if (questions.length === 0) throw new Error("AI returned no questions");

      // Get current max orderIndex so new questions continue from where the bank left off
      const maxOrder = await prisma.assessmentQuestion.aggregate({
        where: { assessmentType: questionType },
        _max:  { orderIndex: true },
      });
      let nextIndex = (maxOrder._max.orderIndex ?? 0) + 1;

      await prisma.assessmentQuestion.createMany({
        data: questions.map((q: any) => ({
          assessmentType: questionType,
          questionText:   q.questionText,
          contextNote:    q.contextNote ?? null,
          riasecMapping:  Array.isArray(q.riasecMapping) ? q.riasecMapping : [],
          options:        q.options ?? [],
          orderIndex:     nextIndex++,
          status:         "AI_GENERATED",
        })),
        skipDuplicates: false,
      });
      console.log(`[ContentGenAgent] Bulk saved ${questions.length} ${questionType} questions`);
    }

    if (contentType === "CAREER") {
      const defaultCluster = await prisma.careerCluster.findFirst();
      if (!defaultCluster) throw new Error("No career clusters exist — seed at least one before generating careers");

      const career = await prisma.career.create({
        data: {
          title:       parsed.title,
          slug:        parsed.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          clusterId:   params.clusterId ?? defaultCluster.id,
          overview:    parsed.overview,
          dayInTheLife:  parsed.dayInTheLife,
          howToGetThere: parsed.howToGetThere,
          nqfLevelMin:   parsed.nqfLevelMin,
          earningsMin:   parsed.earningsMin,
          earningsMax:   parsed.earningsMax,
          earningsNote:  parsed.earningsNote,
          riasecCodes:   parsed.riasecCodes ?? [],
          status:        "AI_GENERATED",
        },
      });
      outputCareerId = career.id;
    }

    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status:        "COMPLETED",
        result:        parsed,
        outputCareerId,
        completedAt:   new Date(),
        errorLog:      null,
      },
    });

    console.log(`[ContentGenAgent] Job ${jobId} completed — ${contentType}`);
  } catch (err: any) {
    await prisma.generationJob.update({
      where: { id: jobId },
      data:  { status: "FAILED", errorLog: err?.message ?? String(err), completedAt: new Date() },
    });
    throw err;
  }
}

function buildDefaultPrompt(type: ContentType, params: Record<string, any>): string {
  switch (type) {
    case "CAREER": {
      const clusterLine = params.clusterName
        ? `IMPORTANT: This career MUST belong to the "${params.clusterName}" cluster. Do not generate a career from any other industry or field.`
        : "";
      const titleLine = params.title
        ? `Career to generate: ${params.title}`
        : `Choose a career that genuinely belongs in the "${params.clusterName ?? "given"}" cluster. Do NOT pick careers from other fields.`;
      return `${clusterLine}\n\n${titleLine}\n\nGenerate a comprehensive, accurate career profile for South African Grade 9–12 learners.`;
    }
    case "UNIVERSITY_PROGRAMME":
      return `Generate programme details for: ${params.name ?? "a South African university programme"} at ${params.university ?? "a South African university"}.`;
    case "TVET_PROGRAMMES_BULK":
      return `Generate the complete list of NCV and NATED programmes offered at ${params.college ?? "this South African TVET college"}.
Include ALL NCV fields (Levels 2, 3, and 4) and ALL NATED streams (N1 through N6) the college offers.
Common NCV fields: Engineering Studies, Business Studies, Information Technology, Hospitality, Education & Development, Finance, Economics & Accounting, Electrical Infrastructure Construction, Civil Engineering & Building Construction, Primary Agriculture.
Common NATED fields: Engineering (Electrical/Mechanical/Civil), Business Management, Marketing Management, Financial Management, Human Resource Management.
For each programme include: full name, programme type (NCV/NATED), field, level, duration in months, entry requirement, career outcomes, and subject requirements.
Source: DHET national programme frameworks (dhet.gov.za).
Return ONLY a valid JSON array with no surrounding text or markdown.`;
    case "PATHWAY":
      return `Generate a detailed ${params.pathwayType ?? "career"} pathway for someone who wants to become a ${params.careerTitle ?? "professional"} in South Africa.
Pathway type: ${params.pathwayType}
Career: ${params.careerTitle}
${params.pathwayType === "LEARNERSHIP" ? `SETA responsible for this sector: ${params.setaName ?? "identify the correct SETA"}` : ""}
${params.pathwayType === "TVET" ? "Include the specific N-levels or NCV levels and the trade test if applicable." : ""}
Include realistic SA-specific details: NSFAS eligibility, SETA funding, typical employer absorption rates, NQF levels.
Be honest about trade-offs in the cons section.
Return ONLY valid JSON matching the schema, no markdown.`;
    case "UNIVERSITY_PROGRAMMES_BULK":
      return `Generate the complete list of undergraduate degree programmes offered at ${params.university ?? "this South African university"}.
Include all Bachelor degrees, BTech, BEd, BNurs, BAdmin, and other undergraduate qualifications across ALL faculties.
For each programme include: full name, faculty, duration in years, NQF level, minimum APS score, and key subject requirements.
Return ONLY a valid JSON array with no surrounding text or markdown.`;
    case "BURSARY":
      return `Generate bursary details for: ${params.name ?? "a South African bursary"} provided by ${params.provider ?? "a South African organisation"}.`;
    case "ASSESSMENT_QUESTION":
      return `Generate a ${params.type ?? "INTEREST"} assessment question suitable for South African learners aged 14-18.`;
    case "ASSESSMENT_QUESTIONS_BULK":
      return `Generate ${params.count ?? 25} ${params.assessmentType ?? "INTEREST"} assessment questions for South African Grade 9–12 learners.
Requirements:
- Culturally inclusive — use both urban and rural/township SA contexts
- Plain English — learners may have English as a second language
- Psychometrically varied — don't repeat the same theme
- For INTEREST: distribute questions across all 6 RIASEC codes (R, I, A, S, E, C) — roughly equal coverage
- For APTITUDE: mix numerical (simple arithmetic, percentages), verbal (word meaning, sentence logic), and spatial (pattern/shape) questions
- For PERSONALITY: cover key work-style dimensions — structured/spontaneous, collaborative/independent, risk-taking/cautious, detail/big-picture
- For VALUES: cover income, job security, helping community, creativity, status/recognition, work-life balance, independence
Return ONLY the JSON array, no markdown, no surrounding text.`;
  }
}
