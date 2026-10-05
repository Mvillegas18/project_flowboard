"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";

type InputDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialTags?: string;
  showDescription?: boolean;
  showTags?: boolean;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (values: { title: string; description: string; tags: string }) => void | Promise<void>;
};

export function InputDialog({ open, title, description, initialTitle = "", initialDescription = "", initialTags = "", showDescription = false, showTags = false, submitLabel = "Save", onClose, onSubmit }: InputDialogProps) {
  const [value, setValue] = useState(initialTitle);
  const [details, setDetails] = useState(initialDescription);
  const [tags, setTags] = useState(initialTags);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue(initialTitle);
    setDetails(initialDescription);
    setTags(initialTags);
    setError(null);
  }, [open, initialTitle, initialDescription, initialTags]);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim() || pending) return;
    setPending(true);
    setError(null);
    try {
      await onSubmit({ title: value.trim(), description: details.trim(), tags });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={submit} className="w-full max-w-[420px] rounded-xl border border-white/[0.1] bg-[#141416] p-5 shadow-2xl shadow-black/40">
        <div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-[15px] font-semibold text-zinc-100">{title}</h2>{description && <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{description}</p>}</div><button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200" aria-label="Close dialog"><X size={15} /></button></div>
        <label className="mb-3 block text-[10px] font-medium text-zinc-400">Name or title<input autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/[0.09] bg-black/20 px-3 py-2.5 text-[12px] text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-white/25" placeholder="Give it a name" maxLength={100} /></label>
        {showDescription && <label className="mb-3 block text-[10px] font-medium text-zinc-400">Description <span className="font-normal text-zinc-600">(optional)</span><textarea value={details} onChange={(event) => setDetails(event.target.value)} className="mt-1.5 min-h-[86px] w-full resize-y rounded-lg border border-white/[0.09] bg-black/20 px-3 py-2.5 text-[12px] text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-white/25" placeholder="Add a little context..." maxLength={500} /></label>}
        {showTags && <label className="mb-3 block text-[10px] font-medium text-zinc-400">Tags <span className="font-normal text-zinc-600">(comma separated)</span><input value={tags} onChange={(event) => setTags(event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/[0.09] bg-black/20 px-3 py-2.5 text-[12px] text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-white/25" placeholder="Design, Product" /></label>}
        {error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-[10px] text-rose-300">{error}</p>}
        <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={pending} onClick={onClose} className="rounded-lg px-3 py-2 text-[11px] text-zinc-400 transition hover:bg-white/[0.05] hover:text-zinc-200 disabled:opacity-50">Cancel</button><button type="submit" disabled={!value.trim() || pending} className="rounded-lg bg-zinc-100 px-3.5 py-2 text-[11px] font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Saving…" : submitLabel}</button></div>
      </form>
    </div>
  );
}
