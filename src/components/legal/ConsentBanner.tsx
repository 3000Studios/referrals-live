import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CONSENT_KEY = "rl-ad-consent";

export function ConsentBanner() {
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    setChoice(window.localStorage.getItem(CONSENT_KEY));
  }, []);

  const choose = (value: "accepted" | "declined") => {
    window.localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new CustomEvent("rl-ad-consent", { detail: value }));
    setChoice(value);
  };

  if (choice) return null;
  return (
    <aside className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-2xl rounded-2xl border border-white/15 bg-[#06080b]/95 p-4 shadow-2xl backdrop-blur-xl" aria-label="Privacy choices">
      <p className="text-sm leading-relaxed text-white/85">
        We use essential session storage and may use advertising technology when configured. Choose whether to allow advertising cookies. See our <Link to="/privacy" className="text-neon underline">Privacy Policy</Link>.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => choose("declined")} className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white">Decline ads</button>
        <button type="button" onClick={() => choose("accepted")} className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-black">Allow ads</button>
      </div>
    </aside>
  );
}
