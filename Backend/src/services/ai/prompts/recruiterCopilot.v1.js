const { z } = require('zod');

const inputSchema = z.object({
  action: z.enum(['summarize_dossier', 'compare_candidates', 'briefing_notes']).default('summarize_dossier'),
  candidateName: z.string().optional().default('Candidate'),
  jobTitle: z.string().optional().default('Open Position'),
  candidateNames: z.array(z.string()).optional().default([]),
  scorecards: z.array(z.any()).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(''),
});

const outputSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  keyStrengths: z.array(z.string()),
  areasOfConcern: z.array(z.string()),
  overallRecommendation: z.string(),
  suggestedNextSteps: z.array(z.string()),
});

function buildPrompt(input) {
  return `
You are the Nebula AI Recruiter Copilot, an elite executive talent advisor and calibrated hiring analyst.
Perform the following recruitment intelligence task:

ACTION: ${input.action}
TARGET ROLE: ${input.jobTitle}
PRIMARY CANDIDATE: ${input.candidateName}
ADDITIONAL CANDIDATES (if comparison): ${input.candidateNames.join(', ')}

EVALUATOR SCORECARDS & FEEDBACK:
${JSON.stringify(input.scorecards, null, 2)}

ADDITIONAL RECRUITER NOTES & SKILLS:
${input.notes} | Skills: ${input.skills.join(', ')}

Generate an executive debrief report strictly answering:
1. Executive summary of candidate standing
2. Core verified strengths backed by observable panel evidence
3. Critical flags, score divergences, or areas of concern
4. Clear calibrated recommendation (Strong Hire / Calibrated Debrief / No Hire)
5. Actionable next steps for the hiring committee

Respond ONLY with valid JSON matching this schema:
{
  "title": "Executive Dossier Synthesis: ...",
  "executiveSummary": "...",
  "keyStrengths": ["...", "..."],
  "areasOfConcern": ["...", "..."],
  "overallRecommendation": "...",
  "suggestedNextSteps": ["...", "..."]
}
`.trim();
}

module.exports = {
  taskName: 'recruiter_copilot',
  inputSchema,
  outputSchema,
  buildPrompt,
};
