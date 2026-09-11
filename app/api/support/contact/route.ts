import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { sendSupportRequestEmail } from "@/lib/email";

interface ContactBody {
  context: string;
  message: string;
}

/**
 * Backs the in-app "Contact support" form (replaces a raw `mailto:` link,
 * which does nothing without a mail client configured -- see
 * components/cfi-v2/support-contact-form.tsx). Sender identity comes from
 * the authenticated viewer, not a form field -- there's nothing to spoof
 * and nothing for the submitter to get wrong.
 */
export async function POST(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const viewer = auth.viewer;

  const body = (await request.json()) as ContactBody;
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "Message is too long" }, { status: 400 });
  }
  const context = typeof body.context === "string" && body.context.trim() ? body.context.trim() : "General";

  const sent = await sendSupportRequestEmail({
    fromName: viewer.user.name,
    fromEmail: viewer.user.email,
    context,
    message,
  });

  return NextResponse.json({ sent });
}
