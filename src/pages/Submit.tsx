import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";
import { categories } from "@/data/categories";
import { curatedImage } from "@/lib/media";
import { trackEvent } from "@/lib/analytics";

function isValidUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function Submit() {
  const submitReferral = useAppStore((s) => s.submitReferral);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState(categories[0]?.id ?? "fintech");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    if (!isValidUrl(url.trim())) {
      setError("Enter a valid http(s) URL.");
      return;
    }
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);
    const img =
      image.trim() && isValidUrl(image.trim())
        ? image.trim()
        : curatedImage("1557804506-669a67965ba0");
    const created = submitReferral({
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      category,
      tags: tagList.length ? tagList : ["community"],
      image: img,
    });
    trackEvent("referral_submitted", { id: created.id });
    setDoneId(created.id);
  };

  return (
    <div>
      <Seo
        title="Submit a referral — referrals.live"
        description="Submit a referral program to the marketplace. URLs are validated and listings go live instantly on the client-side demo."
        path="/submit"
      />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Submission</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Submit a referral</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        This demo stores submissions locally in your browser (Zustand + persistence). Wire your API when you scale.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onSubmit} className="glass space-y-4 rounded-3xl border border-white/10 p-6">
          <label className="block text-xs uppercase tracking-wide text-muted">
            Title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
            />
          </label>
          <label className="block text-xs uppercase tracking-wide text-muted">
            Description
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
            />
          </label>
          <label className="block text-xs uppercase tracking-wide text-muted">
            Destination URL
            <input
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs uppercase tracking-wide text-muted">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs uppercase tracking-wide text-muted">
              Tags (comma-separated)
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="bonus, signup, fintech"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
              />
            </label>
          </div>
          <label className="block text-xs uppercase tracking-wide text-muted">
            Optional image URL
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
            />
          </label>
          {error ? <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-6 py-4 text-sm font-semibold text-black shadow-neon"
          >
            Publish listing
          </button>
        </form>

        <div className="space-y-6">
          <div className="glass rounded-3xl border border-gold/30 p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Boost your link</div>
            <p className="mt-3 text-sm text-muted">
              Premium boosts increase visibility in trending feeds and unlock sponsor-style placement opportunities.
            </p>
            <Link
              to="/premium"
              className="mt-4 inline-flex rounded-2xl border border-gold/40 px-5 py-3 text-sm font-semibold text-gold hover:bg-gold/10"
            >
              View boost packs
            </Link>
          </div>
          {doneId ? (
            <div className="glass rounded-3xl border border-neon/30 p-6 text-sm text-white">
              <div className="font-display text-lg font-bold text-neon">Live on your device</div>
              <p className="mt-2 text-muted">
                Listing <span className="text-white">{doneId}</span> is now in your local marketplace. Visit Browse to see it.
              </p>
              <Link className="mt-4 inline-flex text-electric hover:text-white" to="/browse">
                Go to Browse →
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
