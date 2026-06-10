/**
 * Bursary Scraper Agent
 * ─────────────────────
 * Fetches a bursary listing page, strips HTML to readable text, then asks
 * Claude to extract every bursary it finds into a structured list. Results
 * are deduped against the database and saved as AI_GENERATED bursaries ready
 * for the review queue.
 */

import axios      from "axios";
import Anthropic  from "@anthropic-ai/sdk";
import { prisma } from "@repo/database";
import env        from "../config/env.config.js";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// ── Known SA bursary sources ─────────────────────────────────────────────────

export const SA_BURSARY_SOURCES: BursarySource[] = [
  // ── Aggregator sites (stable URLs, scrape-friendly) ───────────────────────
  {
    key:         "zabursaries",
    label:       "ZA Bursaries",
    url:         "https://www.zabursaries.co.za/bursaries-south-africa/",
    description: "Comprehensive SA bursary aggregator listing 100+ bursaries",
    mode:        "scrape",
  },
  {
    key:         "bursariesportal",
    label:       "Bursaries Portal",
    url:         "https://www.bursariesportal.co.za/bursaries/",
    description: "Portal listing SA corporate and government bursaries",
    mode:        "scrape",
  },
  {
    key:         "sascholarships",
    label:       "SA Scholarships",
    url:         "https://www.sascholarships.co.za/bursaries/",
    description: "SA scholarships and bursaries directory",
    mode:        "scrape",
  },
  // ── Knowledge-based sources (corporate sites change URLs frequently) ──────
  // Claude is prompted with the provider name; it returns structured data from
  // its training knowledge. These are marked as AI_GENERATED for review.
  {
    key:         "nsfas",
    label:       "NSFAS",
    url:         "https://www.nsfas.org.za",
    description: "National Student Financial Aid Scheme — government funding for poor and working-class students",
    mode:        "knowledge",
  },
  {
    key:         "eskom",
    label:       "Eskom",
    url:         "https://www.eskom.co.za",
    description: "Eskom Engineering, IT and Finance bursaries",
    mode:        "knowledge",
  },
  {
    key:         "sasol",
    label:       "Sasol",
    url:         "https://www.sasol.com",
    description: "Sasol Engineering and Science bursaries for SA students",
    mode:        "knowledge",
  },
  {
    key:         "angloamerican",
    label:       "Anglo American",
    url:         "https://www.angloamerican.com",
    description: "Anglo American bursaries — Mining, Engineering, Finance",
    mode:        "knowledge",
  },
  {
    key:         "transnet",
    label:       "Transnet",
    url:         "https://www.transnet.net",
    description: "Transnet Engineering and Logistics bursaries",
    mode:        "knowledge",
  },
  {
    key:         "merseta",
    label:       "MERSETA",
    url:         "https://www.merseta.org.za",
    description: "Manufacturing, Engineering and Related Services SETA bursaries",
    mode:        "knowledge",
  },
  {
    key:         "agriseta",
    label:       "AgriSETA",
    url:         "https://www.agriseta.co.za",
    description: "Agricultural sector education and training bursaries",
    mode:        "knowledge",
  },
  {
    key:         "nedbank",
    label:       "Nedbank",
    url:         "https://www.nedbank.co.za",
    description: "Nedbank Finance and Banking bursaries",
    mode:        "knowledge",
  },
  {
    key:         "fnb",
    label:       "FNB",
    url:         "https://www.fnb.co.za",
    description: "First National Bank bursaries for Commerce and IT",
    mode:        "knowledge",
  },
  {
    key:         "absa",
    label:       "ABSA",
    url:         "https://www.absa.co.za",
    description: "ABSA Bank bursaries for Finance, IT and Commerce",
    mode:        "knowledge",
  },
];

export interface BursarySource {
  key:         string;
  label:       string;
  url:         string;
  description: string;
  mode:        "scrape" | "knowledge"; // scrape = fetch URL; knowledge = use Claude training data
}

