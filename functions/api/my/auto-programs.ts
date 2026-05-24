import type { Env } from "../_lib";
import { badRequest, json, now } from "../_lib";
import { requireUser } from "../_session";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(context.request.url);
    const includeDismissed = url.searchParams.get("includeDismissed") === "true";

    const query = includeDismissed
      ? `SELECT id, domain, program_name, signup_url, detection_score, dismissed, created_at
         FROM auto_detected_programs WHERE user_id = ? ORDER BY detection_score DESC LIMIT 50`
      : `SELECT id, domain, program_name, signup_url, detection_score, created_at
         FROM auto_detected_programs WHERE user_id = ? AND dismissed = 0 ORDER BY detection_score DESC LIMIT 50`;

    const rows = await context.env.DB.prepare(query).bind(user.id).all<any>();

    const programs = (rows.results ?? []).map((r: any) => ({
      id: r.id,
      domain: r.domain,
      name: r.program_name,
      signupUrl: r.signup_url,
      score: r.detection_score,
      dismissed: r.dismissed,
      createdAt: r.created_at,
    }));

    return json({ ok: true, programs });
  } catch (e) {
    console.error("Auto programs error:", e);
    return json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await context.request.json() as { action: 'dismiss' | 'quick_submit'; programId?: string; referralData?: any };
    const { action, programId, referralData } = body;

    if (action === "dismiss") {
      if (!programId) return badRequest("programId required");
      await context.env.DB.prepare(
        "UPDATE auto_detected_programs SET dismissed = 1 WHERE id = ? AND user_id = ?"
      )
        .bind(programId, user.id)
        .run();
      return json({ ok: true });
    }

    if (action === "quick_submit") {
      if (!referralData) return badRequest("referralData required");
      const { domain, title, description, url, category, tags, imageUrl } = referralData;
      if (!title || !url) return badRequest("title and url required");

      const id = `ref_${Date.now()}`;
      const ts = now();
      const tagsJson = JSON.stringify(tags ?? []);

      await context.env.DB.prepare(
        `INSERT INTO referrals (id, user_id, title, description, url, category, tags_json, image_url, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'public_candidate', ?, ?)`
      )
        .bind(id, user.id, title, description ?? "", url, category ?? "general", tagsJson, imageUrl ?? "", ts, ts)
        .run();

      // Mark program as submitted
      if (programId) {
        await context.env.DB.prepare(
          "UPDATE auto_detected_programs SET dismissed = 1 WHERE id = ? AND user_id = ?"
        )
          .bind(programId, user.id)
          .run();
      }

      return json({ ok: true, referralId: id });
    }

    return badRequest("Invalid action");
  } catch (e) {
    console.error("Auto programs POST error:", e);
    return json({ ok: false, error: String(e) }, { status: 500 });
  }
}
