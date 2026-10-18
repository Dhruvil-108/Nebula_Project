const { z } = require('zod');

const jdGeneratorInputSchema = z.object({
  title: z.string().min(2, 'Job title is required'),
  department: z.string().default('Engineering'),
  experienceLevel: z.string().default('mid'),
  employmentType: z.string().default('full_time'),
  keySkills: z.array(z.string()).default([]),
  companyOverview: z.string().optional().default(''),
  locationType: z.string().default('hybrid'),
});

const jdGeneratorOutputSchema = z.object({
  title: z.string(),
  summary: z.string().min(30),
  responsibilities: z.array(z.string()).min(2),
  requirements: z.array(z.string()).min(2),
  niceToHave: z.array(z.string()).default([]),
  inclusivityReport: z.object({
    score: z.number().min(0).max(100).default(95),
    flags: z.array(
      z.object({
        phrase: z.string(),
        issue: z.string(),
        suggestion: z.string(),
      })
    ).default([]),
    summary: z.string().default('Job description uses inclusive, gender-neutral, accessible terminology.'),
  }),
});

const buildPrompt = (input) => {
  return `You are an expert talent acquisition consultant and DEI (Diversity, Equity & Inclusion) recruitment copywriter.
Generate a comprehensive, high-converting Job Description for the following role, and perform an Inclusivity & Bias Audit.

Role Parameters:
- Title: ${input.title}
- Department: ${input.department}
- Seniority Level: ${input.experienceLevel}
- Employment Type: ${input.employmentType}
- Location Type: ${input.locationType}
- Required Competencies / Skills: ${input.keySkills.join(', ') || 'Standard modern stack'}
${input.companyOverview ? `- Company Context: ${input.companyOverview}` : ''}

Inclusivity Directive:
- Avoid aggressive, hyper-masculine jargon (e.g. "ninja", "rockstar", "crushing it", "dominate").
- Ensure educational requirements do not artificially exclude candidates with equivalent practical experience.
- Audit language for gender-coded descriptors and replace with collaborative, growth-oriented language.

Return ONLY a valid JSON object matching this structure:
{
  "title": "${input.title}",
  "summary": "Compelling 2-3 paragraph overview of the role, the team's mission, and day-to-day impact...",
  "responsibilities": [
    "Design, build, and maintain efficient, reusable, and reliable code",
    "Collaborate with cross-functional teams to define and ship new features"
  ],
  "requirements": [
    "3+ years of professional development experience with React and Node.js",
    "Solid understanding of RESTful API design and relational/NoSQL databases"
  ],
  "niceToHave": [
    "Familiarity with containerization and cloud infrastructure (Docker, AWS)",
    "Experience contributing to open-source software"
  ],
  "inclusivityReport": {
    "score": 95,
    "flags": [],
    "summary": "Job description uses inclusive, gender-neutral, accessible terminology."
  }
}`;
};

module.exports = {
  version: 'v1',
  task: 'jd_generator',
  inputSchema: jdGeneratorInputSchema,
  outputSchema: jdGeneratorOutputSchema,
  buildPrompt,
};
