const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const counterService = require('../services/counterService');
const duplicateDetectionService = require('../services/duplicateDetectionService');
const aiService = require('../services/ai/aiService');

// Helper to resolve Organization from slug or ObjectId
async function resolveOrganization(tenantSlug) {
  if (!tenantSlug) return null;

  // If valid ObjectId, attempt direct ID lookup
  if (mongoose.Types.ObjectId.isValid(tenantSlug)) {
    const orgById = await Organization.findOne({ _id: tenantSlug, isActive: true, isSuspended: false });
    if (orgById) return orgById;
  }

  // Slug match (case-insensitive name comparison or normalized slug)
  const cleanSlug = String(tenantSlug).trim().toLowerCase().replace(/-/g, ' ');
  const orgByName = await Organization.findOne({
    name: { $regex: new RegExp(`^${cleanSlug}$`, 'i') },
    isActive: true,
    isSuspended: false,
  });

  return orgByName;
}

exports.getPublicTenantInfo = async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const org = await resolveOrganization(tenantSlug);
    if (!org) {
      return res.status(404).json({ message: 'Organization careers site not found' });
    }

    res.json({
      name: org.name,
      logoUrl: org.logoUrl,
      website: org.website,
      brandColor: org.brandColor || '#f97316',
      industry: org.industry,
      companySize: org.companySize,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error fetching careers site' });
  }
};

exports.getPublicJobs = async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const { department, locationType, search } = req.query;

    const org = await resolveOrganization(tenantSlug);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const query = {
      organizationId: org._id,
      status: 'published',
    };

    if (locationType) {
      query.locationType = locationType;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const jobs = await JobOpening.find(query)
      .populate('departmentId', 'name')
      .select('title jobCode departmentId locationType location employmentType experienceLevel salaryRange description publishedAt requirements')
      .sort({ publishedAt: -1 });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error fetching public jobs' });
  }
};

exports.getPublicJobById = async (req, res) => {
  try {
    const { tenantSlug, id } = req.params;
    const org = await resolveOrganization(tenantSlug);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const job = await JobOpening.findOne({
      _id: id,
      organizationId: org._id,
      status: 'published',
    }).populate('departmentId', 'name');

    if (!job) {
      return res.status(404).json({ message: 'Job opening not found or no longer active' });
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error fetching job details' });
  }
};

exports.applyPublicJob = async (req, res) => {
  try {
    const { tenantSlug, id } = req.params;
    const {
      fullName,
      email,
      phone,
      resumeUrl,
      coverLetter,
      currentCompany,
      currentDesignation,
      totalExperienceYears,
      skills,
      consentGiven,
    } = req.body;

    if (!consentGiven) {
      return res.status(400).json({
        message: 'Explicit candidate consent is required to process your job application and store your personal data.',
      });
    }

    if (!fullName || !email) {
      return res.status(400).json({ message: 'Full name and email are mandatory fields.' });
    }

    const org = await resolveOrganization(tenantSlug);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const job = await JobOpening.findOne({
      _id: id,
      organizationId: org._id,
      status: 'published',
    });

    if (!job) {
      return res.status(404).json({ message: 'Job opening not found or closed' });
    }

    // 1. Duplicate Person Check
    const dupResult = await duplicateDetectionService.findDuplicate(org._id, {
      email,
      phone,
      fullName,
    });

    let candidate = null;
    const cleanSkills = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    if (dupResult.isDuplicate && dupResult.existingCandidate) {
      candidate = dupResult.existingCandidate;
      // Update resume or phone if newly provided
      if (resumeUrl && !candidate.resumeUrl) candidate.resumeUrl = resumeUrl;
      if (phone && !candidate.phone) candidate.phone = phone;
      if (cleanSkills.length > 0) {
        candidate.tags = Array.from(new Set([...(candidate.tags || []), ...cleanSkills]));
      }
      candidate.consent = {
        consentGiven: true,
        consentTimestamp: new Date(),
        consentText: 'Applicant agreed to terms & data processing during public careers site application.',
      };
      await candidate.save();
    } else {
      // 2. Create New Candidate Person Record
      const candidateCode = await counterService.generateCandidateCode(org._id);
      candidate = await Candidate.create({
        organizationId: org._id,
        candidateCode,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : '',
        currentCompany: currentCompany || '',
        currentDesignation: currentDesignation || '',
        totalExperienceYears: Number(totalExperienceYears) || 0,
        resumeUrl: resumeUrl || '',
        tags: cleanSkills,
        stage: 'applied',
        jobOpeningId: job._id,
        source: 'careers_page',
        consent: {
          consentGiven: true,
          consentTimestamp: new Date(),
          consentText: 'Applicant agreed to terms & data processing during public careers site application.',
        },
      });
    }

    // 3. Create Job Application Record
    const applicationCode = await counterService.generateApplicationCode(org._id);
    const application = await Application.create({
      organizationId: org._id,
      applicationCode,
      candidateId: candidate._id,
      jobOpeningId: job._id,
      stage: 'applied',
      status: 'active',
      source: 'careers_page',
      coverLetter: coverLetter || '',
      stageHistory: [
        {
          fromStage: 'applied',
          toStage: 'applied',
          changedAt: new Date(),
          note: `Public application submitted via careers portal`,
        },
      ],
    });

    // 4. Log Activity
    try {
      await RecruitmentActivity.create({
        organizationId: org._id,
        candidateId: candidate._id,
        applicationId: application._id,
        actionType: 'candidate_created',
        performedBy: candidate._id, // candidate self-intake
        details: {
          note: `Applied for ${job.title} (${applicationCode}) via Public Careers Portal`,
          jobTitle: job.title,
        },
      });
    } catch (e) {
      // Non-blocking log error
    }

    // 5. Trigger Background Blind Match Scoring if AI is enabled
    setImmediate(async () => {
      try {
        const matchResult = await aiService.generate({
          task: 'match_scoring',
          organizationId: org._id,
          entityType: 'Application',
          entityId: application._id,
          input: {
            candidateProfile: {
              skills: cleanSkills.length > 0 ? cleanSkills : candidate.tags || [],
              totalExperienceYears: Number(totalExperienceYears) || candidate.totalExperienceYears || 0,
              summary: coverLetter || candidate.summary || '',
              workHistory: candidate.parsedProfile?.workHistory || [],
            },
            jobRequirements: {
              title: job.title,
              experienceLevel: job.experienceLevel,
              requirements: job.requirements || [],
              skills: job.skills || [],
              description: job.description || '',
            },
          },
        });

        if (matchResult && matchResult.data) {
          application.matchScore = matchResult.data.score;
          application.matchExplanation = {
            matchedSkills: matchResult.data.matchedSkills,
            missingSkills: matchResult.data.missingSkills,
            experienceFit: matchResult.data.experienceFit,
            recommendation: matchResult.data.recommendation,
          };
          await application.save();
        }
      } catch (err) {
        // Non-blocking background match scoring failure
      }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! Our recruiting team has received your profile.',
      applicationCode: application.applicationCode,
      candidateCode: candidate.candidateCode,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error processing application' });
  }
};
