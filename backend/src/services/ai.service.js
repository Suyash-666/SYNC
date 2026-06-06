const fetch = require('node-fetch');
const { AI_API_KEY, AI_BASE_URL, AI_MODEL } = require('../config/env');

class AIService {
  async chat(messages) { throw new Error('Not implemented'); }
  async generateStudyPlan(context) { throw new Error('Not implemented'); }
  async summarize(text) { throw new Error('Not implemented'); }
}

// OpenAI-compatible adapter. Works against any provider that exposes a
// /v1/chat/completions endpoint with the OpenAI request/response shape —
// OpenAI itself, xAI (Grok), Together, Groq, etc. Configure via env:
//
//   Groq:   AI_BASE_URL=https://api.groq.com/openai/v1   AI_MODEL=llama-3.3-70b-versatile
//   xAI:    AI_BASE_URL=https://api.x.ai/v1              AI_MODEL=grok-2-latest
//   OpenAI: AI_BASE_URL=https://api.openai.com/v1        AI_MODEL=gpt-4o-mini
//
// The default configuration targets Groq, which is the demo project
// referenced in CHECKPOINT_5*. The request body mirrors the standalone
// demo exactly: { model, messages }, Authorization: Bearer <key>.
class OpenAIAdapter extends AIService {
  constructor() {
    super();
    this.key = AI_API_KEY;
    this.baseUrl = (AI_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
    this.model = AI_MODEL || 'llama-3.3-70b-versatile';
  }

  async chat(messages) {
    if (!this.key) {
      return { text: 'Hello — this is a placeholder AI response (no API key configured).' };
    }

    // AbortController so a hung provider cannot pin a request forever.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);

    let res;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: this.model, messages }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error('AI provider request timed out after 60s');
      }
      throw new Error(`AI provider request failed: ${err.message}`);
    }
    clearTimeout(timer);

    // node-fetch 2 does not throw on non-2xx — read text first so we can
    // surface the raw provider error message in the logs.
    const raw = await res.text();
    let j;
    try { j = raw ? JSON.parse(raw) : {}; } catch { j = { raw }; }

    if (!res.ok) {
      const msg = j?.error?.message || j?.message || raw || `HTTP ${res.status}`;
      console.error('[ai.service] Provider error', res.status, msg);
      throw new Error(`AI provider error (${res.status}): ${msg}`);
    }

    const text = j?.choices?.[0]?.message?.content;
    if (!text) {
      // Wrong model name, content filter, or empty completion. Log the
      // full payload so the user can see why the model returned nothing.
      console.error('[ai.service] Empty completion from provider:', JSON.stringify(j, null, 2));
      throw new Error('AI provider returned no content. Check backend logs for the raw response.');
    }
    return { text };
  }

  async generateStudyPlan(context) {
    if (!this.key) return { plan: [{ day: 'Day 1', tasks: ['Study placeholder'] }] };
    const prompt = [
      { role: 'system', content: 'You are SYNC study assistant. Produce concise structured JSON study plan.' },
      { role: 'user', content: `Build a study plan given context: ${JSON.stringify(context)}` },
    ];
    const out = await this.chat(prompt);
    return { plan: out.text };
  }

  async summarize(text) {
    if (!this.key) return { summary: text.slice(0, 200) };
    const prompt = [
      { role: 'system', content: 'Summarize the following text concisely.' },
      { role: 'user', content: text },
    ];
    const out = await this.chat(prompt);
    return { summary: out.text };
  }
}

const adapter = new OpenAIAdapter();
module.exports = { AIService, adapter };
