type RequiredEnvKey = "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET";

function readEnv(name: string) {
  const value = process.env[name];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function requireEnv(name: RequiredEnvKey) {
  const value = readEnv(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function getPublicAppUrl() {
  return readEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";
}

export function getS3Config() {
  return {
    region: readEnv("S3_REGION") ?? "us-east-1",
    bucket: readEnv("S3_BUCKET_NAME"),
    accessKeyId: readEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: readEnv("S3_SECRET_ACCESS_KEY"),
    publicBaseUrl: readEnv("S3_PUBLIC_BASE_URL")
  };
}

function parseWeight(name: string, fallback: number) {
  const raw = readEnv(name);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function getMatchWeightsFromEnv() {
  return {
    major: parseWeight("MATCH_WEIGHT_MAJOR", 30),
    country: parseWeight("MATCH_WEIGHT_COUNTRY", 15),
    gpa: parseWeight("MATCH_WEIGHT_GPA", 25),
    universityOverlapCap: parseWeight("MATCH_WEIGHT_UNIVERSITY_CAP", 20),
    verificationBadge: parseWeight("MATCH_WEIGHT_VERIFIED_BADGE", 5),
    rating: parseWeight("MATCH_WEIGHT_RATING", 5)
  };
}
