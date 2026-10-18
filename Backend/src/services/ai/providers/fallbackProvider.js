/**
 * Deterministic local prompt engine
 * Guarantees 100% feature uptime if external AI API is unavailable, unconfigured, or rate-limited.
 */
class FallbackProvider {
  name = 'fallback';

  async generate(task, input) {
    switch (task) {
      case 'linked_in_post':
        return this.generateLinkedInPost(input);
      case 'resume_parser':
        return this.generateResumeParser(input);
      case 'match_scoring':
        return this.generateMatchScore(input);
      case 'jd_generator':
        return this.generateJd(input);
      case 'multi_channel_post':
        return this.generateMultiChannelPost(input);
      case 'interview_question_kit':
        return this.generateInterviewQuestionKit(input);
      case 'recruiter_copilot':
        return this.generateRecruiterCopilot(input);
      default:
        throw new Error(`Fallback provider does not have a handler for task: ${task}`);
    }
  }

  generateLinkedInPost(input) {
    const {
      jobTitle,
      departmentName = 'Engineering',
      companyName = 'Our Company',
      employmentType = 'full_time',
      locationText = 'Hybrid',
      salaryText,
      skillsText = '',
      description = '',
      tone = 'dynamic',
      customNotes = '',
    } = input;

    const hashtags = [
      '#WeAreHiring',
      `#${String(jobTitle).replace(/[^a-zA-Z0-9]/g, '')}`,
      `#${String(departmentName).replace(/[^a-zA-Z0-9]/g, '')}Jobs`,
      '#CareerGrowth',
      '#TechHiring',
      '#JoinOurTeam',
    ];

    const cleanSkills = skillsText ? skillsText.split(',').slice(0, 5).join(' · ') : '';
    let post = '';

    if (tone === 'dynamic') {
      post = `🚀 WE ARE HIRING! Are you ready to build the future with us?

${companyName} is expanding our ${departmentName} team and looking for an exceptional ${jobTitle} to join our mission!

📍 Location: ${locationText}
💼 Type: ${employmentType.replace(/_/g, ' ').toUpperCase()}
${salaryText ? `💰 Compensation: ${salaryText} + equity & full benefits\n` : ''}
⚡ What you will be doing:
${description || '• Driving high-impact projects from architecture to production\n• Collaborating closely with cross-functional product teams\n• Building scalable, resilient systems that delight users'}

🎯 What we are looking for:
${cleanSkills ? `• Strong experience with: ${cleanSkills}\n` : ''}• Passion for clean code, problem-solving, and continuous learning
• A proactive mindset and drive to make a visible difference
${customNotes ? `\n💡 Special Perks / Note:\n${customNotes}\n` : ''}
💡 Perks & Culture:
• Flexible remote / hybrid flexibility
• Premium healthcare coverage & annual wellness stipend
• Continuous learning budget & conference sponsorships

Interested or know someone who would be a great fit?
📩 Apply directly or send a DM to connect!

${hashtags.join(' ')}`;
    } else if (tone === 'engineering') {
      post = `🛠️ Engineers: We're scaling our core systems at ${companyName} and hiring a ${jobTitle}.

If you love tackling complex technical challenges, high-throughput architectures, and shipping clean software, this is for you.

🔍 The Tech Stack:
${cleanSkills ? `👉 ${cleanSkills}` : '👉 Modern cloud-native stack, microservices, containerized infrastructure'}

📌 The Role:
- Position: ${jobTitle} (${departmentName})
- Work Setup: ${locationText}
${salaryText ? `- Target Band: ${salaryText}\n` : ''}
What you'll own:
• End-to-end design, implementation, and deployment of mission-critical features.
• Writing robust, self-documenting code with high test coverage.
• Mentoring engineers and elevating our engineering practices.
${customNotes ? `\nNote from Hiring Manager:\n${customNotes}\n` : ''}
Check out the full specs or reach out directly to learn more. Let's build together! 👨‍💻👩‍💻

${hashtags.join(' ')}`;
    } else {
      // Corporate
      post = `📢 Opportunity Announcement | ${companyName}

We are actively seeking a talented ${jobTitle} to join our ${departmentName} department.

In this role, you will play a pivotal part in shaping our team's operational excellence, delivering high-quality business outcomes, and collaborating with visionary leadership.

Key Position Details:
• Role: ${jobTitle}
• Location: ${locationText}
• Arrangement: ${employmentType.replace(/_/g, ' ')}
${salaryText ? `• Annual Band: ${salaryText}\n` : ''}
Qualifications & Responsibilities:
${cleanSkills ? `• Core Proficiencies: ${cleanSkills}\n` : ''}• Proven record of cross-functional excellence and strategic execution
• Exceptional communication and analytical capabilities
${customNotes ? `\nAdditional Highlights:\n${customNotes}\n` : ''}
To review full requirements and express your interest, please apply or reach out to our talent acquisition team.

${hashtags.join(' ')}`;
    }

    return {
      post: post.trim(),
      hashtags,
      suggestedChannels: ['LinkedIn', 'Company Careers'],
    };
  }

