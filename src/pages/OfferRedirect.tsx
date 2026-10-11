import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

type ProgramMini = {
  id: string;
  title: string;
  description: string;
  url?: string;
  related: Array<{ id: string; title: string; category: string }>;
};

type Status = "checking" | "ready" | "unavailable";

// A destination is only claimable when it is a real URL with no unreplaced
// placeholder referral code or unresolved {{TOKEN}} left in it.
const PLACEHOLDER_RE = /YOURCODE|YOUR_CODE|\{\{[^}]+\}\}/i;
function isClaimableUrl(url: string | undefined): url is string {
  if (!url) return false;
  if (PLACEHOLDER_RE.test(url)) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function OfferRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(2);
  const [program, setProgram] = useState<ProgramMini | null>(null);
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/programs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const found: ProgramMini | null = data?.ok ? (data.program ?? null) : null;
        setProgram(found);
        // Only auto-redirect when the program exists AND its destination is a
        // real, claimable link. Anything else lands on an honest unavailable
        // state instead of a dead end (bare 404 or a placeholder URL).
        setStatus(found && isClaimableUrl(found.url) ? "ready" : "unavailable");
      })
      .catch(() => {
        if (!cancelled) setStatus("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || status !== "ready") return;
    if (seconds <= 0) {
      window.location.href = `/go/${id}`;
      return;
    }
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [id, seconds, status]);

  if (status === "unavailable") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 rounded-[2rem] border border-white/10 bg-black/35 p-8">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Offer unavailable</div>
        <h1 className="font-display text-4xl font-extrabold text-white">
          {program?.title ?? "This offer"} isn&rsquo;t open right now
        </h1>
        <p className="text-sm text-muted">
          This program&rsquo;s referral link isn&rsquo;t active yet, so there&rsquo;s no live destination to send you
          to. We&rsquo;d rather tell you that straight than drop you on a dead page. The program details are still
          public, and the marketplace has plenty of live offers.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/browse"
            className="rounded-2xl bg-gradient-to-r from-electric to-neon px-5 py-3 text-sm font-semibold text-black"
          >
            Browse live offers
          </Link>
          {program ? (
            <button
              type="button"
              onClick={() => navigate(`/program/${program.id}`)}
              className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5"
            >
              View program details
            </button>
          ) : null}
          {program?.related?.[0] ? (
            <button
              type="button"
              onClick={() => navigate(`/program/${program.related[0].id}`)}
              className="rounded-2xl border border-neon/30 px-5 py-3 text-sm font-semibold text-white hover:bg-neon/10"
            >
              Try instead: {program.related[0].title}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-[2rem] border border-white/10 bg-black/35 p-8">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Redirecting</div>
      <h1 className="font-display text-4xl font-extrabold text-white">{program?.title ?? "Opening offer"}</h1>
      <p className="text-sm text-muted">
        {status === "checking"
          ? "Checking this offer is live before we send you anywhere…"
          : `Taking you to the offer in ${seconds} second${seconds === 1 ? "" : "s"}. While you wait, you can review an alternative or join the email drop list.`}
      </p>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Top rated alternative</div>
          {program?.related?.[0] ? (
            <button
              type="button"
              onClick={() => navigate(`/program/${program.related[0].id}`)}
              className="mt-4 w-full rounded-2xl border border-neon/30 px-5 py-4 text-left hover:bg-neon/10"
            >
              <div className="font-semibold text-white">{program.related[0].title}</div>
              <div className="mt-1 text-sm text-muted">{program.related[0].category}</div>
            </button>
          ) : (
            <div className="mt-4 text-sm text-muted">No alternative loaded yet.</div>
          )}
        </div>
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Newsletter</div>
          <div className="mt-4 text-sm text-muted">
            Want the next high-converting referral drop before everyone else? Join the email list from the homepage capture block.
          </div>
          <button
            type="button"
            onClick={() => navigate("/#live-chat")}
            className="mt-4 rounded-2xl bg-gradient-to-r from-electric to-neon px-5 py-3 text-sm font-semibold text-black"
          >
            Explore community first
          </button>
        </div>
      </div>
    </div>
  );
}
