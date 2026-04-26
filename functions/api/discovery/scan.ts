import { json, serverError, now } from "../_lib";
import type { Env } from "../_lib";

export async function onRequestPost(context: { request: Request; env: any }) {
  const url = new URL(context.request.url);
  const filter = url.searchParams.get("filter") || "all";
  const apiKey = context.env.GEMINI_API_KEY;

  if (!apiKey) {
    return serverError("GEMINI_API_KEY is not configured.");
  }

  // Define the prompt for Gemini
  const prompt = `Find the top 25 best and most popular referral programs for the category: "${filter}". 
Return the result as a valid JSON array of objects. 
Each object must have these fields:
- title: Name of the company/program
- description: A short engaging summary (max 150 chars)
- url: Official referral or sign-up page URL
- category: One of: finance, tech, travel, shopping, saas, crypto, food, lifestyle
- tags: Array of 3 keywords
- signup_requirements: Briefly what it takes to sign up (e.g. "Create account + deposit $10")
- reward_details: What the referrer gets (e.g. "$25 credit")
- score: An integer 1-100 based on popularity/value

Focus on high-signal programs like Dropbox, Wise, Shopify, Airbnb, etc., tailored to the filter. 
Only return the JSON array, no other text.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const result = await response.json() as any;
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty AI response");

    const programs = JSON.parse(text) as any[];
    const ts = now();
    const stmts: any[] = [];

    for (const p of programs) {
      const id = `discover-${p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      // Note: We use the description field to store combined info if the new columns don't exist yet, 
      // but here we try to use them if we think they were added.
      // For safety, we'll append requirements/rewards to description for now since migration failed.
      const fullDescription = `${p.description}\n\nRequirements: ${p.signup_requirements}\nReward: ${p.reward_details}`;
      
      stmts.push(
        context.env.DB.prepare(
          `INSERT OR REPLACE INTO ingested_offers 
           (id, source, source_url, canonical_key, title, description, url, category, tags_json, image_url, score, created_at, updated_at)
           VALUES (?, 'discovery_scan', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          p.url,
          `scan:${id}`,
          p.title,
          fullDescription,
          p.url,
          p.category.toLowerCase(),
          JSON.stringify(p.tags),
          `https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=800&q=80`, // Placeholder or AI could generate?
          p.score || 50,
          ts,
          ts
        )
      );
    }

    await context.env.DB.batch(stmts);

    return json({ ok: true, results: programs });
  } catch (err: any) {
    return serverError(err.message);
  }
}
