const mongoose = require('mongoose');
const PayrollRun = require('../models/PayrollRun');
const Payslip = require('../models/Payslip');
const SalaryStructure = require('../models/SalaryStructure');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');
const payrollService = require('../services/payrollService');
const { logAuditEvent } = require('../services/auditService');
const { resolveCanonicalEmployeeId } = require('../utils/employeeUtils');

const canManagePayroll = (role) => ['super_admin', 'admin', 'hr'].includes(role);

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/payroll/runs
// ─────────────────────────────────────────────────────────
const getPayrollRuns = async (req, res) => {
  try {
    const runs = await PayrollRun.find({ organizationId: req.organizationId })
      .populate('processedBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .sort({ year: -1, month: -1 })
      .lean();

    return res.json(runs);
  } catch (err) {
    console.error('[payroll.getPayrollRuns] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve payroll runs.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/payroll/runs/:id
// ─────────────────────────────────────────────────────────
const getPayrollRunById = async (req, res) => {
  try {
    const { id } = req.params;
    const run = await PayrollRun.findOne({ _id: id, organizationId: req.organizationId })
      .populate('processedBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .lean();

    if (!run) {
      return res.status(404).json({ error: 'Payroll run not found.' });
    }

    const payslips = await Payslip.find({
      organizationId: req.organizationId,
      payrollRunId: id,
    })
      .populate('employeeId', 'fullName employeeCode designation departmentId grade')
      .sort({ 'attendanceSummary.lopDays': -1, netPay: -1 })
      .lean();

    return res.json({ ...run, payslips });
  } catch (err) {
    console.error('[payroll.getPayrollRunById] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve payroll run details.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/payroll/runs
// ─────────────────────────────────────────────────────────
const createPayrollRun = async (req, res) => {
  try {
    if (!canManagePayroll(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only HR and Admins can execute payroll runs.' });
    }

    const { month, year, notes } = req.body;
    const numMonth = Number(month);
    const numYear = Number(year);

    if (!numMonth || numMonth < 1 || numMonth > 12 || !numYear) {
      return res.status(400).json({ error: 'Valid month (1-12) and year are required.' });
    }

    // Check if payroll already exists for this period
    const existing = await PayrollRun.findOne({
      organizationId: req.organizationId,
      year: numYear,
      month: numMonth,
    }).lean();

    if (existing) {
      return res.status(409).json({
        error: `A payroll run for ${numYear}-${String(numMonth).padStart(2, '0')} already exists (Status: ${existing.status}).`,
        existingId: existing._id,
      });
    }

    // Fetch all active employees
    const employees = await Employee.find({
      organizationId: req.organizationId,
      status: 'active',
    })
      .populate('departmentId', 'name')
      .lean();

    if (employees.length === 0) {
      return res.status(400).json({ error: 'No active employees found to execute payroll.' });
    }

    const runCode = `PAY-${numYear}-${String(numMonth).padStart(2, '0')}`;
    let totalGrossPay = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;
    let totalLopDays = 0;

    const computedSlips = [];

    for (const emp of employees) {
      const computed = await payrollService.computeEmployeePayslip({
        organizationId: req.organizationId,
        employee: emp,
        year: numYear,
        month: numMonth,
      });

      totalGrossPay += computed.earnings.grossEarnings;
      totalDeductions += computed.deductions.totalDeductions;
      totalNetPay += computed.netPay;
      totalLopDays += computed.attendanceSummary.lopDays;

      computedSlips.push(computed);
    }

    const payrollRun = await PayrollRun.create({
      organizationId: req.organizationId,
      month: numMonth,
      year: numYear,
      runCode,
      status: 'draft',
      totalEmployees: employees.length,
      totalGrossPay,
      totalDeductions,
      totalNetPay,
      totalLopDays,
      processedBy: req.user._id,
      notes: notes || '',
    });

    // Bulk insert individual payslips
    const payslipDocs = computedSlips.map((s) => ({
      ...s,
      organizationId: req.organizationId,
      payrollRunId: payrollRun._id,
      status: 'draft',
    }));

    await Payslip.insertMany(payslipDocs);

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'payroll.run_created',
      entityType: 'PayrollRun',
      entityId: payrollRun._id,
      after: payrollRun.toObject(),
      req,
    });

    return res.status(201).json({
      message: `Payroll run ${runCode} generated successfully.`,
      payrollRun,
      employeeCount: employees.length,
    });
  } catch (err) {
    console.error('[payroll.createPayrollRun] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to process payroll run.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/hr/payroll/payslips/:id
// Adjust draft payslip line items (bonus, reimbursement, custom deductions)
// ─────────────────────────────────────────────────────────
const updatePayslipLineItem = async (req, res) => {
  try {
    if (!canManagePayroll(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { id } = req.params;
    const { performanceBonus, reimbursements, otherEarnings, otherDeductions, remarks } = req.body;

    const payslip = await Payslip.findOne({ _id: id, organizationId: req.organizationId });
    if (!payslip) {
      return res.status(404).json({ error: 'Payslip not found.' });
    }

    if (payslip.status === 'paid') {
      return res.status(400).json({ error: 'Cannot modify an already disbursed/paid payslip.' });
    }

    if (performanceBonus !== undefined) payslip.earnings.performanceBonus = Math.max(0, Number(performanceBonus));
    if (reimbursements !== undefined) payslip.earnings.reimbursements = Math.max(0, Number(reimbursements));
    if (otherEarnings !== undefined) payslip.earnings.otherEarnings = Math.max(0, Number(otherEarnings));
    if (otherDeductions !== undefined) payslip.deductions.otherDeductions = Math.max(0, Number(otherDeductions));
    if (remarks !== undefined) payslip.remarks = String(remarks);

    // Recalculate gross
    const e = payslip.earnings;
    e.grossEarnings =
      (e.basic || 0) +
      (e.hra || 0) +
      (e.specialAllowance || 0) +
      (e.conveyance || 0) +
      (e.medicalAllowance || 0) +
      (e.performanceBonus || 0) +
      (e.reimbursements || 0) +
      (e.otherEarnings || 0);

    // Recalculate deductions
    const d = payslip.deductions;
    d.totalDeductions =
      (d.providentFund || 0) +
      (d.professionalTax || 0) +
      (d.incomeTaxTds || 0) +
      (d.esi || 0) +
      (d.lopDeduction || 0) +
      (d.otherDeductions || 0);

    // Recalculate net pay
    payslip.netPay = Math.max(0, e.grossEarnings - d.totalDeductions);
    await payslip.save();

    // Recalculate parent PayrollRun totals
    const runSlips = await Payslip.find({ payrollRunId: payslip.payrollRunId });
    let totalGross = 0;
    let totalDed = 0;
    let totalNet = 0;
    for (const s of runSlips) {
      totalGross += s.earnings.grossEarnings;
      totalDed += s.deductions.totalDeductions;
      totalNet += s.netPay;
    }

    await PayrollRun.findByIdAndUpdate(payslip.payrollRunId, {
      totalGrossPay: totalGross,
      totalDeductions: totalDed,
      totalNetPay: totalNet,
    });

    return res.json({ message: 'Payslip line item updated.', payslip });
  } catch (err) {
    console.error('[payroll.updatePayslipLineItem] Error:', err);
    return res.status(500).json({ error: 'Failed to update payslip line item.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/hr/payroll/runs/:id/approve
// ─────────────────────────────────────────────────────────
const approvePayrollRun = async (req, res) => {
  try {
    if (!canManagePayroll(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { id } = req.params;
    const run = await PayrollRun.findOne({ _id: id, organizationId: req.organizationId });
    if (!run) {
      return res.status(404).json({ error: 'Payroll run not found.' });
    }

    if (run.status === 'paid') {
      return res.status(400).json({ error: 'Payroll run is already paid.' });
    }

    run.status = 'approved';
    run.approvedBy = req.user._id;
    run.approvedAt = new Date();
    await run.save();

    await Payslip.updateMany(
      { organizationId: req.organizationId, payrollRunId: id },
      { status: 'published' }
    );

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'payroll.run_approved',
      entityType: 'PayrollRun',
      entityId: id,
      after: run.toObject(),
      req,
    });

    return res.json({ message: 'Payroll run approved and published to employee portal.', payrollRun: run });
  } catch (err) {
    console.error('[payroll.approvePayrollRun] Error:', err);
    return res.status(500).json({ error: 'Failed to approve payroll run.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/hr/payroll/runs/:id/pay
// ─────────────────────────────────────────────────────────
const markPayrollRunPaid = async (req, res) => {
  try {
    if (!canManagePayroll(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { id } = req.params;
    const { paymentReference, paymentDate } = req.body;

    const run = await PayrollRun.findOne({ _id: id, organizationId: req.organizationId });
    if (!run) {
      return res.status(404).json({ error: 'Payroll run not found.' });
    }

    run.status = 'paid';
    run.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    run.paymentReference = paymentReference || `ACH-TX-${Date.now()}`;
    await run.save();

    await Payslip.updateMany(
      { organizationId: req.organizationId, payrollRunId: id },
      {
        status: 'paid',
        paymentStatus: 'paid',
        paymentDate: run.paymentDate,
        paymentReference: run.paymentReference,
      }
    );

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'payroll.run_paid',
      entityType: 'PayrollRun',
      entityId: id,
      after: run.toObject(),
      req,
    });

    return res.json({ message: 'Payroll run marked as paid and disbursed.', payrollRun: run });
  } catch (err) {
    console.error('[payroll.markPayrollRunPaid] Error:', err);
    return res.status(500).json({ error: 'Failed to disburse payroll.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/payroll/my-payslips
// ─────────────────────────────────────────────────────────
const getMyPayslips = async (req, res) => {
  try {
    const canonical = await resolveCanonicalEmployeeId(req.organizationId, req.user._id);
    if (!canonical.employeeId) {
      return res.status(404).json({ error: 'Employee profile not linked to user account.' });
    }

    const payslips = await Payslip.find({
      organizationId: req.organizationId,
      employeeId: canonical.employeeId,
      status: { $in: ['published', 'paid'] },
    })
      .sort({ year: -1, month: -1 })
      .lean();

    return res.json(payslips);
  } catch (err) {
    console.error('[payroll.getMyPayslips] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve personal payslips.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/payroll/payslips/:id
// ─────────────────────────────────────────────────────────
const getPayslipById = async (req, res) => {
  try {
    const { id } = req.params;
    const payslip = await Payslip.findOne({ _id: id, organizationId: req.organizationId })
      .populate('employeeId', 'fullName employeeCode designation departmentId grade email phone')
      .lean();

    if (!payslip) {
      return res.status(404).json({ error: 'Payslip not found.' });
    }

    // Permission check: if employee, must be their own record
    if (!canManagePayroll(req.user.role)) {
      const canonical = await resolveCanonicalEmployeeId(req.organizationId, req.user._id);
      if (!canonical.employeeId || canonical.employeeId.toString() !== payslip.employeeId._id.toString()) {
        return res.status(403).json({ error: 'Access denied. You can only view your own payslip.' });
      }
    }

    return res.json(payslip);
  } catch (err) {
    console.error('[payroll.getPayslipById] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve payslip.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/payroll/payslips/:id/pdf
// ─────────────────────────────────────────────────────────
const downloadPayslipPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const payslip = await Payslip.findOne({ _id: id, organizationId: req.organizationId })
      .populate('employeeId', 'fullName employeeCode designation departmentId grade')
      .lean();

    if (!payslip) {
      return res.status(404).json({ error: 'Payslip not found.' });
    }

    const organization = (await Organization.findById(req.organizationId).lean()) || {
      name: 'Nebula Technologies',
    };

    const pdfBuffer = await payrollService.generatePayslipPdf(payslip, organization);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="payslip-${payslip.slipCode}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('[payroll.downloadPayslipPdf] Error:', err);
    return res.status(500).json({ error: 'Failed to generate payslip PDF.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/payroll/salary-structures/:employeeId
// ─────────────────────────────────────────────────────────
const getSalaryStructure = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findOne({ _id: employeeId, organizationId: req.organizationId });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const structure = await payrollService.resolveSalaryStructure(req.organizationId, employee);
    return res.json(structure);
  } catch (err) {
    console.error('[payroll.getSalaryStructure] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve salary structure.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/payroll/salary-structures/:employeeId
// ─────────────────────────────────────────────────────────
const upsertSalaryStructure = async (req, res) => {
  try {
    if (!canManagePayroll(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { employeeId } = req.params;
    const { annualCtc, earnings, deductions, currency, templateName } = req.body;

    const numCtc = Number(annualCtc);
    if (!numCtc || numCtc <= 0) {
      return res.status(400).json({ error: 'Valid annual CTC is required.' });
    }

    const monthlyCtc = Math.round(numCtc / 12);

    const updated = await SalaryStructure.findOneAndUpdate(
      { organizationId: req.organizationId, employeeId },
      {
        $set: {
          annualCtc: numCtc,
          monthlyCtc,
          earnings: earnings || {},
          deductions: deductions || {},
          currency: currency || 'USD',
          templateName: templateName || 'Custom CTC Band',
          isActive: true,
        },
      },
      { upsert: true, new: true }
    ).lean();

    return res.json({ message: 'Salary structure updated successfully.', structure: updated });
  } catch (err) {
    console.error('[payroll.upsertSalaryStructure] Error:', err);
    return res.status(500).json({ error: 'Failed to save salary structure.' });
  }
};

module.exports = {
  getPayrollRuns,
  getPayrollRunById,
  createPayrollRun,
  updatePayslipLineItem,
  approvePayrollRun,
  markPayrollRunPaid,
  getMyPayslips,
  getPayslipById,
  downloadPayslipPdf,
  getSalaryStructure,
  upsertSalaryStructure,
};
