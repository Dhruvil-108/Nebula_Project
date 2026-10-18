const { z } = require('zod');

const resumeParserInputSchema = z.object({
  resumeText: z.string().min(10, 'Resume text must be provided'),
  rawFileName: z.string().optional(),
});

const resumeParserOutputSchema = z.object({
  fullName: z.string().default('Candidate'),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  currentCompany: z.string().optional().default(''),
  currentDesignation: z.string().optional().default(''),
  totalExperienceYears: z.number().default(0),
  skills: z.array(z.string()).default([]),
  education: z.array(
    z.object({
      degree: z.string().default('Degree'),
      institution: z.string().default('University'),
      year: z.string().optional().default(''),
    })
  ).default([]),
  workHistory: z.array(
    z.object({
      role: z.string().default('Position'),
      company: z.string().default('Organization'),
      duration: z.string().optional().default(''),
      highlights: z.array(z.string()).optional().default([]),
    })
  ).default([]),
  summary: z.string().default(''),
  confidenceScore: z.number().min(0).max(100).default(85),
});

const buildPrompt = (input) => {
  return `You are an expert technical talent intake system and resume parsing engine.
Parse the following unstructured resume text into a normalized, structured JSON candidate profile.

Resume Text:
"""
${input.resumeText.slice(0, 10000)}
"""

Instructions:
1. Extract the candidate's full legal name, email address, and phone number.
2. Identify their current or most recent job title (designation) and company.
3. Calculate or estimate their total years of professional working experience as a single number (e.g. 5.5).
4. Extract all technical and domain skills into a deduplicated array of clean strings.
5. Extract educational qualifications (degree, university/institution, graduation year).
6. Extract key career milestones and chronological work history.
7. Provide a concise 2-sentence executive professional summary.
8. Assess the parse completeness and clarity, returning an integer confidenceScore from 0 to 100.

Return ONLY a valid JSON object matching this structure:
{
  "fullName": "First Last",
  "email": "email@example.com",
  "phone": "+1-555-0199",
  "currentCompany": "Company Name",
  "currentDesignation": "Senior Software Engineer",
  "totalExperienceYears": 5,
  "skills": ["JavaScript", "Node.js", "MongoDB", "React", "Docker"],
  "education": [
    { "degree": "B.S. in Computer Science", "institution": "State University", "year": "2020" }
  ],
  "workHistory": [
    { "role": "Senior Engineer", "company": "Tech Corp", "duration": "2022 - Present", "highlights": ["Scaled API throughput by 40%"] }
  ],
  "summary": "Experienced full-stack engineer with 5 years building scalable web services...",
  "confidenceScore": 92
}`;
};

module.exports = {
  version: 'v1',
  task: 'resume_parser',
  inputSchema: resumeParserInputSchema,
  outputSchema: resumeParserOutputSchema,
  buildPrompt,
};