export interface ScrapedBursary {
  name:               string;
  provider:           string;
  description:        string;
  amount:             string | null;
  fieldsOfStudy:      string[];
  eligibilityCriteria: Record<string, any>;
  applicationUrl:     string | null;
  openDate:           string | null;  // ISO date string or null
  closeDate:          string | null;  // ISO date string or null
  sourceUrl:          string;
}

export interface BursaryScraperResult {
  sourceKey:   string;
  sourceLabel: string;
  sourceUrl:   string;
  scraped:     number;
  saved:       number;
  skipped:     number;
  errors:      string[];
  bursaries:   ScrapedBursary[];
}

// ── HTML → plain text ─────────────────────────────────────────────────────────

function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&#\d+;/g, " ").replace(/&\w+;/g, " ")
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}

// ── Fetch page text — direct axios first, Jina Reader as fallback ─────────────
// Jina Reader (r.jina.ai) renders JS-heavy SPAs server-side.
// We try direct first since it's faster and avoids external DNS dependency.

async function fetchPageText(url: string): Promise<{ text: string; method: string }> {
  // ── Attempt 1: direct HTTP fetch ─────────────────────────────────────────
  try {
    const response = await axios.get(url, {
      timeout:      15000,
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept":     "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-ZA,en;q=0.9",
      },
    });
    const text = htmlToText(response.data as string).slice(0, 20000);
    if (text.length >= 500) {
      return { text, method: "direct" };
    }
    // Too short — site is probably JS-rendered, fall through to Jina
    console.log(`[BursaryScraperAgent] Direct fetch too short (${text.length} chars), trying Jina…`);
  } catch (err: any) {
    console.log(`[BursaryScraperAgent] Direct fetch failed (${err.message}), trying Jina…`);
  }

  // ── Attempt 2: Jina Reader (handles SPAs, JS-rendered pages) ─────────────
  const jinaUrl = `https://r.jina.ai/${url}`;
  const response = await axios.get(jinaUrl, {
    timeout: 35000,
    headers: {
      "Accept":          "text/plain",
      "User-Agent":      "Mozilla/5.0 (compatible; YouMatter-Bot/1.0)",
      "X-Return-Format": "markdown",
    },
  });
  const text = (response.data as string).trim().slice(0, 20000);
  return { text, method: "jina" };
}

// ── Knowledge-based extraction (no web scraping) ─────────────────────────────
// For providers whose websites are JS-heavy or have unstable URLs, ask Claude
// directly to list bursaries from its training knowledge.

async function extractBursariesFromKnowledge(provider: string, providerUrl: string): Promise<ScrapedBursary[]> {
  const currentYear = new Date().getFullYear();

  const message = await anthropic.messages.create({
    model:      "claude-haiku-4-5",
    max_tokens: 4096,
    system: `You are a South African education data assistant with detailed knowledge of SA bursaries and financial aid.
CRITICAL: Your ENTIRE response must be a valid JSON array starting with [ and ending with ]. No preamble, no explanation, no markdown, no code fences.
Dates must be ISO format (YYYY-MM-DD) or null. Use ${currentYear} as current year.
Fields of study: use broad categories — Engineering, Science, Commerce, Law, Education, Health Sciences, Agriculture, IT, Arts, Humanities, Built Environment, Social Sciences, Mining.
IMPORTANT ON URLs: applicationUrl must be the SPECIFIC bursary/careers page URL — NOT the company homepage. For example: "https://www.eskom.co.za/careers/bursaries" NOT "https://www.eskom.co.za". If you do not know the specific bursary page URL with confidence, set applicationUrl to null. Do NOT guess URLs.
If you are not confident a bursary programme actually exists and is active, do NOT include it. Only include programmes you have reliable knowledge of.
If you don't know about this provider's bursaries, respond with exactly: []`,
    messages: [{
      role:    "user",
      content: `List bursary programmes offered by ${provider} (${providerUrl}) to South African students that you have reliable knowledge of.

IMPORTANT: Only include a bursary if you are confident it EXISTS. Include the specific careers/bursaries page URL if you know it — this is crucial for reviewers to verify the bursary is real.

For each bursary, return:
{
  "name": "Official bursary programme name",
  "provider": "${provider}",
  "description": "What it covers, who qualifies, what fields (2-3 sentences)",
  "amount": "Approximate value or 'Full cost of study' or null if unknown",
  "fieldsOfStudy": ["Engineering", "Science"],
  "eligibilityCriteria": {
    "citizenship": "South African citizen" or null,
    "academicMinimum": "e.g. 65% average" or null,
    "yearOfStudy": "1st year" or "Any" or null,
    "financialNeed": true/false or null,
    "other": "any additional criteria"
  },
  "applicationUrl": "SPECIFIC bursary page URL you know with confidence, or null",
  "openDate": "YYYY-MM-DD or null",
  "closeDate": "YYYY-MM-DD or null",
  "sourceUrl": "${providerUrl}"
}

Return a JSON array. If not confident about any bursaries for ${provider}, return [].`,
    }],
  });

  const raw = (message.content[0] as any).text as string;

  const arrayStart = raw.indexOf("[");
  const arrayEnd   = raw.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try { return JSON.parse(raw.slice(arrayStart, arrayEnd + 1)); } catch { /* fall through */ }
  }
  return JSON.parse(raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim());
}

