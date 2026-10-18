const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Organization = require('../models/Organization');
const Interview = require('../models/Interview');
const { scopedFilter } = require('../middleware/tenant');
const aiService = require('../services/ai/aiService');

/**
 * Generate LinkedIn post text for a Job Opening
 */
exports.generateLinkedInPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { tone = 'dynamic', customNotes = '' } = req.body;

    const job = await JobOpening.findOne(
      scopedFilter(req, { _id: id })
    ).populate('departmentId', 'name');

    if (!job) {
      return res.status(404).json({ message: 'Job opening not found in this organization.' });
    }

    const org = await Organization.findById(req.organizationId);
    const companyName = org?.name || 'Our Company';
    const deptName = job.departmentId?.name || 'Engineering';

    const salaryText =
      job.salaryRange?.min && job.salaryRange?.max
        ? `${job.salaryRange.currency || 'USD'} ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}`
        : null;

    const skillsText = (job.skills || []).join(', ');
    const locText = job.location ? `${job.location} (${job.locationType})` : job.locationType;

    const result = await aiService.generate({
      task: 'linked_in_post',
      input: {
        jobTitle: job.title,
        departmentName: deptName,
        companyName,
        employmentType: job.employmentType,
        locationText: locText,
        salaryText,
        skillsText,
        description: job.description,
        tone: ['dynamic', 'engineering', 'corporate'].includes(tone) ? tone : 'dynamic',
        customNotes,
      },
      organizationId: req.organizationId,
      userId: req.user?._id,
      entityType: 'JobOpening',
      entityId: job._id,
    });

    return res.json({
      success: true,
      post: result.data.post,
      provider: result.provider === 'gemini' ? 'gemini-ai' : 'fallback',
      model: result.model,
    });
  } catch (err) {
    console.error('LinkedIn AI generation failed:', err);
    return res.status(500).json({ message: err.message || 'AI generation failed' });
  }
};

/**
 * Generate Multi-Channel Posts (LinkedIn, Naukri, Indeed, WhatsApp, Twitter)
 */
exports.generateMultiChannelPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { tone = 'dynamic' } = req.body;

    const job = await JobOpening.findOne(
      scopedFilter(req, { _id: id })
    ).populate('departmentId', 'name');

    if (!job) {
      return res.status(404).json({ message: 'Job opening not found in this organization.' });
    }

    const org = await Organization.findById(req.organizationId);
    const companyName = org?.name || 'Our Company';
    const deptName = job.departmentId?.name || 'Engineering';

    const salaryText =
      job.salaryRange?.min && job.salaryRange?.max
        ? `${job.salaryRange.currency || 'USD'} ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}`
        : 'Competitive compensation';

    const skillsText = (job.skills || []).join(', ');
    const locText = job.location ? `${job.location} (${job.locationType})` : job.locationType;

    const result = await aiService.generate({
      task: 'multi_channel_post',
      input: {
        jobTitle: job.title,
        companyName,
        departmentName: deptName,
        locationText: locText,
        salaryText,
        skillsText,
        description: job.description || '',
        tone: ['professional', 'dynamic', 'casual', 'executive'].includes(tone) ? tone : 'dynamic',
      },
      organizationId: req.organizationId,
      userId: req.user?._id,
      entityType: 'JobOpening',
      entityId: job._id,
    });

    return res.json({
      success: true,
      channels: result.data,
      provider: result.provider,
      model: result.model,
    });
  } catch (err) {
    console.error('Multi-channel AI post generation failed:', err);
    return res.status(500).json({ message: err.message || 'Multi-channel generation failed' });
  }
};

/**
 * AI Resume Parser
 */
exports.parseResume = async (req, res) => {
  try {
    const { resumeText, rawFileName } = req.body;
    if (!resumeText) {
      return res.status(400).json({ message: 'resumeText is required for parsing.' });
    }

    const result = await aiService.generate({
      task: 'resume_parser',
      input: {
        resumeText,
        rawFileName: rawFileName || 'resume.pdf',
      },
      organizationId: req.organizationId,
      userId: req.user?._id,
    });

    return res.json({
      success: true,
      parsedProfile: result.data,
      provider: result.provider,
    });
  } catch (err) {
    console.error('AI resume parsing failed:', err);
    return res.status(500).json({ message: err.message || 'Resume parsing failed' });
  }
};

/**
 * Blind Candidate Match Scoring
 */
