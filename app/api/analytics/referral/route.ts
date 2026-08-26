import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { classifyReferrer } from "@/lib/ai-discovery/classify-referrer";

const MAX_REFERRER_LENGTH = 2048;

interface ReferralBody {
  path: string;
  referrer: string | null;
}

function referrerHost(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ReferralBody | null;
  if (!body || typeof body.path !== "string" || !body.path.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, MAX_REFERRER_LENGTH) : null;

  const repo = getRepository();
  await repo.createReferralEvent({
    path: body.path,
    referrerSource: classifyReferrer(referrer),
    referrerHost: referrerHost(referrer),
    rawReferrer: referrer,
  });

  return NextResponse.json({ ok: true });
}