// ── Claude extraction ─────────────────────────────────────────────────────────

async function extractBursaries(pageText: string, sourceUrl: string): Promise<ScrapedBursary[]> {
  const currentYear = new Date().getFullYear();

  const message = await anthropic.messages.create({
    model:      "claude-haiku-4-5",
    max_tokens: 4096,
    system: `You are a South African education data extractor. Extract structured bursary data from web page text.
Only extract real, verifiable bursaries. If a field is unknown, use null.
CRITICAL: Your ENTIRE response must be a valid JSON array starting with [ and ending with ]. No preamble, no explanation, no markdown, no code fences.
Dates must be ISO format (YYYY-MM-DD) or null. Use current year ${currentYear} for relative dates like "closes 31 March".
Fields of study: use broad categories only — Engineering, Science, Commerce, Law, Education, Health Sciences, Agriculture, IT, Arts, Humanities, Built Environment, Social Sciences, Mining.
If no bursaries found, respond with exactly: []`,
    messages: [{
      role:    "user",
      content: `Extract ALL bursaries mentioned in this page text. For each, return:
{
  "name": "Official bursary name",
  "provider": "Company/organisation providing it",
  "description": "What it covers and who it's for (2-3 sentences)",
  "amount": "e.g. 'Up to R80 000/year' or 'Full tuition + accommodation' or null",
  "fieldsOfStudy": ["Engineering", "Science"],
  "eligibilityCriteria": {
    "citizenship": "South African citizen" or null,
    "academicMinimum": "60% average" or null,
    "yearOfStudy": "1st year" or "Any" or null,
    "financialNeed": true/false or null,
    "other": "any other criteria"
  },
  "applicationUrl": "direct application URL or null",
  "openDate": "YYYY-MM-DD or null",
  "closeDate": "YYYY-MM-DD or null",
  "sourceUrl": "${sourceUrl}"
}

Page text:
${pageText}

Return a JSON array. If no bursaries found, return [].`,
    }],
  });

  const raw = (message.content[0] as any).text as string;

  // Robustly extract the JSON array — Claude sometimes wraps it in markdown, adds
  // preamble text, or uses single quotes. Try multiple strategies:

  // Strategy 1: find first '[' to last ']'
  const arrayStart = raw.indexOf("[");
  const arrayEnd   = raw.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try {
      const candidate = raw.slice(arrayStart, arrayEnd + 1);
      return JSON.parse(candidate);
    } catch { /* fall through */ }
  }

  // Strategy 2: strip markdown code fences
  const stripped = raw
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();
  return JSON.parse(stripped);
}

// ── Main agent function ───────────────────────────────────────────────────────

