"use client";

import { useState } from "react";
import { SubscribeButton } from "@/components/billing/subscribe-button";

/** School Pro is priced per location, so quantity is chosen here before either checkout button fires -- both buttons share this one input. */
export function SchoolProSubscribe() {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label htmlFor="location-count" className="text-sm font-medium text-foreground">
          Locations
        </label>
        <input
          id="location-count"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          className="h-10 w-20 rounded-lg border border-hairline bg-surface px-3 text-sm"
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <SubscribeButton billingPeriod="monthly" quantity={quantity} size="lg">
          Subscribe Monthly
        </SubscribeButton>
        <SubscribeButton billingPeriod="annual" quantity={quantity} size="lg" variant="outline">
          Subscribe Annually
        </SubscribeButton>
      </div>
    </div>
  );
}