exports.calculateMatchScore = async (req, res) => {
  try {
    const { id } = req.params; // Application ID

    const application = await Application.findOne(
      scopedFilter(req, { _id: id })
    ).populate('candidateId').populate('jobOpeningId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const cand = application.candidateId;
    const job = application.jobOpeningId;

    if (!cand || !job) {
      return res.status(400).json({ message: 'Candidate or JobOpening reference missing on application' });
    }

    // Algorithmic Fairness: Blind all demographic indicators
    const blindedCandidateProfile = {
      skills: (cand.tags && cand.tags.length > 0) ? cand.tags : (cand.parsedProfile?.skills || []),
      totalExperienceYears: cand.totalExperienceYears || 0,
      summary: cand.summary || cand.parsedProfile?.summary || '',
      workHistory: cand.parsedProfile?.workHistory || [],
      education: cand.parsedProfile?.education || [],
    };

    const jobRequirements = {
      title: job.title,
      experienceLevel: job.experienceLevel || 'mid',
      requirements: job.requirements || [],
      skills: job.skills || [],
      description: job.description || '',
    };

    const result = await aiService.generate({
      task: 'match_scoring',
      input: {
        candidateProfile: blindedCandidateProfile,
        jobRequirements,
      },
      organizationId: req.organizationId,
      userId: req.user?._id,
      entityType: 'Application',
      entityId: application._id,
    });

    // Update application with match results
    application.matchScore = result.data.score;
    application.matchExplanation = {
      matchedSkills: result.data.matchedSkills,
      missingSkills: result.data.missingSkills,
      experienceFit: result.data.experienceFit,
      recommendation: result.data.recommendation,
    };
    await application.save();

    return res.json({
      success: true,
      matchScore: result.data.score,
      matchExplanation: application.matchExplanation,
      evidenceCitations: result.data.evidenceCitations,
    });
  } catch (err) {
    console.error('Match score generation failed:', err);
    return res.status(500).json({ message: err.message || 'Match score calculation failed' });
  }
};

/**
 * AI Job Description Generator & Inclusivity Audit
 */
exports.generateJobDescription = async (req, res) => {
  try {
    const { title, department = 'Engineering', experienceLevel = 'mid', employmentType = 'full_time', keySkills = [], locationType = 'hybrid' } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Job title is required.' });
    }

    const org = await Organization.findById(req.organizationId);
    const companyOverview = org?.name ? `${org.name} is an innovative organization in the ${org.industry || 'tech'} space.` : '';

    const result = await aiService.generate({
      task: 'jd_generator',
      input: {
        title,
        department,
        experienceLevel,
        employmentType,
        keySkills: Array.isArray(keySkills) ? keySkills : [],
        companyOverview,
        locationType,
      },
      organizationId: req.organizationId,
      userId: req.user?._id,
    });

    return res.json({
      success: true,
      jobDescription: result.data,
      provider: result.provider,
    });
  } catch (err) {
    console.error('AI JD generation failed:', err);
    return res.status(500).json({ message: err.message || 'JD generation failed' });
  }
};

/**
 * AI Structured Interview Question Kit Generator
 * Generates competency probe questions, good signs, and red flag rubrics.
 */
exports.generateInterviewQuestionKit = async (req, res) => {
  try {
    const { id } = req.params;
    let jobTitle = req.body.jobTitle;
    let skills = req.body.skills || [];
    let experienceLevel = req.body.experienceLevel || 'mid';
    let candidateSkills = req.body.candidateSkills || [];
    let candidateGaps = req.body.candidateGaps || [];
    let roundType = req.body.roundType || 'technical';
    let interviewId = null;

    if (id) {
      const interview = await Interview.findOne(scopedFilter(req, { _id: id }))
        .populate('candidateId')
        .populate('jobOpeningId');

      if (!interview) {
        return res.status(404).json({ message: 'Interview not found in this organization.' });
      }

      interviewId = interview._id;
      jobTitle = jobTitle || interview.jobOpeningId?.title || 'Engineer';
      skills = skills.length ? skills : (interview.jobOpeningId?.skills || []);
      experienceLevel = interview.jobOpeningId?.experienceLevel || experienceLevel;
      roundType = interview.roundType || roundType;

      if (interview.candidateId) {
        candidateSkills = candidateSkills.length ? candidateSkills : (interview.candidateId.skills || []);

        // Attempt to find application match explanation for gaps
        const app = await Application.findOne(
          scopedFilter(req, {
            candidateId: interview.candidateId._id,
            jobOpeningId: interview.jobOpeningId?._id || interview.candidateId.jobOpeningId,
          })
        ).lean();

        if (app?.matchExplanation?.missingSkills?.length && !candidateGaps.length) {
          candidateGaps = app.matchExplanation.missingSkills;
        }
      }
    }

    if (!jobTitle) {
      return res.status(400).json({ message: 'Job title is required to generate question kit.' });
    }

    const result = await aiService.generate({
      task: 'interview_question_kit',
      input: {
        jobTitle,
        skills: Array.isArray(skills) ? skills : [],
        experienceLevel,
        candidateSkills: Array.isArray(candidateSkills) ? candidateSkills : [],
        candidateGaps: Array.isArray(candidateGaps) ? candidateGaps : [],
        roundType,
      },
      organizationId: req.organizationId,
      userId: req.user?._id,
      entityType: interviewId ? 'Interview' : undefined,
      entityId: interviewId || undefined,
    });

    return res.json({
      success: true,
      kit: result.data,
      provider: result.provider,
      model: result.model,
    });
  } catch (err) {
    console.error('[recruitmentAiController.generateInterviewQuestionKit] Error:', err);
    return res.status(500).json({ message: err.message || 'Interview question kit generation failed.' });
  }
};
