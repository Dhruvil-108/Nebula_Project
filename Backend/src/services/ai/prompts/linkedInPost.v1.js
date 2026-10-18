const { z } = require('zod');

const linkedInPostInputSchema = z.object({
  jobTitle: z.string(),
  departmentName: z.string().default('Engineering'),
  companyName: z.string().default('Our Company'),
  employmentType: z.string().default('full_time'),
  locationText: z.string().default('Hybrid'),
  salaryText: z.string().nullable().optional(),
  skillsText: z.string().optional(),
  description: z.string().optional(),
  tone: z.enum(['dynamic', 'engineering', 'corporate']).default('dynamic'),
  customNotes: z.string().optional(),
});

const linkedInPostOutputSchema = z.object({
  post: z.string().min(50),
  hashtags: z.array(z.string()).default([]),
  suggestedChannels: z.array(z.string()).default(['LinkedIn']),
});

const buildPrompt = (input) => {
  return `You are an expert tech talent recruiter and social media strategist for ${input.companyName}.
Write a highly engaging, high-converting social job post for the following position:
- Role: ${input.jobTitle}
- Department: ${input.departmentName}
- Employment Type: ${input.employmentType}
- Location: ${input.locationText}
${input.salaryText ? `- Compensation: ${input.salaryText}` : ''}
${input.skillsText ? `- Key Skills / Tech Stack: ${input.skillsText}` : ''}
${input.description ? `- Job Overview: ${input.description}` : ''}
- Tone requested: ${input.tone} (e.g. dynamic/startup, corporate/professional, or engineering/tech-focused)
${input.customNotes ? `- Additional Context / Special Perks: ${input.customNotes}` : ''}

Formatting Guidelines:
1. Start with an irresistible 1-2 line hook that stops the scroll.
2. Highlight why this role is exciting, the impact they will make, and key tech stack / responsibilities.
3. List 3-5 clear bullet points for what we are looking for.
4. Clear call-to-action inviting qualified candidates to apply or message directly.
5. End with 4-6 relevant trending hashtags.
6. Use clean, readable text with modern emojis. Do not use raw markdown code fences.

Respond with a JSON object with this exact structure:
{
  "post": "The full post text including formatting, emojis, call to action, and hashtags at the bottom",
  "hashtags": ["#Hiring", "#TechJobs"],
  "suggestedChannels": ["LinkedIn", "Twitter/X"]
}`;
};

module.exports = {
  version: 'v1',
  task: 'linked_in_post',
  inputSchema: linkedInPostInputSchema,
  outputSchema: linkedInPostOutputSchema,
  buildPrompt,
};
