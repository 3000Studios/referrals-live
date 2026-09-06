import { FormEvent, useState } from "react";
import { Seo } from "@/components/seo/Seo";
import { trackEvent } from "@/lib/analytics";

export function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setSent(false);
    trackEvent("contact_form", { channel: "web" });
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        message: String(form.get("message") ?? ""),
      }),
    }).catch(() => null);
    if (!response?.ok) {
      setError("We could not send your message right now. Please try again later.");
      return;
    }
    e.currentTarget.reset();
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-xl">
      <Seo title="Contact — referrals.live" description="Contact referrals.live for partnerships and sponsorships." path="/contact" />
      <h1 className="font-display text-4xl font-extrabold text-white">Contact</h1>
      <p className="mt-3 text-sm text-muted">Sponsorships, API partnerships, and media inquiries.</p>

      {sent ? (
        <div className="mt-8 glass rounded-3xl border border-neon/30 p-6 text-sm text-white">
          Thanks — your message has been sent.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 glass space-y-4 rounded-3xl border border-white/10 p-6">
          <label className="block text-xs uppercase tracking-wide text-muted">
            Name
            <input name="name" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring" />
          </label>
          <label className="block text-xs uppercase tracking-wide text-muted">
            Email
            <input
              type="email"
              name="email"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
            />
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
          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-4 py-3 text-sm font-semibold text-black shadow-neon"
          >
            Send
          </button>
          {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
        </form>
      )}
    </div>
  );
}
