import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";

export function AdminAttribution() {
  const user = useAppStore((s) => s.user);
  const providers = useAppStore((s) => s.providers);
  const ownerProfiles = useAppStore((s) => s.ownerProfiles);
  const testAttribution = useAppStore((s) => s.testAttribution);
  const missingConfigProviders = useAppStore((s) => s.missingConfigProviders);
  const quarantineLog = useAppStore((s) => s.quarantineLog);
  const [runs, setRuns] = useState(() => useAppStore.getState().ingestionRuns);

  const [providerId, setProviderId] = useState(() => providers[0]?.id ?? "");
  const activeProvider = providers.find((p) => p.id === providerId) ?? providers[0];
  const [previewUrl, setPreviewUrl] = useState("https://example.com/sample-offer");
  const [params, setParams] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const hydratedParams = useMemo(() => {
    if (!activeProvider) return {};
    const saved = ownerProfiles[activeProvider.id]?.encryptedParams;
    if (!saved) return {};
    const parse = (v: string) => {
      try {
        return decodeURIComponent(escape(window.atob(v)));
      } catch {
        return "";
      }
    };
    const merged: Record<string, string> = {};
    Object.entries(saved).forEach(([k, v]) => {
      merged[k] = parse(v);
    });
    return merged;
  }, [activeProvider, ownerProfiles]);

  const mergedParams = useMemo(() => ({ ...hydratedParams, ...params }), [hydratedParams, params]);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <Seo title="Admin attribution — referrals.live" description="Owner attribution admin" path="/admin/attribution" />
        <h1 className="font-display text-3xl font-bold text-white">Sign in required</h1>
        <p className="mt-3 text-sm text-muted">Login with the owner admin account to manage provider attribution.</p>
        <Link className="mt-6 inline-flex rounded-2xl bg-neon px-6 py-3 text-sm font-semibold text-black" to="/login">
          Login
        </Link>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <Seo title="Admin attribution — referrals.live" description="Owner attribution admin" path="/admin/attribution" />
        <h1 className="font-display text-3xl font-bold text-white">Admin only</h1>
        <p className="mt-3 text-sm text-muted">This area is restricted to the owner admin account.</p>
        <Link className="mt-6 inline-flex rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white" to="/dashboard">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeProvider) return;
    await api.saveOwnerProfile(activeProvider.id, mergedParams, user.email);
    setResult({ ok: true, text: "Saved owner referral profile." });
  };

  const refreshRuns = async () => {
    const next = await api.getIngestionRuns();
    setRuns(next);
  };

  const onTest = () => {
    if (!activeProvider) return;
    const r = testAttribution(activeProvider.id, previewUrl);
    if (r.ok) setResult({ ok: true, text: r.url });
    else setResult({ ok: false, text: r.reason });
  };

  return (
    <div>
      <Seo
        title="Owner attribution admin — referrals.live"
        description="Manage provider credential fields and test owner attribution links."
        path="/admin/attribution"
      />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Owner controls</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Attribution Admin</h1>
      <p className="mt-3 max-w-3xl text-sm text-muted">
        Configure provider fields used to build owner-attributed public referral links, run ingestion manually, and review
        moderation/quarantine logs.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={onSave} className="glass space-y-4 rounded-3xl border border-white/10 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Provider profile</div>
          <label className="block text-xs uppercase tracking-wide text-muted">
            Provider
            <select
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                setParams({});
                setResult(null);
              }}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.domain})
                </option>
              ))}
            </select>
          </label>

          {activeProvider?.requiredParams.map((key) => (
            <label key={key} className="block text-xs uppercase tracking-wide text-muted">
              {key}
              <input
                value={mergedParams[key] ?? ""}
                onChange={(e) => setParams((prev) => ({ ...prev, [key]: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none ring-neon/30 focus:ring"
              />
            </label>
          ))}

          <label className="block text-xs uppercase tracking-wide text-muted">
            Test source URL
            <input
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none ring-neon/30 focus:ring"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-5 py-3 text-sm font-semibold text-black"
            >
              Save profile
            </button>
            <button
              type="button"
              onClick={onTest}
              className="rounded-2xl border border-electric/40 px-5 py-3 text-sm font-semibold text-electric"
            >
              Test attribution
            </button>
            <button
              type="button"
              onClick={async () => {
                await api.runIngestion("admin-manual");
                await refreshRuns();
              }}
              className="rounded-2xl border border-gold/40 px-5 py-3 text-sm font-semibold text-gold"
            >
              Run ingestion now
            </button>
            <button
              type="button"
              onClick={refreshRuns}
              className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white"
            >
              Refresh runs
            </button>
          </div>

          {result ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${result.ok ? "border-neon/40 text-neon" : "border-red-500/40 text-red-300"}`}
            >
              {result.text}
            </div>
          ) : null}
        </form>

        <div className="space-y-6">
          <div className="glass rounded-3xl border border-white/10 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-muted">Missing config providers</div>
            <ul className="mt-3 space-y-2 text-sm text-white">
              {missingConfigProviders().length ? (
                missingConfigProviders().map((p) => <li key={p.id}>- {p.name}</li>)
              ) : (
                <li className="text-neon">All active providers configured.</li>
              )}
            </ul>
          </div>
          <div className="glass rounded-3xl border border-white/10 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-muted">Recent ingestion runs</div>
            <ul className="mt-3 space-y-2 text-xs text-muted">
              {runs.slice(0, 6).map((r) => (
                <li key={r.runId}>
                  {new Date(r.finishedAt).toLocaleString()} · fetched {r.fetchedCount} · accepted {r.acceptedCount} ·
                  errors {r.errors.length}
                </li>
              ))}
              {!runs.length ? <li>No runs yet.</li> : null}
            </ul>
          </div>
          <div className="glass rounded-3xl border border-white/10 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-muted">Quarantine log</div>
            <ul className="mt-3 space-y-2 text-xs text-muted">
              {quarantineLog.slice(0, 6).map((line) => (
                <li key={line}>{line}</li>
              ))}
              {!quarantineLog.length ? <li>No quarantined items.</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

