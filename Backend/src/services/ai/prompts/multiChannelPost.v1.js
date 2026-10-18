const { z } = require('zod');

const multiChannelPostInputSchema = z.object({
  jobTitle: z.string(),
  companyName: z.string().default('Our Company'),
  departmentName: z.string().default('Engineering'),
  locationText: z.string().default('Hybrid'),
  salaryText: z.string().optional().default('Competitive market compensation'),
  skillsText: z.string().optional().default(''),
  description: z.string().optional().default(''),
  tone: z.enum(['professional', 'dynamic', 'casual', 'executive']).default('dynamic'),
});

const multiChannelPostOutputSchema = z.object({
  linkedin: z.string().min(50),
  naukri: z.string().min(50),
  indeed: z.string().min(50),
  whatsapp: z.string().min(30),
  twitter: z.string().min(30),
});

const buildPrompt = (input) => {
  return `You are an omni-channel recruitment marketing copywriter.
Generate tailored recruitment announcements optimized for 5 distinct distribution channels for this position:
- Title: ${input.jobTitle}
- Company: ${input.companyName}
- Department: ${input.departmentName}
- Location: ${input.locationText}
- Compensation: ${input.salaryText}
- Skills: ${input.skillsText}
- Tone: ${input.tone}

Channel Customization Requirements:
1. LinkedIn: Compelling narrative hook, bulleted responsibilities & key skills, culture highlight, call to action, and 5 hashtags.
2. Naukri: Professional, structured Indian job board summary highlighting designation, key functional skills, location, eligibility criteria, and immediate joiner perks.
3. Indeed: Clear, concise, search-engine-optimized listing focusing on responsibilities, concrete qualifications, compensation, and streamlined apply instructions.
4. WhatsApp / Telegram: Compact, high-readability broadcast message with emojis, key highlights, and concise shareable referral pitch.
5. Twitter / X: Punchy tweet under 280 characters with catchy hook, key tech stack, link placeholder, and 2-3 hashtags.

Return ONLY a valid JSON object matching this structure:
{
  "linkedin": "Full LinkedIn post text...",
  "naukri": "Full Naukri job posting text...",
  "indeed": "Full Indeed search-optimized posting text...",
  "whatsapp": "🚀 *We are Hiring!*\\n*Role:* Senior Engineer...",
  "twitter": "We are looking for a Senior Engineer to join our team!..."
}`;
};

module.exports = {
  version: 'v1',
  task: 'multi_channel_post',
  inputSchema: multiChannelPostInputSchema,
  outputSchema: multiChannelPostOutputSchema,
  buildPrompt,
};
