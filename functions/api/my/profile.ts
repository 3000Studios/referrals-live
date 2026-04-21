import type { Env } from "../_lib";
import { badRequest, json, now, parseJson } from "../_lib";
import { requireUser } from "../_session";

type Body = { displayName?: string; avatar?: string; color?: string };

const ALLOWED_AVATARS = ["spark", "cube", "bolt", "crown", "ghost", "star", "wave"];
const ALLOWED_COLORS = ["neon", "electric", "gold", "purple", "white"];

export async function onRequestGet(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const row = await context.env.DB.prepare("SELECT display_name, avatar, color FROM users WHERE id=? LIMIT 1")
    .bind(user.id)
    .first<any>();

  return json({
    ok: true,
    profile: {
      displayName: row?.display_name ?? user.displayName,
      avatar: row?.avatar ?? null,
      color: row?.color ?? null,
    },
    allowed: { avatars: ALLOWED_AVATARS, colors: ALLOWED_COLORS },
  });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await parseJson<Body>(context.request);
  const displayName = (body.displayName ?? "").trim();
  const avatar = (body.avatar ?? "").trim();
  const color = (body.color ?? "").trim();

  if (displayName && displayName.length > 32) return badRequest("Display name too long.");
  if (avatar && !ALLOWED_AVATARS.includes(avatar)) return badRequest("Invalid avatar.");
  if (color && !ALLOWED_COLORS.includes(color)) return badRequest("Invalid color.");

  await context.env.DB.prepare("UPDATE users SET display_name=COALESCE(?, display_name), avatar=COALESCE(?, avatar), color=COALESCE(?, color) WHERE id=?")
    .bind(displayName || null, avatar || null, color || null, user.id)
    .run();

  await context.env.DB.prepare("INSERT INTO audit_log (id, user_id, action, meta_json, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(`audit-${crypto.randomUUID()}`, user.id, "profile_update", JSON.stringify({ displayName, avatar, color }), now())
    .run();

  return json({ ok: true });
}

