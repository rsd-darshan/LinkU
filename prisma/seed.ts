import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PUBLIC_DATASET_URL =
  "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json";

/** University-specific supplement essay prompts (used on application form). */
const SUPPLEMENT_PROMPTS: Record<string, string[]> = {
  "swarthmore": [
    "Swarthmore students are encouraged to explore broadly and think deeply. Describe an intellectual experience that sparked your curiosity and how you pursued it.",
    "Swarthmore values community and collaboration. Tell us about a time you worked with others toward a common goal.",
  ],
  "princeton": [
    "Princeton has a longstanding commitment to service and civic engagement. How have you contributed to your community?",
    "Tell us about a person who has influenced you and why.",
  ],
  "yale": [
    "What is something about which you have changed your mind in the last few years?",
    "What inspires you?",
  ],
  "harvard": [
    "List the books you have read in the past year.",
    "What would you want your future college roommate to know about you?",
  ],
  "stanford": [
    "What is the most significant challenge that society faces today?",
    "Tell us about something that is meaningful to you and why.",
  ],
  "mit": [
    "Describe the world you come from and how it has shaped your dreams and aspirations.",
    "Tell us about a significant challenge you have faced.",
  ],
  "columbia": [
    "List a few words or phrases that describe your ideal college community.",
    "For the list question that follows, we ask that you list the titles of the required readings from courses during the school year or summer that you enjoyed most in the past year.",
  ],
  "upenn": [
    "How will you explore your intellectual and academic interests at the University of Pennsylvania?",
    "Write a short thank-you note to someone you have not yet thanked and wish you had.",
  ],
  "duke": [
    "What is your sense of Duke as a university and a community?",
    "We believe a wide range of personal and academic interests can be explored at Duke. Describe something that excites you.",
  ],
  "brown": [
    "Brown’s curriculum encourages students to take intellectual risks. Describe a time when you took a risk.",
    "What do you hope to contribute to the Brown community?",
  ],
  "dartmouth": [
    "The Hawaiian word mo’olelo is often translated as 'story' but can also refer to history, legend, genealogy, and tradition. What is your mo’olelo?",
    "What excites you about Dartmouth?",
  ],
  "williams": [
    "Williams invites you to be yourself. What do you hope to contribute to the Williams community?",
  ],
  "amherst": [
    "What academic, extracurricular, or personal experience has shaped who you are today?",
  ],
  "pomona": [
    "What do you love about the idea of attending Pomona?",
  ],
};

function getPromptsForSlug(slug: string): string[] | null {
  if (SUPPLEMENT_PROMPTS[slug]) return SUPPLEMENT_PROMPTS[slug];
  const short = slug.replace(/-university$|-college$/, "");
  return SUPPLEMENT_PROMPTS[short] ?? null;
}

type ExternalUniversity = {
  name: string;
  country: string;
  "state-province"?: string | null;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "university";
}

function makeSlugUnique(slug: string, used: Set<string>): string {
  let s = slug;
  let n = 0;
  while (used.has(s)) {
    n += 1;
    s = `${slug}-${n}`;
  }
  used.add(s);
  return s;
}

