"use client";

import { useActionState, useRef } from "react";
import { replyToEnquiryAsBuyer, type ActionResult } from "@/lib/actions/enquiries";

export function ReplyForm({ enquiryId }: { enquiryId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    async (_prev, formData) => {
      const body = String(formData.get("body") ?? "");
      const result = await replyToEnquiryAsBuyer(enquiryId, body);
      if (result.ok) formRef.current?.reset();
      return result;
    },
    undefined,
  );

  return (
    <form ref={formRef} action={formAction} className="border-t border-zinc-800 p-3">
      {state && !state.ok ? (
        <p className="mb-2 rounded-md bg-red-600/10 px-3 py-2 text-xs text-red-500">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <textarea
          name="body"
          rows={2}
          required
          placeholder="Reply to the dealer…"
          className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder-zinc-500 focus:border-red-600/50 focus:ring-2 focus:ring-red-600/20"
        />
        <button
          type="submit"
          disabled={pending}
          className="self-end rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
