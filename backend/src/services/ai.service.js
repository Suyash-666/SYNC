const fetch = require('node-fetch');
const { OPENAI_API_KEY } = require('../config/env');

class AIService {
  async chat(messages){ throw new Error('Not implemented'); }
  async generateStudyPlan(context){ throw new Error('Not implemented'); }
  async summarize(text){ throw new Error('Not implemented'); }
}

class OpenAIAdapter extends AIService{
  constructor(){ super(); this.key = OPENAI_API_KEY; this.model = 'gpt-4o-mini'; }

  async chat(messages){
    if(!this.key) return { text: 'Hello — this is a placeholder AI response (no API key configured).' };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Authorization': `Bearer ${this.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages })
    });
    const j = await res.json();
    const text = j.choices?.[0]?.message?.content || JSON.stringify(j);
    return { text };
  }

  async generateStudyPlan(context){
    if(!this.key) return { plan: [{ day: 'Day 1', tasks: ['Study placeholder'] }] };
    const prompt = [{ role: 'system', content: 'You are SYNC study assistant. Produce concise structured JSON study plan.' }, { role: 'user', content: `Build a study plan given context: ${JSON.stringify(context)}` }];
    const out = await this.chat(prompt);
    return { plan: out.text };
  }

  async summarize(text){
    if(!this.key) return { summary: text.slice(0,200) };
    const prompt = [{ role: 'system', content: 'Summarize the following text concisely.' }, { role: 'user', content: text }];
    const out = await this.chat(prompt);
    return { summary: out.text };
  }
}

const adapter = new OpenAIAdapter();
module.exports = { AIService, adapter };
