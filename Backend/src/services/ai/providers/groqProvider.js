/**
 * Groq Cloud AI Provider
 * Integrates Groq LPU Ultra-Low Latency Inference
 * Uses GROQ_API_KEY and configurable GROQ_MODEL (defaults to llama-3.3-70b-versatile)
 */
class GroqProvider {
  name = 'groq';

  getModel() {
    return process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  }

  getApiKey() {
    return process.env.GROQ_API_KEY;
  }

  isConfigured() {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0 && key !== 'your_groq_api_key_here');
  }

  async generate(task, promptText) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured in environment.');
    }

    const model = this.getModel();
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert enterprise recruitment intelligence AI. You MUST respond with pure, valid JSON matching the user schema. Do NOT wrap in markdown codeblocks (no ```json). Do NOT output conversational preamble or postscript.',
          },
          {
            role: 'user',
            content: promptText,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Groq API error (HTTP ${response.status}): ${errBody.slice(0, 300)}`);
    }

    const json = await response.json();
    const choice = json.choices?.[0];
    const rawContent = choice?.message?.content;

    if (!rawContent) {
      throw new Error('Groq API returned an empty response.');
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseErr) {
      // Strip markdown wrapper if model accidentally included it
      const cleaned = rawContent
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    }

    const usage = json.usage || {};
    const tokens = {
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    };

    return {
      data: parsed,
      tokens,
      latencyMs,
      model,
    };
  }
}

module.exports = new GroqProvider();
