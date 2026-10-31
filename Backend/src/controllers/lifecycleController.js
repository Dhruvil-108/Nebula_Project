const OnboardingCase = require('../models/OnboardingCase');
const OnboardingTemplate = require('../models/OnboardingTemplate');
const OffboardingCase = require('../models/OffboardingCase');
const HrTicket = require('../models/HrTicket');
const LetterTemplate = require('../models/LetterTemplate');
const PolicyDocument = require('../models/PolicyDocument');
const Announcement = require('../models/Announcement');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');
const LifecycleService = require('../services/lifecycleService');

// ── ONBOARDING ──

exports.getOnboardingCases = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { status } = req.query;
    const query = { organizationId };
    if (status) query.status = status;

    const cases = await OnboardingCase.find(query)
      .populate({
        path: 'employeeId',
        select: 'fullName employeeCode email designation grade departmentId avatar hireDate',
        populate: { path: 'departmentId', select: 'name' },
      })
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: cases.length, data: cases });
  } catch (error) {
    console.error('getOnboardingCases error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOnboardingCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const oc = await OnboardingCase.findOne({ _id: id, organizationId: req.user.organizationId })
      .populate({
        path: 'employeeId',
        select: 'fullName employeeCode email designation grade departmentId avatar hireDate',
        populate: { path: 'departmentId', select: 'name' },
      })
      .populate('tasks.assignedTo', 'fullName email')
      .populate('tasks.completedBy', 'fullName email');

    if (!oc) return res.status(404).json({ success: false, message: 'Onboarding case not found' });
    return res.json({ success: true, data: oc });
  } catch (error) {
    console.error('getOnboardingCaseById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createOnboardingCase = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { employeeId, joiningDate, templateId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'employeeId is required' });
    }

    const oc = await LifecycleService.createOnboardingCase(
      organizationId,
      employeeId,
      joiningDate || new Date(),
      templateId
    );

    const populated = await OnboardingCase.findById(oc._id).populate({
      path: 'employeeId',
      select: 'fullName employeeCode email designation grade departmentId',
      populate: { path: 'departmentId', select: 'name' },
    });

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('createOnboardingCase error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleOnboardingTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { isCompleted, notes } = req.body;
    const organizationId = req.user.organizationId;

    const oc = await OnboardingCase.findOne({ _id: id, organizationId });
    if (!oc) return res.status(404).json({ success: false, message: 'Onboarding case not found' });

    const task = oc.tasks.id(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found in onboarding case' });

    task.isCompleted = Boolean(isCompleted);
    task.completedAt = task.isCompleted ? new Date() : null;
    task.completedBy = task.isCompleted ? req.user._id : null;
    if (notes !== undefined) task.notes = notes;

    // Recalculate overall progress
    const total = oc.tasks.length;
    const completed = oc.tasks.filter((t) => t.isCompleted).length;
    oc.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    if (oc.progress === 100) {
      oc.status = 'completed';
      oc.completedAt = new Date();
    } else {
      oc.status = 'in_progress';
    }

    await oc.save();
    return res.json({ success: true, data: oc });
  } catch (error) {
    console.error('toggleOnboardingTask error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── OFFBOARDING ──

exports.getOffboardingCases = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { status } = req.query;
    const query = { organizationId };
    if (status) query.status = status;

    const cases = await OffboardingCase.find(query)
      .populate({
        path: 'employeeId',
        select: 'fullName employeeCode email designation grade departmentId avatar hireDate',
        populate: { path: 'departmentId', select: 'name' },
      })
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: cases.length, data: cases });
  } catch (error) {
    console.error('getOffboardingCases error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createOffboardingCase = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { employeeId, resignationDate, noticePeriodDays, lastWorkingDate, reason, reasonDetails } = req.body;

    if (!employeeId || !lastWorkingDate) {
      return res.status(400).json({ success: false, message: 'employeeId and lastWorkingDate are required' });
    }

    const oc = await OffboardingCase.create({
      organizationId,
      employeeId,
      resignationDate: resignationDate || new Date(),
      noticePeriodDays: noticePeriodDays || 30,
      lastWorkingDate,
      reason: reason || 'better_opportunity',
      reasonDetails: reasonDetails || '',
      status: 'in_clearance',
    });

    // Sync inventory asset clearance
    await LifecycleService.syncAssetClearance(organizationId, employeeId, oc._id);

    const populated = await OffboardingCase.findById(oc._id).populate({
      path: 'employeeId',
      select: 'fullName employeeCode email designation grade departmentId',
      populate: { path: 'departmentId', select: 'name' },
    });

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('createOffboardingCase error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOffboardingClearance = async (req, res) => {
  try {
    const { id } = req.params;
    const { department, isCleared, notes } = req.body; // department: 'it' | 'finance' | 'adminAssets' | 'hr'
    const organizationId = req.user.organizationId;

    const oc = await OffboardingCase.findOne({ _id: id, organizationId });
    if (!oc) return res.status(404).json({ success: false, message: 'Offboarding case not found' });

    if (['it', 'finance', 'adminAssets', 'hr'].includes(department)) {
      oc.clearances[department].isCleared = Boolean(isCleared);
      oc.clearances[department].clearedBy = req.user._id;
      oc.clearances[department].clearedAt = isCleared ? new Date() : null;
      if (notes) oc.clearances[department].notes = notes;
    }

    // Check if all cleared
    const { it, finance, adminAssets, hr } = oc.clearances;
    if (it.isCleared && finance.isCleared && adminAssets.isCleared && hr.isCleared) {
      oc.status = 'completed';
      oc.completedAt = new Date();

      // Set employee status to exited
      await Employee.findOneAndUpdate(
        { _id: oc.employeeId, organizationId },
        { status: 'exited' }
      );
    }

    await oc.save();
    return res.json({ success: true, data: oc });
  } catch (error) {
    console.error('updateOffboardingClearance error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitExitInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, overallExperienceRating } = req.body;
    const organizationId = req.user.organizationId;

    const oc = await OffboardingCase.findOne({ _id: id, organizationId });
    if (!oc) return res.status(404).json({ success: false, message: 'Offboarding case not found' });

    oc.exitInterview = {
      completed: true,
      conductedBy: req.user._id,
      notes: notes || '',
      overallExperienceRating: overallExperienceRating ? Number(overallExperienceRating) : 4,
    };

    await oc.save();
    return res.json({ success: true, data: oc });
  } catch (error) {
    console.error('submitExitInterview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── HR HELPDESK TICKETS ──

exports.getTickets = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { status, category, employeeId } = req.query;
    const query = { organizationId };

    if (status) query.status = status;
    if (category) query.category = category;
    if (employeeId) query.employeeId = employeeId;

    const tickets = await HrTicket.find(query)
      .populate({
        path: 'employeeId',
        select: 'fullName employeeCode email designation grade departmentId avatar',
        populate: { path: 'departmentId', select: 'name' },
      })
      .populate('assignedTo', 'fullName email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    console.error('getTickets error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { employeeId, category, priority, subject, description } = req.body;

    if (!employeeId || !subject || !description) {
      return res.status(400).json({ success: false, message: 'employeeId, subject, and description are required' });
    }

    const count = await HrTicket.countDocuments({ organizationId });
    const ticketCode = `TICK-${(count + 1).toString().padStart(4, '0')}`;

    const ticket = await HrTicket.create({
      organizationId,
      employeeId,
      ticketCode,
      category: category || 'general',
      priority: priority || 'medium',
      subject,
      description,
      status: 'open',
    });

    const populated = await HrTicket.findById(ticket._id).populate({
      path: 'employeeId',
      select: 'fullName employeeCode email designation grade departmentId',
      populate: { path: 'departmentId', select: 'name' },
    });

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('createTicket error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, resolutionNotes } = req.body;
    const organizationId = req.user.organizationId;

    const ticket = await HrTicket.findOne({ _id: id, organizationId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    if (status) ticket.status = status;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo || null;
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    if (status === 'resolved') ticket.resolvedAt = new Date();
    if (status === 'closed') ticket.closedAt = new Date();

    await ticket.save();
    return res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('updateTicketStatus error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addTicketComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, isInternal } = req.body;
    const organizationId = req.user.organizationId;

    if (!message) return res.status(400).json({ success: false, message: 'message is required' });

    const ticket = await HrTicket.findOne({ _id: id, organizationId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.comments.push({
      authorId: req.user._id,
      message,
      isInternal: Boolean(isInternal),
      createdAt: new Date(),
    });

    await ticket.save();
    return res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('addTicketComment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── HR LETTERS ──

exports.getLetterTemplates = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    let templates = await LetterTemplate.find({ organizationId, isActive: true });

    // Seed defaults if empty
    if (templates.length === 0) {
      await LetterTemplate.insertMany([
        {
          organizationId,
          name: 'Employment Verification Letter',
          letterType: 'verification',
          subject: 'Employment Verification Certificate',
          bodyTemplate:
            'This is to certify that {{employee.fullName}} (Employee ID: {{employee.employeeCode}}) is employed with {{organization.name}} as {{employee.designation}} since {{employee.hireDate}} in the {{employee.department}} department. Their current status is active and in good standing.',
        },
        {
          organizationId,
          name: 'Experience & Relieving Certificate',
          letterType: 'experience',
          subject: 'Experience and Relieving Certificate',
          bodyTemplate:
            'This letter confirms that {{employee.fullName}} served at {{organization.name}} as {{employee.designation}} from {{employee.hireDate}}. During their tenure, they demonstrated dedication, integrity, and strong performance. We wish them success in all future endeavors.',
        },
        {
          organizationId,
          name: 'Promotion & Title Revision Letter',
          letterType: 'promotion',
          subject: 'Promotion and Compensation Revision Notice',
          bodyTemplate:
            'We are delighted to congratulate {{employee.fullName}} on their well-deserved promotion to {{employee.designation}} (Grade {{employee.grade}}) at {{organization.name}}. This promotion recognizes your significant contributions and leadership.',
        },
      ]);
      templates = await LetterTemplate.find({ organizationId, isActive: true });
    }

    return res.json({ success: true, count: templates.length, data: templates });
  } catch (error) {
    console.error('getLetterTemplates error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateLetterPdf = async (req, res) => {
  try {
    const { templateId, employeeId } = req.body;
    const organizationId = req.user.organizationId;

    const [template, employee, org] = await Promise.all([
      LetterTemplate.findOne({ _id: templateId, organizationId }),
      Employee.findOne({ _id: employeeId, organizationId }).populate('departmentId'),
      Organization.findById(organizationId),
    ]);

    if (!template || !employee) {
      return res.status(404).json({ success: false, message: 'Template or employee not found' });
    }

    const count = (template.issuedLetters || []).length + 1;
    const letterNumber = `NEB-${template.letterType.toUpperCase()}-${count.toString().padStart(4, '0')}`;

    const compiledContent = LifecycleService.compileTemplate(template.bodyTemplate, {
      employee,
      organization: org,
      letterNumber,
    });

    // Log issued letter
    template.issuedLetters.push({
      employeeId: employee._id,
      letterNumber,
      contentSnapshot: compiledContent,
      issuedBy: req.user._id,
      issuedAt: new Date(),
    });
    await template.save();

    // Stream PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${template.letterType}_${employee.employeeCode}.pdf"`);

    LifecycleService.generateLetterPdf(
      {
        organization: org,
        employee,
        subject: template.subject,
        content: compiledContent,
        letterNumber,
      },
      res
    );
  } catch (error) {
    console.error('generateLetterPdf error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── POLICIES & ANNOUNCEMENTS ──

exports.getPolicies = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    let policies = await PolicyDocument.find({ organizationId, isActive: true }).sort({ createdAt: -1 });

    // Seed standard policies if empty
    if (policies.length === 0) {
      await PolicyDocument.insertMany([
        {
          organizationId,
          title: 'Remote Work & Hybrid Attendance Policy',
          category: 'leave_wfh',
          version: '1.2',
          isRequiredAcknowledgement: true,
          content: 'Employees eligible for hybrid schedules may work remotely up to 2 days per week with manager coordination. Standard shift hours and punctual live attendance clocking apply equally across remote and in-office shifts.',
        },
        {
          organizationId,
          title: 'Information Security & Data Protection Charter',
          category: 'it_security',
          version: '2.0',
          isRequiredAcknowledgement: true,
          content: 'All computing hardware and credentials issued by Nebula Enterprise remain corporate property. Confidential customer data must never be exported to unapproved personal storage or unencrypted media.',
        },
        {
          organizationId,
          title: 'Workplace Conduct & Anti-Harassment Guidelines',
          category: 'conduct_ethics',
          version: '1.0',
          isRequiredAcknowledgement: true,
          content: 'Nebula is committed to an inclusive, respectful workplace free of discrimination and harassment. Transparent reporting mechanisms exist under HR Helpdesk with complete confidentiality protection.',
        },
      ]);
      policies = await PolicyDocument.find({ organizationId, isActive: true }).sort({ createdAt: -1 });
    }

    return res.json({ success: true, count: policies.length, data: policies });
  } catch (error) {
    console.error('getPolicies error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.acknowledgePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;
    const organizationId = req.user.organizationId;

    const policy = await PolicyDocument.findOne({ _id: id, organizationId });
    if (!policy) return res.status(404).json({ success: false, message: 'Policy document not found' });

    const existing = (policy.acknowledgements || []).some(
      (a) => a.employeeId?.toString() === employeeId.toString()
    );

    if (!existing) {
      policy.acknowledgements.push({
        employeeId,
        acknowledgedAt: new Date(),
      });
      await policy.save();
    }

    return res.json({ success: true, message: 'Policy acknowledged successfully' });
  } catch (error) {
    console.error('acknowledgePolicy error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const announcements = await Announcement.find({ organizationId, isActive: true })
      .populate('authorId', 'fullName email')
      .sort({ publishedAt: -1 });

    return res.json({ success: true, count: announcements.length, data: announcements });
  } catch (error) {
    console.error('getAnnouncements error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { title, content, priority, targetDepartments } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'title and content are required' });
    }

    const announcement = await Announcement.create({
      organizationId,
      title,
      content,
      priority: priority || 'normal',
      targetDepartments: targetDepartments || [],
      authorId: req.user._id,
      publishedAt: new Date(),
    });

    return res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error('createAnnouncement error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