export async function runBursaryScraperAgent(sourceKey: string): Promise<BursaryScraperResult> {
  const source = SA_BURSARY_SOURCES.find((s) => s.key === sourceKey);
  if (!source) throw new Error(`Unknown bursary source: ${sourceKey}`);

  const result: BursaryScraperResult = {
    sourceKey:   source.key,
    sourceLabel: source.label,
    sourceUrl:   source.url,
    scraped:     0,
    saved:       0,
    skipped:     0,
    errors:      [],
    bursaries:   [],
  };

  // 1. Extract bursaries — web scrape or knowledge-based depending on source.mode
  let extracted: ScrapedBursary[];

  if (source.mode === "knowledge") {
    // ── Knowledge mode: ask Claude directly from training data ─────────────
    console.log(`[BursaryScraperAgent] ${source.key}: using knowledge-based extraction`);
    try {
      extracted = await extractBursariesFromKnowledge(source.label, source.url);
      console.log(`[BursaryScraperAgent] ${source.key}: Claude returned ${extracted.length} bursaries from knowledge`);
    } catch (err: any) {
      result.errors.push(`Knowledge extraction failed: ${err.message}`);
      return result;
    }
  } else {
    // ── Scrape mode: fetch page then extract ───────────────────────────────
    let pageText: string;
    let fetchMethod: string;
    try {
      const fetched = await fetchPageText(source.url);
      pageText    = fetched.text;
      fetchMethod = fetched.method;
    } catch (err: any) {
      result.errors.push(`Failed to fetch ${source.url}: ${err.message}`);
      return result;
    }

    if (pageText.length < 200) {
      result.errors.push(`Page text too short (${pageText.length} chars) — site may be blocking scrapers`);
      return result;
    }

    console.log(`[BursaryScraperAgent] ${source.key}: fetched ${pageText.length} chars via ${fetchMethod}`);

    try {
      extracted = await extractBursaries(pageText, source.url);
      console.log(`[BursaryScraperAgent] ${source.key}: Claude extracted ${extracted.length} bursaries`);
    } catch (err: any) {
      result.errors.push(`Extraction failed: ${err.message}`);
      return result;
    }
  }

  result.scraped    = extracted.length;
  result.bursaries  = extracted;

  // 4. Save to database (dedup by name + provider)
  for (const b of extracted) {
    if (!b.name || !b.provider) {
      result.skipped++;
      continue;
    }

    try {
      const existing = await prisma.bursary.findFirst({
        where: {
          name:     { equals: b.name,     mode: "insensitive" },
          provider: { equals: b.provider, mode: "insensitive" },
        },
      });

      if (existing) {
        // Update close date and amount if we have newer info
        if (b.closeDate || b.amount) {
          await prisma.bursary.update({
            where: { id: existing.id },
            data: {
              closeDate: b.closeDate ? new Date(b.closeDate) : undefined,
              amount:    b.amount    ?? undefined,
              sourceUrl: b.sourceUrl,
            },
          });
        }
        result.skipped++;
        continue;
      }

      // Tag knowledge-based bursaries so reviewers know no URL proof exists
      const eligibility = {
        ...(b.eligibilityCriteria ?? {}),
        ...(source.mode === "knowledge" ? { _source: "AI knowledge — no URL proof. Reviewer must verify this bursary exists." } : {}),
      };

      await prisma.bursary.create({
        data: {
          name:                b.name,
          provider:            b.provider,
          description:         b.description ?? null,
          amount:              b.amount      ?? null,
          fieldsOfStudy:       b.fieldsOfStudy ?? [],
          eligibilityCriteria: eligibility,
          applicationUrl:      b.applicationUrl ?? null,
          openDate:            b.openDate  ? new Date(b.openDate)  : null,
          closeDate:           b.closeDate ? new Date(b.closeDate) : null,
          sourceUrl:           b.sourceUrl,
          status:              "AI_GENERATED",
        },
      });

      result.saved++;
    } catch (err: any) {
      result.errors.push(`Failed to save "${b.name}": ${err.message}`);
    }
  }

  return result;
}
