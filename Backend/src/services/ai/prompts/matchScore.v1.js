const { z } = require('zod');

const matchScoreInputSchema = z.object({
  // Candidate data — MUST BE BLINDED (no name, email, phone, gender, photo, age, location)
  candidateProfile: z.object({
    skills: z.array(z.string()).default([]),
    totalExperienceYears: z.number().default(0),
    summary: z.string().optional().default(''),
    workHistory: z.array(z.any()).optional().default([]),
    education: z.array(z.any()).optional().default([]),
  }),
  jobRequirements: z.object({
    title: z.string(),
    experienceLevel: z.string().default('mid'),
    requirements: z.array(z.string()).default([]),
    skills: z.array(z.string()).default([]),
    description: z.string().optional().default(''),
  }),
});

const matchScoreOutputSchema = z.object({
  score: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  experienceFit: z.enum(['under_qualified', 'good_fit', 'perfect_fit', 'over_qualified']).default('good_fit'),
  recommendation: z.string(),
  evidenceCitations: z.array(z.string()).default([]),
});

const buildPrompt = (input) => {
  const { candidateProfile, jobRequirements } = input;

  return `You are an algorithmic fairness, bias-free technical recruitment matching assistant.
Evaluate the blinded candidate profile against the job vacancy requirements.

IMPORTANT FAIRNESS DIRECTIVE:
You are evaluating solely on verified technical skills, relevant work accomplishments, and depth of domain experience.
All demographic indicators (name, gender, age, nationality, photo, address) have been stripped.
Focus strictly on merit, competency overlap, and required experience level.

Job Position Details:
- Title: ${jobRequirements.title}
- Target Seniority: ${jobRequirements.experienceLevel}
- Required Competencies / Skills: ${jobRequirements.skills.join(', ') || 'Not specified'}
- Job Requirements & Responsibilities:
${jobRequirements.requirements.map((r) => `  • ${r}`).join('\n') || '  • Standard domain duties'}

Blinded Candidate Profile:
- Total Experience: ${candidateProfile.totalExperienceYears} years
- Candidate Skills: ${candidateProfile.skills.join(', ') || 'None listed'}
- Candidate Summary: ${candidateProfile.summary || 'None provided'}
- Career Highlights / Work Record:
${JSON.stringify(candidateProfile.workHistory || []).slice(0, 3000)}

Scoring Guidelines:
1. "score": An objective integer from 0 to 100 calculating skill overlap (50%), experience depth fit (30%), and domain relevance (20%).
2. "matchedSkills": Array of candidate skills that directly satisfy the job requirements.
3. "missingSkills": Key mandatory job skills absent from candidate profile.
4. "experienceFit": One of 'under_qualified', 'good_fit', 'perfect_fit', 'over_qualified'.
5. "recommendation": Objective 2-3 sentence hiring committee advisory summary highlighting standout strengths and potential interview probe areas.
6. "evidenceCitations": 2-3 factual bullet points citing specific accomplishments or skill matches from the candidate record.

Return ONLY a valid JSON object matching this structure:
{
  "score": 85,
  "matchedSkills": ["Node.js", "React", "MongoDB"],
  "missingSkills": ["Kubernetes"],
  "experienceFit": "good_fit",
  "recommendation": "Strong candidate with 5 years full-stack experience covering 85% of tech stack. Recommended to probe Kubernetes in technical round.",
  "evidenceCitations": [
    "5 years full-stack background matches mid-to-senior engineering level",
    "Proven React & Node.js architecture experience directly matches primary stack"
  ]
}`;
};

module.exports = {
  version: 'v1',
  task: 'match_scoring',
  inputSchema: matchScoreInputSchema,
  outputSchema: matchScoreOutputSchema,
  buildPrompt,
};
