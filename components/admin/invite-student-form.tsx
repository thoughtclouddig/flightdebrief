"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InstructorOption {
  id: string;
  name: string;
}

export function InviteStudentForm({ instructors }: { instructors: InstructorOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [primaryInstructorId, setPrimaryInstructorId] = useState(instructors[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!open) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <Button size="sm" onClick={() => setOpen(true)}>
          <UserPlus className="size-4" />
          Invite Student
        </Button>
        {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}
      </div>
    );
  }

  async function submit() {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/invite-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, primaryInstructorId: primaryInstructorId || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(data.error ?? "Invite failed. Please try again.");
        return;
      }
      setNotice(
        data.emailSent
          ? `Invite email sent to ${email}.`
          : `${name} was added, but the invite email could not be sent — share the login link with them directly.`,
      );
      setOpen(false);
      setName("");
      setEmail("");
      router.refresh();
    } catch {
      setNotice("Invite failed — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="student-name">Name</Label>
            <Input id="student-name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="student-email">Email</Label>
            <Input
              id="student-email"
              type="email"
              className="mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        {instructors.length > 0 ? (
          <div>
            <Label htmlFor="student-cfi">Primary CFI</Label>
            <select
              id="student-cfi"
              value={primaryInstructorId}
              onChange={(e) => setPrimaryInstructorId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-slate-900"
            >
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {notice ? <p className="text-xs text-destructive">{notice}</p> : null}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Send invite
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
