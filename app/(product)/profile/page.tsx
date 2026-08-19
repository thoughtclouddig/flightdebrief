import { Building2, Mail, User as UserIcon, Users, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoicePreferencePicker } from "@/components/voice-preference-picker";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY);

  const links = await repo.listInstructorLinksForStudent(viewer.user.id);
  const activeLinks = links.filter((l) => l.status === "active");
  const instructors = (
    await Promise.all(activeLinks.map((l) => repo.getInstructor(l.instructorId)))
  ).filter((i) => i !== null);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Profile</h1>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-lg font-semibold text-brand-dark dark:bg-brand/20 dark:text-brand-light">
              {viewer.user.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{viewer.user.name}</p>
              <p className="text-sm capitalize text-slate-500 dark:text-slate-400">{viewer.role}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm dark:border-white/10">
            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Mail className="size-4 text-slate-400" />
              {viewer.user.email}
            </p>
            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Building2 className="size-4 text-slate-400" />
              {viewer.organization.name}
            </p>
          </div>
        </CardContent>
      </Card>

      {ttsEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="size-4 text-brand" />
              Listen Voice
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Used whenever you tap Listen on a brief or debrief.
            </p>
            <VoicePreferencePicker />
          </CardContent>
        </Card>
      ) : null}

      {instructors.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-brand" />
              Your Instructors
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {instructors.map((instructor) => (
              <div key={instructor!.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <UserIcon className="size-3.5 text-slate-400" />
                {instructor!.name}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

    </div>
  );
}
