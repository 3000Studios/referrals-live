import { FormEvent, useState } from "react";
import { Seo } from "@/components/seo/Seo";
import { trackEvent } from "@/lib/analytics";

const TOPICS = [
  "Correction",
  "Program submission",
  "Paid placement inquiry",
  "General question",
  "Privacy request",
] as const;

export function Contact() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const topic = String(data.get("topic") ?? "General question");
    const message = String(data.get("message") ?? "").trim();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message: `[${topic}] ${message}` }),
      });
      const result = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !result?.ok) throw new Error(result?.error ?? "Something went wrong sending your message.");
      trackEvent("contact_form", { channel: "web" });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong sending your message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <Seo
        title="Contact — referrals.live"
        description="Contact referrals.live — corrections, guide questions, program suggestions, and paid placement inquiries."
        path="/contact"
      />
      <h1 className="font-display text-4xl font-extrabold text-white">Contact</h1>
      <p className="mt-3 text-sm text-muted">
        We read everything sent through the form below — corrections, guide questions, program suggestions, paid placement
        inquiries.
      </p>

      <div className="mt-8 space-y-4 text-sm text-muted">
        <h2 className="font-display text-2xl font-bold text-white">What to write about</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white">Correction</strong> — wrong pricing, wrong terms, or a dead link. Include the
            article URL. Corrections are our top priority.
          </li>
          <li>
            <strong className="text-white">Program submission</strong> — include the program URL, commission structure, cookie
            window, payout threshold, and payment method.
          </li>
          <li>
            <strong className="text-white">Paid placement inquiry</strong> — placements are always labeled and never affect
            editorial reviews or rankings.
          </li>
          <li>
            <strong className="text-white">General question</strong> — anything else about the site or its guides.
          </li>
          <li>
            <strong className="text-white">Privacy request</strong> — access or deletion requests; we respond within 30 days.
          </li>
        </ul>
        <p>
          We aim to respond within 2–3 business days; corrections affecting live recommendations come first, usually within 24
          hours.
        </p>
        <p className="text-xs">
          Please include the exact article URL when reporting an issue. We can&apos;t provide personalized tax or legal advice.
        </p>
      </div>

      {sent ? (
        <div className="mt-8 glass rounded-3xl border border-neon/30 p-6 text-sm text-white">
          Thanks — your message is on its way. We&apos;ll get back to you as soon as we can.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 glass space-y-4 rounded-3xl border border-white/10 p-6">
          <label className="block text-xs uppercase tracking-wide text-muted">
            Name
            <input
              name="name"
              required
              autoComplete="name"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
            />
          </label>
          <label className="block text-xs uppercase tracking-wide text-muted">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
            />
          </label>
          <label className="block text-xs uppercase tracking-wide text-muted">
            Topic
            <select
              name="topic"
              required
              defaultValue="General question"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs uppercase tracking-wide text-muted">
            Message
            <textarea
              name="message"
              required
              rows={5}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-4 py-3 text-sm font-semibold text-black shadow-neon disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
