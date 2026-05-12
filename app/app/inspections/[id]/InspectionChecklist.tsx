"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Field";
import { createEmptyChecklist, computeChecklistStats } from "@/lib/inspection-checklist";
import type { CheckCategory } from "@/lib/inspection-checklist";
import { submitInspection } from "@/lib/actions/inspections";

export function InspectionChecklist({
  inspectionId,
  existing,
  existingNotes,
  readonly,
}: {
  inspectionId: string;
  existing?: CheckCategory[];
  existingNotes?: string;
  readonly?: boolean;
}) {
  const [checklist, setChecklist] = useState<CheckCategory[]>(
    existing ?? createEmptyChecklist(),
  );
  const [notes, setNotes] = useState(existingNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const toggleCategory = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const setResult = useCallback(
    (catIdx: number, itemIdx: number, result: "pass" | "fail" | "na") => {
      if (readonly) return;
      setChecklist((prev) => {
        const next = [...prev];
        const items = [...next[catIdx].items];
        items[itemIdx] = { ...items[itemIdx], result };
        next[catIdx] = { ...next[catIdx], items };
        return next;
      });
    },
    [readonly],
  );

  const stats = computeChecklistStats(checklist);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await submitInspection(inspectionId, checklist, notes);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="border-border-default bg-background sticky top-0 z-10 flex items-center justify-between rounded-lg border px-4 py-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold">{stats.total} checked</span>
          <span className="text-green-600">{stats.passed} ✓</span>
          <span className="text-red-600">{stats.failed} ✗</span>
          {stats.score != null ? <span className="font-bold">{stats.score}%</span> : null}
        </div>
        {!readonly ? (
          <Button onClick={handleSubmit} disabled={saving || stats.total === 0}>
            {saving ? "Saving…" : "Submit report"}
          </Button>
        ) : null}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {checklist.map((cat, catIdx) => {
          const catPassed = cat.items.filter((i) => i.result === "pass").length;
          const catFailed = cat.items.filter((i) => i.result === "fail").length;
          const catChecked = cat.items.filter((i) => i.result !== "na").length;
          const isOpen = expanded.has(catIdx);

          return (
            <div
              key={catIdx}
              className="border-border-default bg-background rounded-lg border"
            >
              <button
                type="button"
                onClick={() => toggleCategory(catIdx)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <span className="text-sm font-semibold">{cat.category}</span>
                  <span className="ml-2 text-xs text-zinc-500">
                    {catChecked}/{cat.items.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {catPassed > 0 ? (
                    <span className="text-green-600">{catPassed} ✓</span>
                  ) : null}
                  {catFailed > 0 ? (
                    <span className="text-red-600">{catFailed} ✗</span>
                  ) : null}
                  <span className="text-zinc-400">{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>

              {isOpen ? (
                <ul className="border-border-default divide-border-default divide-y border-t">
                  {cat.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="flex items-center justify-between gap-2 px-4 py-2.5"
                    >
                      <span className="min-w-0 flex-1 text-sm">{item.name}</span>
                      <div className="flex shrink-0 gap-1">
                        {(["pass", "fail", "na"] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            disabled={readonly}
                            onClick={() => setResult(catIdx, itemIdx, r)}
                            className={`rounded px-2 py-1 text-[11px] font-medium ${
                              item.result === r
                                ? r === "pass"
                                  ? "bg-green-600 text-white"
                                  : r === "fail"
                                    ? "bg-red-600 text-white"
                                    : "bg-zinc-300 text-zinc-700"
                                : "bg-surface-muted text-zinc-500"
                            }`}
                          >
                            {r === "pass" ? "✓" : r === "fail" ? "✗" : "N/A"}
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div className="border-border-default bg-background rounded-lg border p-4">
        <label className="text-sm font-semibold">Notes</label>
        {readonly ? (
          <p className="mt-1 text-sm text-zinc-600">{notes || "No notes."}</p>
        ) : (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="border-border-default focus:border-brand-red mt-2 w-full rounded-md border px-3 py-2 text-sm outline-none"
            placeholder="Overall observations, concerns, recommendations…"
          />
        )}
      </div>
    </div>
  );
}
