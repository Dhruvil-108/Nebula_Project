const { z } = require('zod');

const interviewQuestionsInputSchema = z.object({
  jobTitle: z.string(),
  skills: z.array(z.string()).default([]),
  experienceLevel: z.string().default('mid'),
  candidateSkills: z.array(z.string()).default([]),
  candidateGaps: z.array(z.string()).default([]),
  roundType: z.string().default('technical'),
});

const interviewQuestionItemSchema = z.object({
  competency: z.string(),
  question: z.string(),
  probeFollowUp: z.string(),
  whatToLookFor: z.string(),
  redFlags: z.string(),
});

const interviewQuestionsOutputSchema = z.object({
  roundType: z.string(),
  questions: z.array(interviewQuestionItemSchema).min(3),
  interviewerTips: z.array(z.string()).default([]),
});

const buildPrompt = (input) => {
  const {
    jobTitle,
    skills,
    experienceLevel,
    candidateSkills,
    candidateGaps,
    roundType,
  } = input;

  return `You are an expert technical interviewer and talent acquisition specialist.
Generate a structured, competency-based interview question kit tailored to evaluate a candidate for the following role.

ROLE DETAILS:
- Position: ${jobTitle}
- Target Seniority: ${experienceLevel}
- Key Required Skills: ${skills.join(', ') || 'General Engineering'}
- Interview Round Type: ${roundType}

CANDIDATE ASSESSMENT CONTEXT (from resume screening):
- Verified Strengths: ${candidateSkills.join(', ') || 'Not specified'}
- Identified Competency Gaps / Verification Areas: ${candidateGaps.join(', ') || 'None identified'}

TASK:
Produce 4 to 5 rigorous, practical interview questions designed to test both domain mastery and the specific identified gaps.
For each question, provide:
1. "competency": The core skill or behavior evaluated.
2. "question": A scenario or deep-dive technical question (avoid generic trivia).
3. "probeFollowUp": A follow-up question to probe depth of hands-on experience.
4. "whatToLookFor": Concrete indicators of a strong, senior-level response.
5. "redFlags": Warning signs of superficial knowledge or poor problem solving.

OUTPUT FORMAT:
Respond with ONLY valid JSON adhering strictly to:
{
  "roundType": "${roundType}",
  "questions": [
    {
      "competency": "System Design & Caching",
      "question": "...",
      "probeFollowUp": "...",
      "whatToLookFor": "...",
      "redFlags": "..."
    }
  ],
  "interviewerTips": [
    "Allow 5 minutes for candidate clarification before starting",
    "Focus on tradeoffs rather than a single correct answer"
  ]
}`;
};

module.exports = {
  task: 'interview_question_kit',
  version: 'v1',
  inputSchema: interviewQuestionsInputSchema,
  outputSchema: interviewQuestionsOutputSchema,
  buildPrompt,
};
