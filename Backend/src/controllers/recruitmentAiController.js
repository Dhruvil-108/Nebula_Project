const JobOpening = require('../models/JobOpening');
const Organization = require('../models/Organization');

/**
 * Generate LinkedIn post text for a Job Opening
 * Supports Gemini API (if GEMINI_API_KEY is configured) and fallback prompt engine
 */
exports.generateLinkedInPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { tone = 'dynamic', customNotes = '' } = req.body;

    const job = await JobOpening.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    }).populate('departmentId', 'name');

    if (!job) {
      return res.status(404).json({ message: 'Job opening not found' });
    }

    const org = await Organization.findById(req.user.organizationId);
    const companyName = org?.name || 'Our Company';
    const deptName = job.departmentId?.name || 'Engineering';

    const salaryText =
      job.salaryRange?.min && job.salaryRange?.max
        ? `${job.salaryRange.currency || 'USD'} ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}`
        : null;

    const skillsText = (job.skills || []).join(', ');
    const locText = job.location ? `${job.location} (${job.locationType})` : job.locationType;

    // Check if GEMINI_API_KEY is available in environment
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      try {
        const prompt = `You are an expert tech talent recruiter and LinkedIn content strategist for ${companyName}.
Write a highly engaging, high-converting LinkedIn job post for the following position:
- Role: ${job.title}
- Department: ${deptName}
- Employment Type: ${job.employmentType}
- Location: ${locText}
${salaryText ? `- Compensation: ${salaryText}` : ''}
${skillsText ? `- Key Skills / Tech Stack: ${skillsText}` : ''}
${job.description ? `- Job Overview: ${job.description}` : ''}
- Tone requested: ${tone} (e.g. dynamic/startup, corporate/professional, or engineering/tech-focused)
${customNotes ? `- Additional Context: ${customNotes}` : ''}

Formatting Guidelines:
1. Start with an irresistible 1-2 line hook that stops the scroll.
2. Highlight why this role is exciting, the impact they will make, and key tech stack / responsibilities.
3. List 3-5 clear bullet points for what we are looking for.
4. Clear call-to-action inviting qualified candidates to apply or message directly.
5. End with 4-6 relevant trending hashtags (e.g. #Hiring #${job.title.replace(/\s+/g, '')} #TechJobs #WeAreHiring).
6. Do NOT include markdown bold asterisks that look like code; use clean, readable text with modern emojis.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (response.ok) {
          const json = await response.json();
          const generatedText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            return res.json({
              success: true,
              post: generatedText.trim(),
              provider: 'gemini-ai',
            });
          }
        }
      } catch (aiErr) {
        console.warn('Gemini API call failed, using intelligent template engine:', aiErr.message);
      }
    }

    // Intelligent Built-In Prompt Engine
    let post = '';
    const cleanSkills = (job.skills || []).slice(0, 5).join(' · ');
    const hashtags = [
      '#WeAreHiring',
      `#${job.title.replace(/[^a-zA-Z0-9]/g, '')}`,
      `#${deptName.replace(/[^a-zA-Z0-9]/g, '')}Jobs`,
      '#CareerGrowth',
      '#TechHiring',
      '#JoinOurTeam',
    ].join(' ');

    if (tone === 'dynamic') {
      post = `🚀 WE ARE HIRING! Are you ready to build the future with us?

${companyName} is expanding our ${deptName} team and looking for an exceptional ${job.title} to join our mission!

📍 Location: ${locText}
💼 Type: ${job.employmentType.replace(/_/g, ' ').toUpperCase()}
${salaryText ? `💰 Compensation: ${salaryText} + equity & full benefits\n` : ''}
⚡ What you will be doing:
${job.description || '• Driving high-impact projects from architecture to production\n• Collaborating closely with cross-functional product teams\n• Building scalable, resilient systems that delight users'}

🎯 What we are looking for:
${skillsText ? `• Strong experience with: ${cleanSkills}\n` : ''}• Passion for clean code, problem-solving, and continuous learning
• A proactive mindset and drive to make a visible difference

💡 Perks & Culture:
• Flexible remote / hybrid flexibility
• Premium healthcare coverage & annual wellness stipend
• Continuous learning budget & conference sponsorships

Interested or know someone who would be a great fit?
📩 Apply directly or send a DM to connect!

${hashtags}`;
    } else if (tone === 'engineering') {
      post = `🛠️ Engineers: We're scaling our core systems at ${companyName} and hiring a ${job.title}.

If you love tackling complex technical challenges, high-throughput architectures, and shipping clean software, this is for you.

🔍 The Tech Stack:
${skillsText ? `👉 ${skillsText}` : '👉 Modern cloud-native stack, microservices, containerized infrastructure'}

📌 The Role:
- Position: ${job.title} (${deptName})
- Work Setup: ${locText}
${salaryText ? `- Target Band: ${salaryText}\n` : ''}
What you'll own:
• End-to-end design, implementation, and deployment of mission-critical features.
• Writing robust, self-documenting code with high test coverage.
• Mentoring engineers and elevating our engineering practices.

Check out the full specs or reach out directly to learn more. Let's build together! 👨‍💻👩‍💻

${hashtags}`;
    } else {
      // Professional / Corporate
      post = `📢 Opportunity Announcement | ${companyName}

We are actively seeking a talented ${job.title} to join our ${deptName} department.

In this role, you will play a pivotal part in shaping our team's operational excellence, delivering high-quality business outcomes, and collaborating with visionary leadership.

Key Position Details:
• Title: ${job.title}
• Department: ${deptName}
• Arrangement: ${locText}
${salaryText ? `• Offered Salary: ${salaryText}\n` : ''}${skillsText ? `• Key Competencies: ${skillsText}\n` : ''}
We offer comprehensive benefits, professional advancement pathways, and a collaborative work environment.

To apply or refer a qualified candidate, please visit our careers portal or reach out directly via LinkedIn.

${hashtags}`;
    }

    return res.json({
      success: true,
      post: post.trim(),
      provider: 'nebula-engine',
    });
  } catch (err) {
    console.error('generateLinkedInPost error:', err);
    return res.status(500).json({ message: 'Failed to generate LinkedIn post', error: err.message });
  }
};
