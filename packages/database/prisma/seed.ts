import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "bcryptjs";
const { hash } = pkg;
import { PrismaClient } from "../generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("❌ DATABASE_URL missing from .env");

  const pool    = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma  = new PrismaClient({ adapter } as any);

  try {
    console.log("🌱 Seeding database...");

    await prisma.systemSetting.upsert({
      where:  { key: "registration_mode" },
      update: {},
      create: { key: "registration_mode", value: "INVITE_ONLY" },
    });

    await prisma.systemSetting.upsert({
      where:  { key: "app_name" },
      update: {},
      create: { key: "app_name", value: "My App" },
    });

    const password   = await hash("SuperAdmin123!", 12);
    const superAdmin = await prisma.user.upsert({
      where:  { email: "superadmin@example.com" },
      update: {},
      create: {
        email:         "superadmin@example.com",
        password,
        role:          "SUPER_ADMIN",
        accountStatus: "ACTIVE",
        firstName:     "Super",
        lastName:      "Admin",
        displayName:   "Super Admin",
      },
    });

    console.log(`✅ Super admin: ${superAdmin.email}`);
    console.log(`   Password: SuperAdmin123!`);
    console.log(`\n⚠️  Change this password immediately after first login!`);

    // ── SA Career Clusters ────────────────────────────────────────────────────
    const clusters = [
      { name: "Information Technology",              slug: "information-technology",      description: "Software, cybersecurity, data science, networking and digital innovation",   iconName: "laptop",       colorHex: "#6366f1" },
      { name: "Health Sciences & Social Services",   slug: "health-sciences",             description: "Medicine, nursing, psychology, social work and allied health professions",    iconName: "heart-pulse",  colorHex: "#ef4444" },
      { name: "Finance, Economics & Accounting",     slug: "finance-economics",           description: "Banking, investment, accounting, insurance and financial planning",           iconName: "trending-up",  colorHex: "#22c55e" },
      { name: "Engineering & Manufacturing",         slug: "engineering-manufacturing",   description: "Mechanical, civil, electrical, chemical and industrial engineering",          iconName: "cog",          colorHex: "#f59e0b" },
      { name: "Education, Training & Development",   slug: "education-training",          description: "Teaching, lecturing, educational psychology and training",                    iconName: "graduation-cap", colorHex: "#3b82f6" },
      { name: "Business Management & Administration",slug: "business-management",         description: "Entrepreneurship, operations, HR, marketing and project management",         iconName: "briefcase",    colorHex: "#8b5cf6" },
      { name: "Arts, Design & Creative Industries",  slug: "arts-design",                 description: "Graphic design, film, music, fashion, architecture and performing arts",     iconName: "palette",      colorHex: "#ec4899" },
      { name: "Science, Mathematics & Technology",   slug: "science-mathematics",         description: "Physics, chemistry, biology, statistics and applied sciences",               iconName: "flask",        colorHex: "#0ea5e9" },
      { name: "Agriculture, Forestry & Fishing",     slug: "agriculture-forestry",        description: "Farming, food technology, environmental management and agribusiness",        iconName: "sprout",       colorHex: "#84cc16" },
      { name: "Law, Criminal Justice & Security",    slug: "law-criminal-justice",        description: "Law, policing, criminology, corrections and legal services",                 iconName: "scale",        colorHex: "#64748b" },
      { name: "Communication & Media Studies",       slug: "communication-media",         description: "Journalism, public relations, broadcasting, photography and advertising",    iconName: "megaphone",    colorHex: "#f97316" },
      { name: "Construction & Built Environment",    slug: "construction-built-environment", description: "Architecture, quantity surveying, plumbing, property and urban planning", iconName: "building",     colorHex: "#a78bfa" },
      { name: "Transport, Logistics & Tourism",      slug: "transport-logistics-tourism", description: "Aviation, shipping, supply chain, hospitality and travel",                  iconName: "plane",        colorHex: "#06b6d4" },
      { name: "Public Administration & Governance",  slug: "public-administration",       description: "Government, civil service, policy, diplomacy and community development",     iconName: "landmark",     colorHex: "#78716c" },
      { name: "Mining & Resources",                  slug: "mining-resources",            description: "Mining engineering, geology, metallurgy and mineral processing",             iconName: "pickaxe",      colorHex: "#d97706" },
    ];

    for (const c of clusters) {
      await prisma.careerCluster.upsert({
        where:  { slug: c.slug },
        update: { name: c.name, description: c.description, iconName: c.iconName, colorHex: c.colorHex },
        create: c,
      });
    }
    console.log(`✅ ${clusters.length} career clusters seeded`);

    // ── SA Public Universities ────────────────────────────────────────────────
    const universities = [
      { name: "University of Cape Town",                    abbreviation: "UCT",      province: "Western Cape",  type: "COMPREHENSIVE", website: "https://www.uct.ac.za" },
      { name: "University of the Witwatersrand",            abbreviation: "Wits",     province: "Gauteng",       type: "COMPREHENSIVE", website: "https://www.wits.ac.za" },
      { name: "Stellenbosch University",                    abbreviation: "SU",       province: "Western Cape",  type: "COMPREHENSIVE", website: "https://www.sun.ac.za" },
      { name: "University of Pretoria",                     abbreviation: "UP",       province: "Gauteng",       type: "COMPREHENSIVE", website: "https://www.up.ac.za" },
      { name: "University of KwaZulu-Natal",                abbreviation: "UKZN",     province: "KwaZulu-Natal", type: "COMPREHENSIVE", website: "https://www.ukzn.ac.za" },
      { name: "University of Johannesburg",                 abbreviation: "UJ",       province: "Gauteng",       type: "COMPREHENSIVE", website: "https://www.uj.ac.za" },
      { name: "Rhodes University",                          abbreviation: "RU",       province: "Eastern Cape",  type: "TRADITIONAL",   website: "https://www.ru.ac.za" },
      { name: "University of the Western Cape",             abbreviation: "UWC",      province: "Western Cape",  type: "COMPREHENSIVE", website: "https://www.uwc.ac.za" },
      { name: "University of Fort Hare",                    abbreviation: "UFH",      province: "Eastern Cape",  type: "TRADITIONAL",   website: "https://www.ufh.ac.za" },
      { name: "Nelson Mandela University",                  abbreviation: "NMU",      province: "Eastern Cape",  type: "COMPREHENSIVE", website: "https://www.mandela.ac.za" },
      { name: "Walter Sisulu University",                   abbreviation: "WSU",      province: "Eastern Cape",  type: "COMPREHENSIVE", website: "https://www.wsu.ac.za" },
      { name: "University of the Free State",               abbreviation: "UFS",      province: "Free State",    type: "COMPREHENSIVE", website: "https://www.ufs.ac.za" },
      { name: "North-West University",                      abbreviation: "NWU",      province: "North West",    type: "COMPREHENSIVE", website: "https://www.nwu.ac.za" },
      { name: "University of Limpopo",                      abbreviation: "UL",       province: "Limpopo",       type: "TRADITIONAL",   website: "https://www.ul.ac.za" },
      { name: "University of Venda",                        abbreviation: "Univen",   province: "Limpopo",       type: "TRADITIONAL",   website: "https://www.univen.ac.za" },
      { name: "University of Mpumalanga",                   abbreviation: "UMP",      province: "Mpumalanga",    type: "TRADITIONAL",   website: "https://www.ump.ac.za" },
      { name: "Sol Plaatje University",                     abbreviation: "SPU",      province: "Northern Cape", type: "TRADITIONAL",   website: "https://www.spu.ac.za" },
      { name: "Cape Peninsula University of Technology",    abbreviation: "CPUT",     province: "Western Cape",  type: "UNIVERSITY_OF_TECHNOLOGY", website: "https://www.cput.ac.za" },
      { name: "Tshwane University of Technology",           abbreviation: "TUT",      province: "Gauteng",       type: "UNIVERSITY_OF_TECHNOLOGY", website: "https://www.tut.ac.za" },
      { name: "Durban University of Technology",            abbreviation: "DUT",      province: "KwaZulu-Natal", type: "UNIVERSITY_OF_TECHNOLOGY", website: "https://www.dut.ac.za" },
      { name: "Vaal University of Technology",              abbreviation: "VUT",      province: "Gauteng",       type: "UNIVERSITY_OF_TECHNOLOGY", website: "https://www.vut.ac.za" },
      { name: "Mangosuthu University of Technology",        abbreviation: "MUT",      province: "KwaZulu-Natal", type: "UNIVERSITY_OF_TECHNOLOGY", website: "https://www.mut.ac.za" },
      { name: "Central University of Technology",           abbreviation: "CUT",      province: "Free State",    type: "UNIVERSITY_OF_TECHNOLOGY", website: "https://www.cut.ac.za" },
      { name: "University of South Africa",                 abbreviation: "UNISA",    province: "Gauteng",       type: "DISTANCE",      website: "https://www.unisa.ac.za" },
      { name: "Sefako Makgatho Health Sciences University", abbreviation: "SMU",      province: "Gauteng",       type: "TRADITIONAL",   website: "https://www.smu.ac.za" },
      { name: "University of Zululand",                     abbreviation: "UniZulu",  province: "KwaZulu-Natal", type: "TRADITIONAL",   website: "https://www.unizulu.ac.za" },
    ];

    for (const u of universities) {
      const existing = await prisma.university.findFirst({ where: { name: u.name } });
      if (!existing) {
        await prisma.university.create({ data: { ...u, status: "VERIFIED" } });
      }
    }
    console.log(`✅ ${universities.length} SA universities seeded`);

    // ── SA Public TVET Colleges — 50 official DHET colleges ──────────────────
    // Source: https://www.dhet.gov.za/RegionalOffices/educational-institutions/
    //         technical-vocational-education-and-training-colleges-tvet-colleges.html
    // Wipe and re-seed so corrections always apply cleanly
    await prisma.tvetCollege.deleteMany({});
    const DHET_SOURCE = "https://www.dhet.gov.za/RegionalOffices/educational-institutions/technical-vocational-education-and-training-colleges-tvet-colleges.html";
    const tvetColleges = [
      // Gauteng (8)
      { name: "Central Johannesburg TVET College",     abbreviation: "CJC",   province: "Gauteng",       website: "https://www.cjc.co.za",                   sourceUrl: DHET_SOURCE },
      { name: "Ekurhuleni East TVET College",          abbreviation: "EEC",   province: "Gauteng",       website: "https://www.eec.edu.za",                   sourceUrl: DHET_SOURCE },
      { name: "Ekurhuleni West TVET College",          abbreviation: "EWC",   province: "Gauteng",       website: "https://www.ewc.edu.za",                   sourceUrl: DHET_SOURCE },
      { name: "Sedibeng TVET College",                 abbreviation: "STC",   province: "Gauteng",       website: "https://www.sedcol.co.za",                 sourceUrl: DHET_SOURCE },
      { name: "South West Gauteng TVET College",       abbreviation: "SWGC",  province: "Gauteng",       website: "https://www.swgc.co.za",                   sourceUrl: DHET_SOURCE },
      { name: "Tshwane North TVET College",            abbreviation: "TNC",   province: "Gauteng",       website: "https://www.tnc4fet.co.za",                sourceUrl: DHET_SOURCE },
      { name: "Tshwane South TVET College",            abbreviation: "TSC",   province: "Gauteng",       website: "https://www.tsc.edu.za",                   sourceUrl: DHET_SOURCE },
      { name: "Western TVET College",                  abbreviation: "WVC",   province: "Gauteng",       website: "https://www.westcol.co.za",                sourceUrl: DHET_SOURCE },
      // Western Cape (6)
      { name: "Boland TVET College",                   abbreviation: "BTC",   province: "Western Cape",  website: "https://www.bolandcollege.com",            sourceUrl: DHET_SOURCE },
      { name: "College of Cape Town",                  abbreviation: "CCT",   province: "Western Cape",  website: "https://www.cct.edu.za",                   sourceUrl: DHET_SOURCE },
      { name: "False Bay TVET College",                abbreviation: "FBC",   province: "Western Cape",  website: "https://www.falsebaycollege.co.za",        sourceUrl: DHET_SOURCE },
      { name: "Northlink TVET College",                abbreviation: "NLC",   province: "Western Cape",  website: "https://www.northlink.co.za",              sourceUrl: DHET_SOURCE },
      { name: "South Cape TVET College",               abbreviation: "SCC",   province: "Western Cape",  website: "https://www.sccollege.co.za",              sourceUrl: DHET_SOURCE },
      { name: "West Coast TVET College",               abbreviation: "WCTC",  province: "Western Cape",  website: "https://www.westcoastcollege.co.za",       sourceUrl: DHET_SOURCE },
      // KwaZulu-Natal (9)
      { name: "Coastal TVET College",                  abbreviation: "CKZN",  province: "KwaZulu-Natal", website: "https://www.coastalkzn.co.za",             sourceUrl: DHET_SOURCE },
      { name: "Elangeni TVET College",                 abbreviation: "ELC",   province: "KwaZulu-Natal", website: "https://www.efet.co.za",                   sourceUrl: DHET_SOURCE },
      { name: "Esayidi TVET College",                  abbreviation: "ESC",   province: "KwaZulu-Natal", website: "https://www.esayidifet.co.za",             sourceUrl: DHET_SOURCE },
      { name: "Majuba TVET College",                   abbreviation: "MTC",   province: "KwaZulu-Natal", website: "https://www.majuba.edu.za",                sourceUrl: DHET_SOURCE },
      { name: "Mnambithi TVET College",                abbreviation: "MNC",   province: "KwaZulu-Natal", website: null,                                       sourceUrl: DHET_SOURCE },
      { name: "Mthashana TVET College",                abbreviation: "MHC",   province: "KwaZulu-Natal", website: "https://www.mthashanafet.co.za",           sourceUrl: DHET_SOURCE },
      { name: "Thekwini TVET College",                 abbreviation: "TTC",   province: "KwaZulu-Natal", website: "https://www.thekwinicollege.co.za",        sourceUrl: DHET_SOURCE },
      { name: "Umfolozi TVET College",                 abbreviation: "UFC",   province: "KwaZulu-Natal", website: "https://www.umfolozicollege.co.za",        sourceUrl: DHET_SOURCE },
      { name: "Umgungundlovu TVET College",            abbreviation: "UTC",   province: "KwaZulu-Natal", website: "https://www.ufetc.edu.za",                 sourceUrl: DHET_SOURCE },
      // Eastern Cape (8)
      { name: "Buffalo City TVET College",             abbreviation: "BCTC",  province: "Eastern Cape",  website: "https://www.bccollege.co.za",              sourceUrl: DHET_SOURCE },
      { name: "Eastcape Midlands TVET College",        abbreviation: "ECMC",  province: "Eastern Cape",  website: "https://www.emcol.co.za",                  sourceUrl: DHET_SOURCE },
      { name: "Ikhala TVET College",                   abbreviation: "ITC",   province: "Eastern Cape",  website: "https://www.ikhalacollege.co.za",          sourceUrl: DHET_SOURCE },
      { name: "Ingwe TVET College",                    abbreviation: "IWC",   province: "Eastern Cape",  website: "https://www.ingwecollege.co.za",           sourceUrl: DHET_SOURCE },
      { name: "King Hintsa TVET College",              abbreviation: "KHC",   province: "Eastern Cape",  website: "https://www.kinghintsacollege.edu.za",     sourceUrl: DHET_SOURCE },
      { name: "King Sabata Dalindyebo TVET College",   abbreviation: "KSD",   province: "Eastern Cape",  website: null,                                       sourceUrl: DHET_SOURCE },
      { name: "Lovedale TVET College",                 abbreviation: "LVC",   province: "Eastern Cape",  website: "https://www.lovedalecollege.co.za",        sourceUrl: DHET_SOURCE },
      { name: "Port Elizabeth TVET College",           abbreviation: "PETC",  province: "Eastern Cape",  website: "https://www.pecollege.edu.za",             sourceUrl: DHET_SOURCE },
      // Limpopo (7)
      { name: "Capricorn TVET College",                abbreviation: "CTC",   province: "Limpopo",       website: "https://www.capricorncollege.edu.za",      sourceUrl: DHET_SOURCE },
      { name: "Lephalale TVET College",                abbreviation: "LTC",   province: "Limpopo",       website: "https://www.lephalalefetcollege.co.za",    sourceUrl: DHET_SOURCE },
      { name: "Letaba TVET College",                   abbreviation: "LEB",   province: "Limpopo",       website: "https://www.letabafet.co.za",              sourceUrl: DHET_SOURCE },
      { name: "Mopani South East TVET College",        abbreviation: "MSE",   province: "Limpopo",       website: "https://www.mopanicollege.edu.za",         sourceUrl: DHET_SOURCE },
      { name: "Sekhukhune TVET College",               abbreviation: "SHC",   province: "Limpopo",       website: "https://www.sekfetcol.co.za",              sourceUrl: DHET_SOURCE },
      { name: "Vhembe TVET College",                   abbreviation: "VTC",   province: "Limpopo",       website: "https://www.vhembefet.co.za",              sourceUrl: DHET_SOURCE },
      { name: "Waterberg TVET College",                abbreviation: "WBC",   province: "Limpopo",       website: "https://www.waterbergcollege.co.za",       sourceUrl: DHET_SOURCE },
      // Free State (4)
      { name: "Flavius Mareka TVET College",           abbreviation: "FMC",   province: "Free State",    website: "https://www.flaviusmareka.net",            sourceUrl: DHET_SOURCE },
      { name: "Goldfields TVET College",               abbreviation: "GFC",   province: "Free State",    website: "https://www.goldfieldsfet.edu.za",         sourceUrl: DHET_SOURCE },
      { name: "Maluti TVET College",                   abbreviation: "MLC",   province: "Free State",    website: "https://www.malutifet.org.za",             sourceUrl: DHET_SOURCE },
      { name: "Motheo TVET College",                   abbreviation: "MCT",   province: "Free State",    website: "https://www.motheofet.co.za",              sourceUrl: DHET_SOURCE },
      // Mpumalanga (3)
      { name: "Ehlanzeni TVET College",                abbreviation: "EHC",   province: "Mpumalanga",    website: "https://www.ehlanzenicollege.co.za",       sourceUrl: DHET_SOURCE },
      { name: "Gert Sibande TVET College",             abbreviation: "GSC",   province: "Mpumalanga",    website: "https://www.gscollege.co.za",              sourceUrl: DHET_SOURCE },
      { name: "Nkangala TVET College",                 abbreviation: "NKC",   province: "Mpumalanga",    website: "https://www.nkangalafet.edu.za",           sourceUrl: DHET_SOURCE },
      // North West (3)
      { name: "Orbit TVET College",                    abbreviation: "OTC",   province: "North West",    website: "https://www.orbitcollege.co.za",           sourceUrl: DHET_SOURCE },
      { name: "Taletso TVET College",                  abbreviation: "TLC",   province: "North West",    website: "https://www.taletsofetcollege.co.za",      sourceUrl: DHET_SOURCE },
      { name: "Vuselela TVET College",                 abbreviation: "VUC",   province: "North West",    website: "https://www.vuselelacollege.co.za",        sourceUrl: DHET_SOURCE },
      // Northern Cape (2)
      { name: "Northern Cape Rural TVET College",      abbreviation: "NCR",   province: "Northern Cape", website: "https://www.ncrfet.edu.za",                sourceUrl: DHET_SOURCE },
      { name: "Northern Cape Urban TVET College",      abbreviation: "NCU",   province: "Northern Cape", website: "https://www.ncufetcollege.edu.za",         sourceUrl: DHET_SOURCE },
    ];

    await prisma.tvetCollege.createMany({
      data: tvetColleges.map((c) => ({ ...c, collegeType: "PUBLIC", status: "IN_REVIEW" })),
    });
    console.log(`✅ ${tvetColleges.length} SA public TVET colleges seeded (status: IN_REVIEW — verify before publishing)`);

    // ── SA Private FET/TVET Colleges ─────────────────────────────────────────
    // QCTO-registered private providers — NSFAS-accredited, offer NATED programmes
    // Seeded as IN_REVIEW — verify registration + website before publishing to learners
    const privateColleges = [
      { name: "Boston City Campus & Business College", abbreviation: "Boston",   province: "Gauteng",       website: "https://www.boston.co.za",         sourceUrl: "https://www.boston.co.za/about" },
      { name: "Damelin",                               abbreviation: "Damelin",  province: "Gauteng",       website: "https://www.damelin.co.za",        sourceUrl: "https://www.damelin.co.za/about-damelin" },
      { name: "Rosebank College",                      abbreviation: "Rosebank", province: "Gauteng",       website: "https://www.rosebankcollege.co.za", sourceUrl: "https://www.rosebankcollege.co.za" },
      { name: "STADIO",                                abbreviation: "STADIO",   province: "Gauteng",       website: "https://www.stadio.ac.za",         sourceUrl: "https://www.stadio.ac.za" },
      { name: "IIE MSA (Management College of SA)",    abbreviation: "MSA",      province: "KwaZulu-Natal", website: "https://www.msa.ac.za",            sourceUrl: "https://www.msa.ac.za" },
      { name: "Oxbridge Academy",                      abbreviation: "Oxbridge", province: "Western Cape",  website: "https://www.oxbridgeacademy.edu.za", sourceUrl: "https://www.oxbridgeacademy.edu.za" },
      { name: "Richfield Graduate Institute",          abbreviation: "Richfield",province: "KwaZulu-Natal", website: "https://www.richfield.ac.za",      sourceUrl: "https://www.richfield.ac.za" },
      { name: "CTU Training Solutions",                abbreviation: "CTU",      province: "Gauteng",       website: "https://www.ctutraining.co.za",    sourceUrl: "https://www.ctutraining.co.za" },
      { name: "Regent Business School",                abbreviation: "Regent",   province: "KwaZulu-Natal", website: "https://www.regent.ac.za",         sourceUrl: "https://www.regent.ac.za" },
      { name: "College SA",                            abbreviation: "CollegeSA",province: "Gauteng",       website: "https://www.collegesa.co.za",      sourceUrl: "https://www.collegesa.co.za" },
    ];

    // Delete existing private colleges and re-seed cleanly
    await prisma.tvetCollege.deleteMany({ where: { collegeType: "PRIVATE" } });
    await prisma.tvetCollege.createMany({
      data: privateColleges.map((c) => ({ ...c, collegeType: "PRIVATE", status: "IN_REVIEW" })),
    });
    console.log(`✅ ${privateColleges.length} SA private colleges seeded (status: IN_REVIEW — verify before publishing)`);
    console.log(`   Gauteng:8 · W.Cape:6 · KZN:9 · E.Cape:8 · Limpopo:7 · FS:4 · Mpuma:3 · NW:3 · NC:2`);
  } catch (error: any) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