async function fetchPublicDataset(): Promise<ExternalUniversity[] | null> {
  try {
    const res = await fetch(PUBLIC_DATASET_URL, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = (await res.json()) as ExternalUniversity[];
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function main() {
  const usedSlugs = new Set<string>();
  const fromApi = await fetchPublicDataset();

  if (fromApi) {
    const us = fromApi.filter(
      (u) => u.country === "United States" || u.country === "United States of America"
    );
    const bySlug = new Map<string, ExternalUniversity>();
    const seenNames = new Set<string>();
    for (const u of us) {
      const nameKey = u.name.trim().toLowerCase();
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);
      const base = slugify(u.name);
      if (!base) continue;
      const slug = makeSlugUnique(base, usedSlugs);
      bySlug.set(slug, u);
    }
    const list = Array.from(bySlug.entries()).slice(0, 800);
    for (const [slug, u] of list) {
      const prompts = getPromptsForSlug(slug);
      await prisma.university.upsert({
        where: { slug },
        create: {
          name: u.name,
          slug,
          country: "USA",
          state: u["state-province"] ?? null,
          supplementPromptsJson: prompts != null ? (prompts as object) : undefined,
        },
        update: {
          name: u.name,
          country: "USA",
          state: u["state-province"] ?? null,
          supplementPromptsJson: prompts != null ? (prompts as object) : undefined,
        },
      });
    }
    console.log(`Seeded ${list.length} universities from public dataset.`);
    return;
  }

  // Fallback: embedded US list (short slugs to match SUPPLEMENT_PROMPTS)
  const FALLBACK: Array<{ name: string; slug: string; state?: string }> = [
    { name: "Harvard University", slug: "harvard", state: "Massachusetts" },
    { name: "Stanford University", slug: "stanford", state: "California" },
    { name: "MIT", slug: "mit", state: "Massachusetts" },
    { name: "Yale University", slug: "yale", state: "Connecticut" },
    { name: "Princeton University", slug: "princeton", state: "New Jersey" },
    { name: "Columbia University", slug: "columbia", state: "New York" },
    { name: "University of Pennsylvania", slug: "upenn", state: "Pennsylvania" },
    { name: "California Institute of Technology", slug: "caltech", state: "California" },
    { name: "Duke University", slug: "duke", state: "North Carolina" },
    { name: "Northwestern University", slug: "northwestern", state: "Illinois" },
    { name: "Dartmouth College", slug: "dartmouth", state: "New Hampshire" },
    { name: "Brown University", slug: "brown", state: "Rhode Island" },
    { name: "Vanderbilt University", slug: "vanderbilt", state: "Tennessee" },
    { name: "Rice University", slug: "rice", state: "Texas" },
    { name: "Washington University in St. Louis", slug: "washu", state: "Missouri" },
    { name: "Cornell University", slug: "cornell", state: "New York" },
    { name: "University of Notre Dame", slug: "notre-dame", state: "Indiana" },
    { name: "University of California, Berkeley", slug: "uc-berkeley", state: "California" },
    { name: "University of California, Los Angeles", slug: "ucla", state: "California" },
    { name: "University of Michigan", slug: "umich", state: "Michigan" },
    { name: "University of Virginia", slug: "uva", state: "Virginia" },
    { name: "Georgetown University", slug: "georgetown", state: "District of Columbia" },
    { name: "Carnegie Mellon University", slug: "cmu", state: "Pennsylvania" },
    { name: "Emory University", slug: "emory", state: "Georgia" },
    { name: "New York University", slug: "nyu", state: "New York" },
    { name: "University of Southern California", slug: "usc", state: "California" },
    { name: "University of North Carolina at Chapel Hill", slug: "unc", state: "North Carolina" },
    { name: "Boston College", slug: "boston-college", state: "Massachusetts" },
    { name: "Tufts University", slug: "tufts", state: "Massachusetts" },
    { name: "Swarthmore College", slug: "swarthmore", state: "Pennsylvania" },
    { name: "Williams College", slug: "williams", state: "Massachusetts" },
    { name: "Amherst College", slug: "amherst", state: "Massachusetts" },
    { name: "Wellesley College", slug: "wellesley", state: "Massachusetts" },
    { name: "Bowdoin College", slug: "bowdoin", state: "Maine" },
    { name: "Pomona College", slug: "pomona", state: "California" },
    { name: "Middlebury College", slug: "middlebury", state: "Vermont" },
    { name: "Davidson College", slug: "davidson", state: "North Carolina" },
    { name: "Colby College", slug: "colby", state: "Maine" },
    { name: "Colgate University", slug: "colgate", state: "New York" },
  ];

  for (const u of FALLBACK) {
    const prompts = getPromptsForSlug(u.slug);
    await prisma.university.upsert({
      where: { slug: u.slug },
      create: {
        name: u.name,
        slug: u.slug,
        country: "USA",
        state: u.state ?? null,
        supplementPromptsJson: prompts != null ? (prompts as object) : undefined,
      },
      update: {
        name: u.name,
        state: u.state ?? null,
        supplementPromptsJson: prompts != null ? (prompts as object) : undefined,
      },
    });
  }
  console.log(`Seeded ${FALLBACK.length} universities (fallback list).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
