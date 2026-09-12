import { RadioPracticePicker } from "@/components/student/radio-practice-picker";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * Student-initiated Radio Practice entry point, linked from Train's
 * "Practice with Vector" section. Picking a scenario here posts through the
 * same POST /api/radio-practice/assign a CFI's assignment uses -- one
 * engine, two entry paths (see that route's own doc comment).
 */
export default async function TrainRadioPracticePage() {
  await getViewer();
  return <RadioPracticePicker backHref="/train" />;
}
