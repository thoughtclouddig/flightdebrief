"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** CFI-facing invite -- no "Primary CFI" picker, since the inviting CFI is the primary CFI (set server-side by /api/admin/invite-student). */
export function InviteStudentForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ name, email }),
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
            <Label htmlFor="cfi-student-name">Name</Label>
            <Input id="cfi-student-name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cfi-student-email">Email</Label>
            <Input
              id="cfi-student-email"
              type="email"
              className="mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
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