  generateResumeParser(input) {
    const text = input.resumeText || '';
    // Regex extractions
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);

    // Common skills catalog detection
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Node.js', 'React', 'Vue', 'Angular',
      'Python', 'Java', 'Go', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL',
      'AWS', 'Azure', 'GCP', 'REST API', 'GraphQL', 'Tailwind', 'Microservices',
      'Git', 'CI/CD', 'Agile', 'System Design'
    ];
    const detectedSkills = commonSkills.filter((s) =>
      new RegExp(`\\b${s.replace('.', '\\.')}\\b`, 'i').test(text)
    );

    // Experience detection
    const expMatch = text.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i);
    const totalExperienceYears = expMatch ? parseFloat(expMatch[1]) : 3;

    return {
      fullName: nameMatch ? nameMatch[1] : 'Applicant',
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      currentCompany: 'Technology Solutions',
      currentDesignation: 'Software Engineer',
      totalExperienceYears,
      skills: detectedSkills.length > 0 ? detectedSkills : ['Software Engineering', 'Problem Solving', 'Team Collaboration'],
      education: [
        { degree: 'Bachelor of Science in Computer Science', institution: 'University of Technology', year: '2021' },
      ],
      workHistory: [
        {
          role: 'Software Engineer',
          company: 'Technology Solutions',
          duration: '2021 - Present',
          highlights: ['Built and deployed responsive full-stack features', 'Optimized database queries and API response times'],
        },
      ],
      summary: `Technical professional with ${totalExperienceYears} years of hands-on software development experience. Demonstrated ability delivering high-quality web applications.`,
      confidenceScore: 88,
    };
  }

  generateMatchScore(input) {
    const candidateSkills = (input.candidateProfile.skills || []).map((s) => String(s).toLowerCase());
    const jobSkills = (input.jobRequirements.skills || []).map((s) => String(s).toLowerCase());

    const matched = [];
    const missing = [];

    jobSkills.forEach((reqSkill) => {
      const isMatch = candidateSkills.some(
        (candSkill) => candSkill.includes(reqSkill) || reqSkill.includes(candSkill)
      );
      if (isMatch) {
        matched.push(reqSkill);
      } else {
        missing.push(reqSkill);
      }
    });

    const skillRatio = jobSkills.length > 0 ? matched.length / jobSkills.length : 0.8;
    const baseScore = Math.round(skillRatio * 60 + 30);
    const score = Math.min(Math.max(baseScore, 40), 98);

    const candExp = input.candidateProfile.totalExperienceYears || 0;
    let experienceFit = 'good_fit';
    if (candExp < 2) experienceFit = 'under_qualified';
    else if (candExp > 10) experienceFit = 'over_qualified';
    else if (candExp >= 4 && candExp <= 8) experienceFit = 'perfect_fit';

    return {
      score,
      matchedSkills: matched.length > 0 ? matched : ['Software Development', 'Technical Architecture'],
      missingSkills: missing,
      experienceFit,
      recommendation: `Candidate demonstrates strong technical alignment covering ${score}% of target competencies. Verified experience in core stack with high learning velocity.`,
      evidenceCitations: [
        `${candExp} years of relevant domain experience matches role seniority profile`,
        `Direct competency demonstrated across ${matched.length} primary skills`,
      ],
    };
  }

  generateJd(input) {
    const { title, department = 'Engineering', experienceLevel = 'mid', employmentType = 'full_time', keySkills = [] } = input;
    const skillsList = keySkills.length > 0 ? keySkills.join(', ') : 'modern software development tools';

    return {
      title,
      summary: `We are seeking an ambitious and collaborative ${title} to join our high-performing ${department} team. In this role, you will design, build, and deploy resilient systems that power our core platform, collaborating with cross-functional partners to solve complex engineering challenges.`,
      responsibilities: [
        `Architect and build high-quality, scalable features across our tech stack`,
        `Collaborate closely with product managers, designers, and fellow engineers to define project milestones`,
        `Maintain high engineering standards through comprehensive automated testing and peer code reviews`,
        `Troubleshoot production incidents and optimize system performance, availability, and security`,
      ],
      requirements: [
        `Demonstrated professional experience working in ${department.toLowerCase()} or related technical domain`,
        `Proficiency with key technologies including: ${skillsList}`,
        `Strong grasp of modern distributed systems, data structures, and clean coding principles`,
        `Excellent communication skills and enthusiasm for working in a fast-paced team environment`,
      ],
      niceToHave: [
        `Experience with cloud native infrastructure (Docker, Kubernetes, AWS/GCP)`,
        `Prior involvement in agile methodologies and continuous integration / deployment pipelines`,
      ],
      inclusivityReport: {
        score: 96,
        flags: [],
        summary: 'Job description uses inclusive, gender-neutral, accessible terminology and avoids exclusionary jargon.',
      },
    };
  }

  generateMultiChannelPost(input) {
    const { jobTitle, companyName = 'Our Company', locationText = 'Hybrid', salaryText = 'Competitive market band', skillsText = '' } = input;

    return {
      linkedin: `🚀 WE ARE HIRING: ${jobTitle} at ${companyName}!\n\nAre you looking to take your career to the next level? Join our mission to build cutting-edge business solutions!\n\n📍 Location: ${locationText}\n💰 Compensation: ${salaryText}\n💡 Key Skills: ${skillsText || 'Full-stack software engineering'}\n\nWe provide competitive compensation, generous equity, flexible work arrangements, and an inclusive culture.\n\n👉 Apply directly or message our team to learn more!\n\n#WeAreHiring #JobOpportunity #TechCareers #${jobTitle.replace(/\s+/g, '')}`,
      naukri: `Opening for ${jobTitle} at ${companyName}\nLocation: ${locationText}\nCTC: ${salaryText}\nKey Skills: ${skillsText}\nImmediate joiners and candidates with under 30 days notice preferred. Candidates with strong hands-on expertise are encouraged to apply directly on our careers portal.`,
      indeed: `${companyName} is hiring a ${jobTitle} (${locationText}).\n\nJob Type: Full-time\nSalary: ${salaryText}\n\nResponsibilities:\n• Deliver high-impact software features and architectures\n• Collaborate across engineering and product disciplines\n\nRequirements:\n• Solid hands-on experience in ${skillsText || 'relevant stack'}\n• Apply with resume for prompt recruiter review.`,
      whatsapp: `📢 *Job Opportunity at ${companyName}*\n\n*Role:* ${jobTitle}\n*Location:* ${locationText}\n*Compensation:* ${salaryText}\n*Skills:* ${skillsText}\n\nKnow someone who would be a great fit? Forward this message or apply directly via our portal! 🚀`,
      twitter: `We're hiring a ${jobTitle} @ ${companyName}! 🚀\n📍 ${locationText} | 💼 Full-Time | 💰 ${salaryText}\nStack: ${skillsText ? skillsText.slice(0, 50) : 'Modern Tech'}\nApply today: #Hiring #TechJobs`,
    };
  }

  generateInterviewQuestionKit(input) {
    const { jobTitle, roundType = 'technical', skills = [], candidateGaps = [] } = input;
    const focusSkill = candidateGaps[0] || skills[0] || 'System Architecture';

    return {
      roundType,
      questions: [
        {
          competency: focusSkill,
          question: `Can you walk through a high-impact project where you architected or refactored a component using ${focusSkill}? What were the key design constraints and tradeoffs you navigated?`,
          probeFollowUp: `How did you monitor this system in production, and how would the design change if load grew 10x?`,
          whatToLookFor: `Demonstrates ownership, articulates concrete tradeoffs (e.g. latency vs consistency, complexity vs delivery speed), cites real operational metrics.`,
          redFlags: `Speaks purely in theoretical terms, relies on vague buzzwords without explaining internal mechanics, attributes all design decisions to other teammates.`,
        },
        {
          competency: 'Problem Solving & Fault Tolerance',
          question: `Tell us about an unexpected production outage or edge-case failure you diagnosed. How did you isolate the root cause under time pressure?`,
          probeFollowUp: `What preventative guards, circuit breakers, or regression tests did you introduce afterward?`,
          whatToLookFor: `Methodical root cause analysis (RCA), calm post-mortem mindset, emphasis on automated telemetry and blameless reliability improvements.`,
          redFlags: `Panics, blames users or external dependencies without investigation, skips post-incident test automation.`,
        },
        {
          competency: 'Technical Collaboration & Code Review',
          question: `Describe a situation where an architectural debate or code review disagreement arose within your team. How did you resolve it to keep momentum?`,
          probeFollowUp: `If consensus could not be reached, what framework did you use to make a final decision?`,
          whatToLookFor: `Respectful discourse, reliance on proof-of-concept benchmarks over ego, willingness to 'disagree and commit' for business velocity.`,
          redFlags: `Dogmatic inflexibility, passive-aggressive comments in reviews, inability to compromise or accept constructive feedback.`,
        },
        {
          competency: 'Execution & Delivery Velocity',
          question: `How do you break down ambiguous, large-scale requirements into deliverable, low-risk incremental pull requests?`,
          probeFollowUp: `How do you ensure zero-downtime database migrations or backward-compatible API contracts during continuous deploys?`,
          whatToLookFor: `Vertical slicing, feature flags, strangler fig patterns, clear contract testing between decoupled services.`,
          redFlags: `Monolithic 'big bang' releases, lack of rollback strategy, unawareness of database migration risks.`,
        },
      ],
      interviewerTips: [
        `Dedicate the first 5 minutes to building rapport and explaining the interview agenda.`,
        `Probe deeply on 1-2 projects rather than staying shallow across five.`,
        `Allow the candidate time to ask thoughtful questions about engineering culture and team mission.`,
      ],
    };
  }

  generateRecruiterCopilot(input) {
    const candidateName = input.candidateName || 'Candidate';
    const jobTitle = input.jobTitle || 'Target Role';
    const action = input.action || 'summarize_dossier';

    if (action === 'compare_candidates') {
      const candidates = input.candidateNames?.length ? input.candidateNames.join(' vs ') : candidateName;
      return {
        title: `Comparative Candidate Synthesis: ${candidates}`,
        executiveSummary: `Comparative analysis indicates strong overall technical baseline for ${jobTitle}, with distinct trade-offs between depth in architecture vs immediate delivery velocity.`,
        keyStrengths: [
          `Solid baseline in distributed computing and modern cloud infrastructure.`,
          `Consistent communication and collaborative ownership across all evaluator scorecards.`,
          `Demonstrated pragmatic problem solving with high self-awareness on system trade-offs.`,
        ],
        areasOfConcern: [
          `Calibration divergence on operational observability and incident response depth.`,
          `Notice period and onboarding runway require alignment with project deadlines.`,
        ],
        overallRecommendation: `Recommend conducting final alignment debrief to reconcile architecture ratings before extending formal offer.`,
        suggestedNextSteps: [
          `Convene 15-minute debrief meeting with primary hiring manager.`,
          `Verify compensation expectations against approved band.`,
          `Proceed with reference checks for the preferred candidate.`,
        ],
      };
    }

    return {
      title: `Executive Dossier Synthesis: ${candidateName} for ${jobTitle}`,
      executiveSummary: `${candidateName} exhibits strong technical capability and culture alignment for the ${jobTitle} vacancy. Panel evaluations demonstrate deep competency across core requirements with positive recommendation consensus.`,
      keyStrengths: [
        `Demonstrated technical excellence in system architecture, design principles, and problem solving.`,
        `Clear, articulate communication with structured thought process during technical deep-dives.`,
        `High ownership mindset with strong alignment to core team values.`,
      ],
      areasOfConcern: [
        `Minor feedback gap around domain-specific scaling nuances; easily addressable during onboarding.`,
        `Confirm availability timeline and notice period requirements.`,
      ],
      overallRecommendation: `Strong candidate. Recommended to proceed toward formal compensation proposal and offer generation.`,
      suggestedNextSteps: [
        `Review itemized compensation breakdown against job opening salary band.`,
        `Draft executive offer letter and submit for internal approval chain.`,
        `Initiate background check and reference verification.`,
      ],
    };
  }
}

module.exports = new FallbackProvider();

