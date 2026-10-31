const crypto = require('crypto');
const AiRun = require('../models/AiRun');

/**
 * Nebula Central AI Provider Service
 * Enforces structured schema generation, provider abstraction, audit logging to AiRun,
 * and honest fallbacks that never fabricate financial data.
 */

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

/**
 * Computes SHA-256 hash of input text or buffer
 */
function hashInput(input) {
  try {
    const str = typeof input === 'string' ? input : JSON.stringify(input);
    return crypto.createHash('sha256').update(str).digest('hex');
  } catch {
    return '';
  }
}

/**
 * Parse Receipt Image via Multimodal Gemini Vision
 */
async function scanReceiptVision({
  organizationId,
  userId,
  receiptBase64,
  mimeType = 'image/jpeg',
  categoryNames = [],
  claimId = null,
}) {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  const model = DEFAULT_MODEL;
  const inputHash = hashInput(receiptBase64 ? receiptBase64.slice(0, 500) : '');

  // If API key is available, attempt Gemini Vision extraction
  if (apiKey && receiptBase64) {
    try {
      const cleanBase64 = receiptBase64.replace(/^data:[^;]+;base64,/, '');

      const prompt = `Analyze this expense receipt or invoice and extract the transaction details in strict JSON format.
Do NOT output markdown backticks or any conversational text. Output only a valid raw JSON object with these keys:
{
  "merchant": "Name of the business or vendor",
  "expenseDate": "YYYY-MM-DD",
  "amount": 12.34,
  "taxAmount": 1.23,
  "currency": "USD",
  "description": "Short summary of goods/services purchased",
  "suggestedCategory": "${categoryNames.length ? categoryNames[0] : 'General'}",
  "confidence": 0.95
}
Available categories to choose for 'suggestedCategory': ${JSON.stringify(categoryNames)}.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType,
                      data: cleanBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      );

      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        const json = await response.json();
        const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const extracted = JSON.parse(cleanJson);

        // Audit log success in AiRun
        if (organizationId) {
          await AiRun.create({
            organizationId,
            userId,
            task: 'expense_receipt_scan',
            promptVersion: 'v2',
            model,
            provider: 'gemini',
            inputHash,
            output: extracted,
            latencyMs,
            entityType: 'ExpenseClaim',
            entityId: claimId || null,
          }).catch((e) => console.warn('AiRun audit log error:', e.message));
        }

        return {
          success: true,
          provider: 'gemini',
          model,
          extractedData: {
            merchant: extracted.merchant || '',
            expenseDate: extracted.expenseDate || new Date().toISOString().split('T')[0],
            amount: typeof extracted.amount === 'number' ? extracted.amount : 0,
            taxAmount: typeof extracted.taxAmount === 'number' ? extracted.taxAmount : 0,
            currency: extracted.currency || 'USD',
            description: extracted.description || '',
            suggestedCategory: extracted.suggestedCategory || '',
            confidence: extracted.confidence || 0.9,
            isAiExtracted: true,
            needsManualReview: false,
          },
        };
      }
    } catch (err) {
      console.warn('Gemini vision API error, switching to honest fallback:', err.message);
    }
  }

  // Honest Fallback: Never invent realistic numbers or merchant guesses
  const latencyMs = Date.now() - startTime;
  const fallbackOutput = {
    merchant: '',
    expenseDate: new Date().toISOString().split('T')[0],
    amount: 0,
    taxAmount: 0,
    currency: 'USD',
    description: '',
    suggestedCategory: categoryNames.length ? categoryNames[0] : 'General',
    confidence: 0,
    isAiExtracted: false,
    isFallback: true,
    needsManualReview: true,
    notice: 'AI extraction unavailable. Please enter details manually.',
  };

  if (organizationId) {
    await AiRun.create({
      organizationId,
      userId,
      task: 'expense_receipt_scan',
      promptVersion: 'v2',
      model: 'fallback',
      provider: 'fallback',
      inputHash,
      output: fallbackOutput,
      latencyMs,
      entityType: 'ExpenseClaim',
      entityId: claimId || null,
    }).catch(() => {});
  }

  return {
    success: true,
    provider: 'fallback',
    model: 'honest_fallback',
    extractedData: fallbackOutput,
  };
}

/**
 * Natural Language Expense Parser (X3)
 * Converts text like "Lunch with Acme Corp $85 yesterday" into structured expense items
 */
async function parseNaturalLanguageExpense({
  organizationId,
  userId,
  text,
  categoryNames = [],
}) {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  const model = DEFAULT_MODEL;
  const inputHash = hashInput(text || '');
  const todayStr = new Date().toISOString().split('T')[0];

  if (apiKey && text && text.trim()) {
    try {
      const prompt = `You are an enterprise expense parsing assistant. Extract expense details from this natural language text:
"${text.trim()}"

Today's date is: ${todayStr}.
Available expense categories: ${JSON.stringify(categoryNames)}.

Output ONLY a valid raw JSON object without markdown or conversational wrappers with the following keys:
{
  "merchant": "Vendor / merchant name",
  "amount": 12.34,
  "currency": "USD",
  "expenseDate": "YYYY-MM-DD",
  "description": "Clear description of expense",
  "suggestedCategory": "Category from list",
  "isBillable": false,
  "clientName": "Client name if mentioned or empty string",
  "confidence": 0.92
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      );

      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        const json = await response.json();
        const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (organizationId) {
          await AiRun.create({
            organizationId,
            userId,
            task: 'natural_language_expense_parse',
            promptVersion: 'v1',
            model,
            provider: 'gemini',
            inputHash,
            output: parsed,
            latencyMs,
          }).catch(() => {});
        }

        return {
          success: true,
          provider: 'gemini',
          model,
          parsedData: {
            merchant: parsed.merchant || 'General Merchant',
            amount: typeof parsed.amount === 'number' ? parsed.amount : 0,
            currency: (parsed.currency || 'USD').toUpperCase(),
            expenseDate: parsed.expenseDate || todayStr,
            description: parsed.description || text.trim(),
            suggestedCategory: parsed.suggestedCategory || (categoryNames[0] || 'General'),
            isBillable: Boolean(parsed.isBillable),
            clientName: parsed.clientName || '',
            confidence: parsed.confidence || 0.85,
          },
        };
      }
    } catch (err) {
      console.warn('Gemini text parser error, falling back to heuristic:', err.message);
    }
  }

  // Heuristic regex fallback for offline/no-key mode
  const clean = text ? text.trim() : '';
  const amountMatch = clean.match(/(?:[$€£₹]|USD|EUR|GBP|INR)?\s*(\d+(?:\.\d{1,2})?)\s*(?:USD|EUR|GBP|INR)?/i);
  const foundAmount = amountMatch ? parseFloat(amountMatch[1]) : 0;

  let foundCurrency = 'USD';
  if (/€|EUR/i.test(clean)) foundCurrency = 'EUR';
  else if (/£|GBP/i.test(clean)) foundCurrency = 'GBP';
  else if (/₹|INR/i.test(clean)) foundCurrency = 'INR';

  return {
    success: true,
    provider: 'heuristic_fallback',
    model: 'regex',
    parsedData: {
      merchant: clean.split(' ')[0] || 'Expense',
      amount: foundAmount,
      currency: foundCurrency,
      expenseDate: todayStr,
      description: clean,
      suggestedCategory: categoryNames[0] || 'General',
      isBillable: /client|customer/i.test(clean),
      clientName: '',
      confidence: foundAmount > 0 ? 0.5 : 0.2,
      isFallback: true,
    },
  };
}

module.exports = {
  scanReceiptVision,
  parseNaturalLanguageExpense,
  hashInput,
};
