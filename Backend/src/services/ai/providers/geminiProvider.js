/**
 * Google Gemini Cloud Provider
 * Uses GEMINI_API_KEY and configurable GEMINI_MODEL (defaults to gemini-1.5-flash)
 */
class GeminiProvider {
  name = 'gemini';

  getModel() {
    return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  getApiKey() {
    return process.env.GEMINI_API_KEY;
  }

  isConfigured() {
    return Boolean(this.getApiKey());
  }

  async generate(task, promptText) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment.');
    }

    const model = this.getModel();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error (HTTP ${response.status}): ${errBody.slice(0, 300)}`);
    }

    const json = await response.json();
    const candidate = json.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini API returned an empty response.');
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      // If markdown backticks were returned, strip them
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const usage = json.usageMetadata || {};
    const tokens = {
      promptTokens: usage.promptTokenCount || 0,
      completionTokens: usage.candidatesTokenCount || 0,
      totalTokens: usage.totalTokenCount || 0,
    };

    return {
      data: parsed,
      tokens,
      latencyMs,
      model,
    };
  }
}

module.exports = new GeminiProvider();
