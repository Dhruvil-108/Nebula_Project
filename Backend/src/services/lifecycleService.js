const PDFDocument = require('pdfkit');
const OnboardingTemplate = require('../models/OnboardingTemplate');
const OnboardingCase = require('../models/OnboardingCase');
const OffboardingCase = require('../models/OffboardingCase');
const EmployeeAssetAssignment = require('../models/EmployeeAssetAssignment');
const LetterTemplate = require('../models/LetterTemplate');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');
const JobOpening = require('../models/JobOpening');

class LifecycleService {
  /**
   * Instantiate onboarding case with tasks from template or default suite
   */
  static async createOnboardingCase(organizationId, employeeId, joiningDate = new Date(), templateId = null) {
    let template = null;
    if (templateId) {
      template = await OnboardingTemplate.findOne({ _id: templateId, organizationId });
    }
    if (!template) {
      template = await OnboardingTemplate.findOne({ organizationId, isDefault: true });
    }

    const jDate = new Date(joiningDate);
    const tasks = [];

    if (template && template.tasks && template.tasks.length > 0) {
      template.tasks.forEach((t) => {
        const due = new Date(jDate.getTime() + (t.daysDueFromJoining || 0) * 24 * 60 * 60 * 1000);
        tasks.push({
          title: t.title,
          description: t.description || '',
          assignedRole: t.assignedRole || 'hr',
          dueDate: due,
          isCompleted: false,
        });
      });
    } else {
      // Standard ERP Defaults
      tasks.push(
        { title: 'Verify Government ID & Bank Details', assignedRole: 'hr', dueDate: new Date(jDate.getTime() + 1 * 86400000) },
        { title: 'Provision Laptop & Workspace Access', assignedRole: 'it', dueDate: new Date(jDate.getTime() + 1 * 86400000) },
        { title: 'Setup Direct Deposit & Tax Declaration', assignedRole: 'finance', dueDate: new Date(jDate.getTime() + 3 * 86400000) },
        { title: 'Welcome 1-on-1 & Team Introduction', assignedRole: 'manager', dueDate: new Date(jDate.getTime() + 2 * 86400000) },
        { title: 'Acknowledge Employee Handbook & Policies', assignedRole: 'employee', dueDate: new Date(jDate.getTime() + 5 * 86400000) }
      );
    }

    const onboardingCase = await OnboardingCase.create({
      organizationId,
      employeeId,
      templateId: template?._id || null,
      joiningDate: jDate,
      status: 'in_progress',
      progress: 0,
      tasks,
    });

    return onboardingCase;
  }

  /**
   * Check Inventory assets assigned to employee and synchronize clearance count
   */
  static async syncAssetClearance(organizationId, employeeId, offboardingCaseId) {
    let pendingCount = 0;
    try {
      pendingCount = await EmployeeAssetAssignment.countDocuments({
        organizationId,
        employeeId,
        status: { $in: ['assigned', 'in_use', 'pending_return'] },
      });
    } catch {
      pendingCount = 0;
    }

    const offboarding = await OffboardingCase.findOne({ _id: offboardingCaseId, organizationId });
    if (offboarding) {
      offboarding.clearances.adminAssets.pendingAssetsCount = pendingCount;
      if (pendingCount === 0 && !offboarding.clearances.adminAssets.isCleared) {
        offboarding.clearances.adminAssets.isCleared = true;
        offboarding.clearances.adminAssets.clearedAt = new Date();
      }
      await offboarding.save();
    }
    return pendingCount;
  }

  /**
   * Compile letter template variables
   */
  static compileTemplate(templateString, data = {}) {
    let result = templateString || '';
    const replacements = {
      '{{employee.fullName}}': data.employee?.fullName || 'Employee',
      '{{employee.employeeCode}}': data.employee?.employeeCode || 'EMP-000',
      '{{employee.designation}}': data.employee?.designation || data.employee?.designationId?.title || 'Team Member',
      '{{employee.department}}': data.employee?.departmentId?.name || 'General',
      '{{employee.hireDate}}': data.employee?.hireDate ? new Date(data.employee.hireDate).toLocaleDateString() : 'N/A',
      '{{employee.grade}}': data.employee?.grade || 'L2',
      '{{organization.name}}': data.organization?.name || 'Nebula Enterprise',
      '{{currentDate}}': new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }),
      '{{letterNumber}}': data.letterNumber || `NEB-LTR-${Date.now().toString().slice(-6)}`,
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  }

  /**
   * Render branded vector PDF for an official HR letter
   */
  static generateLetterPdf(letterData, res) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    doc.pipe(res);

    // Letterhead Header
    doc
      .fillColor('#f97316')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(letterData.organization?.name || 'NEBULA ENTERPRISE', 50, 50);

    doc
      .fillColor('#6B6B6B')
      .fontSize(9)
      .font('Helvetica')
      .text('Corporate Human Resources & People Operations', 50, 75)
      .text(`Date of Issue: ${new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}`, 50, 88)
      .text(`Ref. Number: ${letterData.letterNumber}`, 50, 100);

    doc
      .strokeColor('#ECE0D6')
      .lineWidth(1)
      .moveTo(50, 120)
      .lineTo(545, 120)
      .stroke();

    // Subject
    doc
      .fillColor('#1A1A1A')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(`SUBJECT: ${letterData.subject.toUpperCase()}`, 50, 145);

    // Salutation
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Dear ${letterData.employee?.fullName || 'Colleague'},`, 50, 175);

    // Body content
    doc
      .fontSize(10)
      .lineGap(5)
      .text(letterData.content, 50, 205, { width: 495, align: 'justify' });

    // Sign-off footer
    const footerY = 650;
    doc
      .strokeColor('#ECE0D6')
      .lineWidth(0.5)
      .moveTo(50, footerY)
      .lineTo(545, footerY)
      .stroke();

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1A1A1A')
      .text('Authorized Human Resources Signatory', 50, footerY + 15)
      .font('Helvetica')
      .fillColor('#6B6B6B')
      .fontSize(8)
      .text(`${letterData.organization?.name || 'Nebula Enterprise'} • Digitally Verified Official Document`, 50, footerY + 30)
      .text('This letter is issued under corporate authorization and valid without physical seal.', 50, footerY + 42);

    doc.end();
  }

  /**
   * Auto-spawn ATS Job Opening from approved Manpower Requisition
   */
  static async spawnJobOpeningFromRequisition(requisition, organizationId, userId) {
    try {
      const job = await JobOpening.create({
        organizationId,
        title: requisition.title,
        department: requisition.departmentId,
        positions: requisition.openingsCount || 1,
        status: 'published',
        description: `Position generated from approved Manpower Requisition: ${requisition.requisitionCode}. ${requisition.notes || ''}`,
        createdBy: userId,
      });
      requisition.linkedJobOpeningId = job._id;
      requisition.status = 'job_opened';
      await requisition.save();
      return job;
    } catch (err) {
      console.warn('Could not auto-spawn JobOpening:', err.message);
      return null;
    }
  }
}

module.exports = LifecycleService;
