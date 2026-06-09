/**
 * Content Automation — Referrals.live
 * Generates an SEO blog article about referral marketing, affiliate programs,
 * passive income, and cashback strategies, then appends it to
 * src/data/blogArticles.ts (the blogArticles array).
 */

const fs = require('fs');
const path = require('path');

const BLOG_FILE = path.join(__dirname, '..', '..', 'src', 'data', 'blogArticles.ts');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set');
  process.exit(1);
}

const TOPICS = [
  'How to build a referral income dashboard that tracks every payout',
  'The best cashback apps for everyday spending in {year}',
  'Recurring affiliate commissions: programs that pay monthly',
  'How to write referral content that ranks on Google',
  'Side hustle stacking: combining referral programs with freelance income',
  'Bank bonus hunting: a step-by-step starter guide',
  'How to turn your social media audience into referral revenue',
  'Affiliate link management tools compared for {year}',
  'Tax implications of referral and affiliate income explained',
  'Building a niche referral site from scratch in 30 days',
  'How cashback browser extensions actually work behind the scenes',
  'Referral program red flags: what to avoid before promoting',
  'The psychology behind why people click referral links',
  'How to negotiate better affiliate commission rates',
  'Email sequences that convert subscribers into referral clicks',
  'Seasonal referral strategies: maximizing holiday bonus offers',
  'Passive income milestones: from first dollar to first thousand',
  'How creators monetize audiences with referral partnerships',
  'Micro-influencer referral strategies that outperform big accounts',
  'Building trust with financial product recommendations',
];

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
    }),
  });
  const data = await res.json();
  if (!data.candidates || !data.candidates[0]) {
    console.error('Gemini response error:', JSON.stringify(data, null, 2));
    return null;
  }
  return data.candidates[0].content.parts[0].text;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeTS(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

async function main() {
  const source = fs.readFileSync(BLOG_FILE, 'utf-8');

  // Extract existing slugs to avoid duplicates
  const slugRegex = /slug:\s*["']([^"']+)["']/g;
  const existingSlugs = new Set();
  let m;
  while ((m = slugRegex.exec(source)) !== null) {
    existingSlugs.add(m[1]);
  }

  // Extract existing titles
  const titleRegex = /title:\s*["']([^"']+)["']/g;
  const existingTitles = new Set();
  while ((m = titleRegex.exec(source)) !== null) {
    existingTitles.add(m[1].toLowerCase());
  }

  const year = new Date().getFullYear();
  const availableTopics = TOPICS
    .map((t) => t.replace('{year}', String(year)))
    .filter((t) => !existingTitles.has(t.toLowerCase()));

  if (availableTopics.length === 0) {
    console.log('All seed topics already used. Skipping.');
    return;
  }

  const topic = availableTopics[Math.floor(Math.random() * availableTopics.length)];

  const prompt = `You are a senior content writer for Referrals.live, a curated referral and affiliate marketing platform.

Write a blog article about: "${topic}"

Requirements:
- SEO-optimized title (may differ slightly from the topic)
- 1-2 sentence excerpt
- Keywords array (4-6 relevant SEO keywords)
- Read time in format like "10 min"
- 3-4 sections, each with a heading and 2-3 body paragraphs
- 2-3 FAQ items with question and answer
- Content must be practical, honest, and compliance-aware
- No fabricated statistics or fake claims

Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "title": "string",
  "excerpt": "string",
  "keywords": ["string"],
  "readTime": "string",
  "sections": [
    {
      "heading": "string",
      "body": ["paragraph1", "paragraph2", "paragraph3"]
    }
  ],
  "faq": [
    { "q": "string", "a": "string" }
  ]
}`;

  const raw = await callGemini(prompt);
  if (!raw) {
    console.log('No response from Gemini. Skipping.');
    return;
  }

  let post;
  try {
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    post = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Gemini response:', raw);
    return;
  }

  const slug = slugify(post.title);
  if (existingSlugs.has(slug)) {
    console.log(`Slug "${slug}" already exists. Skipping.`);
    return;
  }

  const date = new Date().toISOString().split('T')[0];

  // Build the TypeScript object as a string
  const sectionsStr = post.sections
    .map((s) => {
      const bodyLines = s.body.map((b) => `          "${escapeTS(b)}",`).join('\n');
      return `      {\n        heading: "${escapeTS(s.heading)}",\n        body: [\n${bodyLines}\n        ],\n      }`;
    })
    .join(',\n');

  const faqStr = post.faq
    ? post.faq
        .map((f) => `      {\n        q: "${escapeTS(f.q)}",\n        a: "${escapeTS(f.a)}",\n      }`)
        .join(',\n')
    : '';

  const newEntry = `  {
    slug: "${slug}",
    title: "${escapeTS(post.title)}",
    excerpt:
      "${escapeTS(post.excerpt)}",
    date: "${date}",
    readTime: "${post.readTime || '10 min'}",
    keywords: [${post.keywords.map((k) => `"${escapeTS(k)}"`).join(', ')}],
    embeds: [E("Browse programs", "https://referrals.live/browse"), E("Read more guides", "https://referrals.live/blog")],
    sections: [
${sectionsStr},
    ],${
      faqStr
        ? `\n    faq: [\n${faqStr},\n    ],`
        : ''
    }
  },`;

  // Insert before the closing ]; of the blogArticles array
  // Find the position of the last object in the array and the closing ];
  const closingPattern = /\n];\s*\n\s*export function getArticleBySlug/;
  if (!closingPattern.test(source)) {
    console.error('Could not find insertion point in blogArticles.ts');
    return;
  }

  const updated = source.replace(closingPattern, `\n${newEntry}\n];\n\nexport function getArticleBySlug`);
  fs.writeFileSync(BLOG_FILE, updated, 'utf-8');
  console.log(`Generated blog article: "${post.title}" (slug: ${slug})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
