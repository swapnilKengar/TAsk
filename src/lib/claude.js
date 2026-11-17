// Step 8 — Claude analyses all signals → structured JSON (REAL or MOCK).
const { USE_MOCKS } = require('../mocks');
const mockResult = require('../mocks/claude.mock');
const { SYSTEM_PROMPT, buildUserPrompt } = require('./prompt');

const MODEL = 'claude-sonnet-4-6';

// Real Claude when a key exists AND (mocks are off OR USE_REAL_CLAUDE=true).
function shouldMock() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  return !(hasKey && (!USE_MOCKS || process.env.USE_REAL_CLAUDE === 'true'));
}

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

function extractJson(text) {
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in Claude response');
  return JSON.parse(text.slice(start, end + 1));
}

// Validate + normalise to the contract in the prompt.
function validateResult(r) {
  if (!r || typeof r !== 'object') throw new Error('Result is not an object');
  const b = r.score_breakdown || {};
  const out = {
    audit_version: r.audit_version || 'v1.0',
    overall_score: clamp(r.overall_score),
    score_breakdown: {
      technical: clamp(b.technical), on_page: clamp(b.on_page), content: clamp(b.content),
      core_web_vitals: clamp(b.core_web_vitals), schema: clamp(b.schema),
    },
    critical_issues: (r.critical_issues || []).slice(0, 5),
    important_issues: (r.important_issues || []).slice(0, 8),
    quick_wins: (r.quick_wins || []).slice(0, 5),
    recommendations: (r.recommendations || []).map((x) => ({
      priority: x.priority, category: x.category, finding: x.finding, fix: x.fix,
      estimated_impact: x.estimated_impact, effort: x.effort, falsifiability_check: x.falsifiability_check,
    })),
    executive_summary: r.executive_summary || '',
  };
  if (!out.recommendations.length) throw new Error('Result has no recommendations');
  return out;
}

async function analyseWithClaude(ctx) {
  if (shouldMock()) {
    console.log('[CLAUDE] using MOCK response');
    return { result: validateResult(mockResult), mocked: true };
  }

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const userPrompt = buildUserPrompt(ctx);

  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const msg = await client.messages.create({
        model: MODEL, max_tokens: 4096, system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const text = msg.content.filter((c) => c.type === 'text').map((c) => c.text).join('');
      return { result: validateResult(extractJson(text)), mocked: false };
    } catch (e) {
      lastErr = e;
      console.warn(`[CLAUDE] attempt ${attempt} failed: ${e.message}`);
    }
  }
  throw new Error(`Claude analysis failed: ${lastErr.message}`);
}
module.exports = { analyseWithClaude, validateResult, MODEL };