import { json } from "../_lib";

// Public AI generation is intentionally disabled. It could invent offer terms
// and publish them without source verification. Official sources are monitored
// by the scheduled worker and new offers are reviewed before publication.
export async function onRequestPost() {
  return json(
    { ok: false, error: "Automated discovery is source-verified and review-gated. Public scanning is unavailable." },
    { status: 410 },
  );
}
