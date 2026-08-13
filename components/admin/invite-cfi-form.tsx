"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteCfiForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        Invite CFI
      </Button>
    );
  }

  async function submit() {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/invite-cfi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      setOpen(false);
      setName("");
      setEmail("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="cfi-name">Name</Label>
            <Input id="cfi-name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cfi-email">Email</Label>
            <Input id="cfi-email" type="email" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
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
