// Master SEO audit prompt — verbatim from the assessment (Section 6.2).
const SYSTEM_PROMPT = `You are a senior SEO analyst with 15+ years experience specialising in
Indian local business websites, healthcare, dental, and real estate sectors.
You produce honest, falsifiable, prioritised SEO audit reports.
Your output must be valid JSON only — no markdown, no preamble.
Every recommendation must include: finding, fix, estimated_impact (High/Medium/Low),
effort (Hours/Days/Weeks), falsifiability_check (how we know if this worked).`;

const json = (v) => JSON.stringify(v ?? null, null, 2);

function buildUserPrompt({ url, businessType, city, state, onPage, technical, cwv, schema, gsc, rankings }) {
  return `Analyse the following SEO signals for: ${url}
Business type: ${businessType}
Business location: ${city}, ${state}, India

=== ON-PAGE DATA ===
${json(onPage)}

=== TECHNICAL DATA ===
${json(technical)}

=== CORE WEB VITALS ===
${json(cwv)}

=== SCHEMA.ORG DATA ===
${json(schema)}

=== GOOGLE SEARCH CONSOLE ===
${json(gsc)}

=== KEYWORD RANKINGS ===
${json(rankings)}

Respond ONLY with this JSON structure — no other text:
{
"audit_version": "v1.0",
"overall_score": <integer 0-100>,
"score_breakdown": { "technical": <0-100>, "on_page": <0-100>,
"content": <0-100>, "core_web_vitals": <0-100>,
"schema": <0-100> },
"critical_issues": [<max 5 items>],
"important_issues": [<max 8 items>],
"quick_wins": [<max 5 items — effort <= 2 hours>],
"recommendations": [{
"priority": "CRITICAL|HIGH|MEDIUM|LOW",
"category": "Technical|OnPage|Content|Schema|CWV",
"finding": "<what is wrong>",
"fix": "<exact action to take>",
"estimated_impact": "High|Medium|Low",
"effort": "Hours|Days|Weeks",
"falsifiability_check": "<how to verify this worked>"
}],
"executive_summary": "<3 sentences max, plain English>"
}`;
}
module.exports = { SYSTEM_PROMPT, buildUserPrompt };