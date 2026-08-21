"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabPanel {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Client-side tab switcher over server-rendered panels -- each panel's
 * content is fetched/rendered server-side as normal and just passed through
 * as a prop, so this stays a thin display shell with no data-fetching of its
 * own. Non-active panels are hidden (not unmounted), keeping tab switches
 * instant with no loading state.
 */
export function TabPanels({ tabs, defaultTabId }: { tabs: TabPanel[]; defaultTabId?: string }) {
  const [active, setActive] = useState(defaultTabId ?? tabs[0]?.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-slate-900">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            aria-pressed={active === tab.id}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active === tab.id
                ? "bg-brand text-white"
                : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} className={tab.id === active ? "flex flex-col gap-6" : "hidden"}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
