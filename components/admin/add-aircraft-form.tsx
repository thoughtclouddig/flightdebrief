"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddAircraftForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tailNumber: "", make: "", model: "", homeAirport: "" });
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add Aircraft
      </Button>
    );
  }

  async function submit() {
    if (!form.tailNumber.trim() || !form.make.trim() || !form.model.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/aircraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setOpen(false);
      setForm({ tailNumber: "", make: "", model: "", homeAirport: "" });
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
            <Label htmlFor="aircraft-tail">Tail number</Label>
            <Input
              id="aircraft-tail"
              className="mt-1.5"
              value={form.tailNumber}
              onChange={(e) => setForm((f) => ({ ...f, tailNumber: e.target.value.toUpperCase() }))}
            />
          </div>
          <div>
            <Label htmlFor="aircraft-home">Home airport</Label>
            <Input
              id="aircraft-home"
              className="mt-1.5"
              value={form.homeAirport}
              onChange={(e) => setForm((f) => ({ ...f, homeAirport: e.target.value.toUpperCase() }))}
            />
          </div>
          <div>
            <Label htmlFor="aircraft-make">Make</Label>
            <Input
              id="aircraft-make"
              className="mt-1.5"
              value={form.make}
              onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="aircraft-model">Model</Label>
            <Input
              id="aircraft-model"
              className="mt-1.5"
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
