import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type ProgramMini = { id: string; title: string; description: string; related: Array<{ id: string; title: string; category: string }> };

export function OfferRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(2);
  const [program, setProgram] = useState<ProgramMini | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/programs/${id}`)
      .then((r) => r.json())
      .then((data) => setProgram(data.program ?? null))
      .catch(() => null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (seconds <= 0) {
      window.location.href = `/go/${id}`;
      return;
    }
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [id, seconds]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-[2rem] border border-white/10 bg-black/35 p-8">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Redirecting</div>
      <h1 className="font-display text-4xl font-extrabold text-white">{program?.title ?? "Opening offer"}</h1>
      <p className="text-sm text-muted">
        Taking you to the offer in {seconds} second{seconds === 1 ? "" : "s"}. While you wait, you can review an alternative or join the email drop list.
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
