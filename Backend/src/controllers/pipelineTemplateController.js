const mongoose = require('mongoose');
const PipelineTemplate = require('../models/PipelineTemplate');
const RejectionReason = require('../models/RejectionReason');
const { scopedFilter } = require('../middleware/tenant');

/**
 * Standard 10 stages reproducing existing ATS workflow
 */
const DEFAULT_STAGES = [
  { key: 'applied', name: 'Applied', type: 'active', slaDays: 2, order: 1, color: '#3b82f6' },
  { key: 'screening', name: 'Screening', type: 'active', slaDays: 3, order: 2, color: '#8b5cf6' },
  { key: 'interview_round_1', name: 'Interview R1', type: 'active', slaDays: 5, order: 3, color: '#6366f1' },
  { key: 'interview_round_2', name: 'Interview R2', type: 'active', slaDays: 5, order: 4, color: '#0ea5e9' },
  { key: 'technical_assessment', name: 'Assessment', type: 'active', slaDays: 4, order: 5, color: '#f59e0b' },
  { key: 'hr_round', name: 'HR Round', type: 'active', slaDays: 3, order: 6, color: '#10b981' },
  { key: 'offer_sent', name: 'Offer Sent', type: 'offer', slaDays: 4, order: 7, color: '#f97316' },
  { key: 'hired', name: 'Hired', type: 'hired', slaDays: 0, order: 8, color: '#059669' },
  { key: 'rejected', name: 'Rejected', type: 'rejected', slaDays: 0, order: 9, color: '#ef4444' },
  { key: 'withdrawn', name: 'Withdrawn', type: 'rejected', slaDays: 0, order: 10, color: '#6b7280' },
];

const DEFAULT_REJECTION_REASONS = [
  { code: 'skills_mismatch', label: 'Technical / Skills Mismatch', category: 'competency' },
  { code: 'experience_gap', label: 'Insufficient Experience Level', category: 'competency' },
  { code: 'salary_expectation', label: 'Compensation Expectation Beyond Band', category: 'compensation' },
  { code: 'culture_values', label: 'Cultural / Values Alignment', category: 'behavioral' },
  { code: 'position_closed', label: 'Position Filled / Headcount Frozen', category: 'process' },
  { code: 'candidate_withdrew', label: 'Candidate Accepted Another Offer', category: 'candidate_choice' },
  { code: 'unresponsive', label: 'Candidate Unresponsive to Scheduling', category: 'process' },
];

/**
 * Seed default template and rejection reasons for a tenant if none exist
 */
const ensureTenantDefaults = async (orgId) => {
  let defaultTemplate = await PipelineTemplate.findOne({ organizationId: orgId, isDefault: true });
  if (!defaultTemplate) {
    defaultTemplate = await PipelineTemplate.create({
      organizationId: orgId,
      name: 'Standard ATS Hiring Pipeline',
      description: 'Default 10-stage technical and general hiring workflow.',
      isDefault: true,
      stages: DEFAULT_STAGES,
    });
  }

  const reasonCount = await RejectionReason.countDocuments({ organizationId: orgId });
  if (reasonCount === 0) {
    const docs = DEFAULT_REJECTION_REASONS.map((r) => ({
      ...r,
      organizationId: orgId,
    }));
    await RejectionReason.insertMany(docs);
  }

  return defaultTemplate;
};

// ─────────────────────────────────────────────────────────
// Pipeline Templates API
// ─────────────────────────────────────────────────────────
exports.getPipelineTemplates = async (req, res) => {
  try {
    await ensureTenantDefaults(req.organizationId);
    const templates = await PipelineTemplate.find(scopedFilter(req, {}))
      .populate('departmentId', 'name')
      .sort({ isDefault: -1, createdAt: 1 })
      .lean();

    return res.json(templates);
  } catch (err) {
    console.error('[pipelineTemplateController.getPipelineTemplates] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve pipeline templates.' });
  }
};

exports.createPipelineTemplate = async (req, res) => {
  try {
    const { name, description, departmentId, stages, isDefault } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Template name is required.' });
    }
    if (!Array.isArray(stages) || stages.length === 0) {
      return res.status(400).json({ error: 'Pipeline must define at least one stage.' });
    }

    if (isDefault) {
      await PipelineTemplate.updateMany(
        scopedFilter(req, {}),
        { $set: { isDefault: false } }
      );
    }

    const template = await PipelineTemplate.create({
      organizationId: req.organizationId,
      name: name.trim(),
      description: description || '',
      departmentId: departmentId && mongoose.Types.ObjectId.isValid(departmentId) ? departmentId : null,
      isDefault: Boolean(isDefault),
      stages,
    });

    return res.status(201).json(template);
  } catch (err) {
    console.error('[pipelineTemplateController.createPipelineTemplate] Error:', err);
    return res.status(500).json({ error: 'Failed to create pipeline template.' });
  }
};

exports.updatePipelineTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, stages, isDefault } = req.body;

    if (isDefault) {
      await PipelineTemplate.updateMany(
        scopedFilter(req, { _id: { $ne: id } }),
        { $set: { isDefault: false } }
      );
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (typeof description === 'string') updates.description = description;
    if (Array.isArray(stages)) updates.stages = stages;
    if (typeof isDefault === 'boolean') updates.isDefault = isDefault;

    const template = await PipelineTemplate.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      { $set: updates },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Pipeline template not found.' });
    }

    return res.json(template);
  } catch (err) {
    console.error('[pipelineTemplateController.updatePipelineTemplate] Error:', err);
    return res.status(500).json({ error: 'Failed to update pipeline template.' });
  }
};

// ─────────────────────────────────────────────────────────
// Rejection Reasons Catalog API
// ─────────────────────────────────────────────────────────
exports.getRejectionReasons = async (req, res) => {
  try {
    await ensureTenantDefaults(req.organizationId);
    const reasons = await RejectionReason.find(scopedFilter(req, { isActive: true }))
      .sort({ category: 1, label: 1 })
      .lean();

    return res.json(reasons);
  } catch (err) {
    console.error('[pipelineTemplateController.getRejectionReasons] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve rejection reasons.' });
  }
};

exports.createRejectionReason = async (req, res) => {
  try {
    const { label, category, code } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ error: 'Reason label is required.' });
    }

    const generatedCode = code || label.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);

    const reason = await RejectionReason.create({
      organizationId: req.organizationId,
      code: generatedCode,
      label: label.trim(),
      category: category || 'competency',
      isActive: true,
    });

    return res.status(201).json(reason);
  } catch (err) {
    console.error('[pipelineTemplateController.createRejectionReason] Error:', err);
    return res.status(500).json({ error: 'Failed to create rejection reason.' });
  }
};

module.exports.ensureTenantDefaults = ensureTenantDefaults;
module.exports.DEFAULT_STAGES = DEFAULT_STAGES;
