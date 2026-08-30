import { NextResponse } from "next/server";
import { authorizeSuperadmin } from "@/lib/auth/guard";
import { directArticleImage } from "@/lib/ai/art-direction";
import { adviseAircraft, needsAircraft } from "@/lib/ai/aircraft-advisor";
import { composeShot } from "@/lib/ai/photographer";

/**
 * Shows the prompt the image model actually receives, stage by stage.
 *
 *   /api/admin/content/debug-image?title=How%20to%20Tell%20If%20a%20Student...
 *
 * Four agents kept producing the same photograph of a Cessna at golden hour,
 * and every fix so far was made by reasoning about prompt wording rather than
 * by reading the prompt. That is the same mistake that cost hours on the
 * flight-data API today: theorising about a payload instead of printing it.
 *
 * Stages are reported separately so it is obvious WHICH one loses the
 * article. If the art director's subject is already "a Cessna on a ramp at
 * sunrise" for a piece about students changing instructors, the fault is
 * there, and editing the photographer cannot help.
 *
 * Generates nothing and costs no image credits -- it stops at the prompt.
 */
export async function GET(request: Request) {
  const auth = await authorizeSuperadmin();
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const title = url.searchParams.get("title")?.trim();
  if (!title) {
    return NextResponse.json({ error: "Pass ?title=" }, { status: 400 });
  }
  const topicName = url.searchParams.get("topic")?.trim() || "CFI Resources";
  const answer = url.searchParams.get("answer")?.trim() || undefined;

  const brief = await directArticleImage({ title, topicName, answer });
  const wantsAircraft = needsAircraft(brief);
  const aircraft = wantsAircraft ? await adviseAircraft(brief) : null;
  const prompt = await composeShot(brief, aircraft);

  return NextResponse.json({
    title,
    artDirector: {
      subject: brief.subject,
      light: brief.light,
      // Empty here is itself the finding: the director never explained what
      // the picture has to do with the article.
      connection: brief.connection,
    },
    aircraftAdviser: wantsAircraft
      ? { aircraft: aircraft?.aircraft, configuration: aircraft?.configuration }
      : "skipped — subject has no aircraft in it",
    finalPrompt: prompt,
    theTest:
      "Could this prompt illustrate a different flight-training article equally well? If yes, the art director is the stage at fault.",
  });
}
