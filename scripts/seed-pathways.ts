/**
 * Seed test pathways directly into the database — no AI, instant.
 * Run from the project root:
 *   cd apps/api && npx tsx ../../scripts/seed-pathways.ts
 */

import { prisma } from "@repo/database";

async function main() {
  const careers = await prisma.career.findMany({
    where:   { status: { in: ["VERIFIED", "APPROVED"] } },
    orderBy: { createdAt: "asc" },
    take:    30,
    select:  { id: true, title: true },
  });

  if (careers.length === 0) {
    console.log("❌ No verified careers found.");
    return;
  }

  let seeded = 0;
  const names: string[] = [];

  for (const career of careers) {
    if (seeded >= 10) break;

    const existing = await prisma.pathway.count({ where: { careerId: career.id } });
    if (existing > 0) {
      console.log(`⏭  ${career.title} — already has pathways`);
      continue;
    }

    await prisma.pathway.create({
      data: {
        careerId:           career.id,
        type:               "UNIVERSITY",
        title:              `Become a ${career.title} via University`,
        durationLabel:      "3–4 years",
        durationMonths:     42,
        estimatedCostMin:   40000,
        estimatedCostMax:   80000,
        costNote:           "NSFAS covers tuition + accommodation for qualifying students",
        earnWhileLearn:     false,
        entryRequirements:  "Grade 12 with a minimum APS of 28. Mathematics and English required.",
        apsMin:             28,
        gradeMin:           12,
        steps:              [
          { step: 1, title: "Pass Grade 12", description: "Achieve a minimum APS of 28 with Maths and English.", duration: "1 year" },
          { step: 2, title: "Apply to university", description: "Apply to a South African university. Apply for NSFAS funding if you qualify.", duration: "6 months" },
          { step: 3, title: "Complete your degree", description: "Study a 3–4 year Bachelor's degree in a relevant field.", duration: "3–4 years" },
          { step: 4, title: "Graduate & enter the field", description: "Apply for graduate programmes or entry-level positions.", duration: "Ongoing" },
        ],
        fundingOptions:      ["NSFAS", "Company Bursary", "Merit Scholarship"],
        setaName:            null,
        qualificationEarned: "Bachelor's Degree (NQF 7)",
        nqfLevelEarned:      7,
        employmentNote:      "Most employers require a relevant degree. Graduate unemployment rate is below the national average.",
        pros:                ["Internationally recognised", "NSFAS available", "Wide range of universities"],
        cons:                ["3–4 year commitment", "Competitive entry", "Student debt if not on NSFAS"],
        status:              "VERIFIED",
      },
    });

    await prisma.pathway.create({
      data: {
        careerId:           career.id,
        type:               "TVET",
        title:              `Become a ${career.title} via TVET College`,
        durationLabel:      "2–3 years",
        durationMonths:     30,
        estimatedCostMin:   5000,
        estimatedCostMax:   15000,
        costNote:           "NSFAS covers TVET fees for qualifying students.",
        earnWhileLearn:     false,
        entryRequirements:  "Grade 10 pass minimum. Grade 12 preferred for N4+.",
        apsMin:             null,
        gradeMin:           10,
        steps:              [
          { step: 1, title: "Enrol at a TVET college", description: "Apply to any public TVET college offering the relevant NCV or NATED programme.", duration: "1 month" },
          { step: 2, title: "Complete NATED N4–N6", description: "Complete 18 months of study across 3 terms.", duration: "18 months" },
          { step: 3, title: "Work experience", description: "Complete 18 months of relevant work experience for your N6 certificate.", duration: "18 months" },
          { step: 4, title: "Enter the workforce", description: "Apply for entry-level positions. TVET graduates are in high demand.", duration: "Ongoing" },
        ],
        fundingOptions:      ["NSFAS", "DHET TVET Bursary", "SETA Bursary"],
        setaName:            null,
        qualificationEarned: "N6 National Certificate (NQF 5)",
        nqfLevelEarned:      5,
        employmentNote:      "Many companies partner directly with TVET colleges for recruitment.",
        pros:                ["More affordable", "NSFAS available", "Practical focus", "Faster entry to work"],
        cons:                ["May need degree for senior roles", "N6 requires work experience"],
        status:              "VERIFIED",
      },
    });

    console.log(`✅  ${career.title}`);
    names.push(career.title);
    seeded++;
  }

  console.log(`\n🌱 Done — seeded ${seeded} careers with UNIVERSITY + TVET pathways (VERIFIED).`);
}

main()
  .catch((e) => { console.error("❌", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
