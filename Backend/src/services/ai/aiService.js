const crypto = require('crypto');
const groqProvider = require('./providers/groqProvider');
const geminiProvider = require('./providers/geminiProvider');
const fallbackProvider = require('./providers/fallbackProvider');
const AiRun = require('../../models/AiRun');
const RecruitmentSettings = require('../../models/RecruitmentSettings');

// Prompt registry mapping
const promptRegistry = {
  linked_in_post: require('./prompts/linkedInPost.v1'),
  resume_parser: require('./prompts/resumeParser.v1'),
  match_scoring: require('./prompts/matchScore.v1'),
  jd_generator: require('./prompts/jdGenerator.v1'),
  multi_channel_post: require('./prompts/multiChannelPost.v1'),
  interview_question_kit: require('./prompts/interviewQuestions.v1'),
  recruiter_copilot: require('./prompts/recruiterCopilot.v1'),
};

class AiService {
  /**
   * Universal AI Generation Gateway
   * @param {Object} params
   * @param {string} params.task - e.g. 'linked_in_post'
   * @param {Object} params.input - input data for the prompt
   * @param {string|ObjectId} params.organizationId
   * @param {string|ObjectId} [params.userId]
   * @param {string} [params.entityType]
   * @param {string|ObjectId} [params.entityId]
   */
  async generate({
    task,
    input,
    organizationId,
    userId = null,
    entityType = '',
    entityId = null,
  }) {
    const promptDef = promptRegistry[task];
    if (!promptDef) {
      throw new Error(`Unregistered AI task: "${task}". Please register prompt in promptRegistry.`);
    }

    // 1. Verify tenant settings if organizationId provided
    if (organizationId) {
      const settings = await RecruitmentSettings.findOne({ organizationId });
      if (settings && !settings.aiEnabled) {
        throw new Error('AI features are disabled for this organization.');
      }
    }

    // 2. Validate input schema
    const validatedInput = promptDef.inputSchema.parse(input);
    const promptText = promptDef.buildPrompt(validatedInput);
    const inputHash = crypto.createHash('sha256').update(promptText).digest('hex');

    let outputData = null;
    let providerName = 'groq';
    let modelName = groqProvider.getModel();
    let tokens = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let latencyMs = 0;

    // 3. Try Groq Provider first if configured
    if (groqProvider.isConfigured()) {
      try {
        const result = await groqProvider.generate(task, promptText);
        const validatedOutput = promptDef.outputSchema.parse(result.data);
        outputData = validatedOutput;
        tokens = result.tokens;
        latencyMs = result.latencyMs;
        modelName = result.model;
        providerName = 'groq';
      } catch (groqErr) {
        console.warn(`[AiService] Groq provider failed for task "${task}": ${groqErr.message}. Trying next provider.`);
      }
    }

    // 4. Try Gemini Provider if Groq was not used or failed
    if (!outputData && geminiProvider.isConfigured()) {
      try {
        const result = await geminiProvider.generate(task, promptText);
        // Validate with Zod outputSchema
        const validatedOutput = promptDef.outputSchema.parse(result.data);
        outputData = validatedOutput;
        tokens = result.tokens;
        latencyMs = result.latencyMs;
        modelName = result.model;
        providerName = 'gemini';
      } catch (geminiErr) {
        console.warn(`[AiService] Gemini provider failed for task "${task}": ${geminiErr.message}. Falling back to deterministic engine.`);
      }
    }

    // 5. Fallback Provider if all external providers failed or unconfigured
    if (!outputData) {
      const startFallback = Date.now();
      const fallbackResult = await fallbackProvider.generate(task, validatedInput);
      outputData = promptDef.outputSchema.parse(fallbackResult);
      latencyMs = Date.now() - startFallback;
      providerName = 'fallback';
      modelName = 'local-template-v1';
    }

    // 5. Audit Log to AiRun
    if (organizationId) {
      try {
        await AiRun.create({
          organizationId,
          userId,
          task,
          promptVersion: promptDef.version || 'v1',
          model: modelName,
          provider: providerName,
          inputHash,
          output: outputData,
          tokens,
          latencyMs,
          cost: 0,
          entityType,
          entityId,
          humanDisposition: 'pending',
        });

        // Update token usage if tokens consumed
        if (tokens.totalTokens > 0) {
          await RecruitmentSettings.findOneAndUpdate(
            { organizationId },
            { $inc: { aiTokensUsedThisMonth: tokens.totalTokens } },
            { upsert: true }
          );
        }
      } catch (logErr) {
        console.error('[AiService] Failed to record AiRun audit log:', logErr.message);
      }
    }

    return {
      success: true,
      provider: providerName,
      model: modelName,
      data: outputData,
    };
  }
}

module.exports = new AiService();
