// Minimal in-memory rate limiter (per IP, per bucket).
// Good enough for a single server. On serverless/multi-instance hosting,
// swap this for Upstash Redis or similar.

const hits = new Map<string, number[]>();

export function rateLimit(req: Request, bucket: string, max: number, windowMs = 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }

  recent.push(now);
  hits.set(key, recent);
  return true;
}
