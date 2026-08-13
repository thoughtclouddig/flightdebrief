"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MemberStatusButton({ memberId, status }: { memberId: string; status: "active" | "inactive" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const next = status === "active" ? "inactive" : "active";

  async function toggle() {
    setPending(true);
    try {
      await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, status: next }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={toggle} disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
      {status === "active" ? "Mark inactive" : "Reactivate"}
    </Button>
  );
}
