const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');
const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveRequest = require('../models/LeaveRequest');
const Holiday = require('../models/Holiday');
const Organization = require('../models/Organization');

// Default Grade-based Annual CTC Fallbacks (in USD or base currency)
const GRADE_DEFAULT_CTC = {
  L1: 45000,
  L2: 65000,
  L3: 95000,
  L4: 130000,
  L5: 175000,
  L6: 230000,
  L7: 300000,
};

/**
 * Derives default monthly earning and deduction components from an annual CTC
 */
const deriveComponentsFromCtc = (annualCtc) => {
  const monthlyCtc = Math.round(annualCtc / 12);
  const basic = Math.round(monthlyCtc * 0.5); // 50% Basic
  const hra = Math.round(monthlyCtc * 0.2); // 20% HRA
  const conveyance = 1600;
  const medicalAllowance = 1250;
  const specialAllowance = Math.max(0, monthlyCtc - (basic + hra + conveyance + medicalAllowance));

  // Deductions
  const pf = Math.round(basic * 0.12); // 12% of Basic
  const pt = 200; // Standard PT
  const tds = Math.round(monthlyCtc * 0.1); // ~10% estimated tax withholding

  return {
    annualCtc,
    monthlyCtc,
    earnings: {
      basic,
      hra,
      conveyance,
      medicalAllowance,
      specialAllowance,
      performanceBonus: 0,
      otherEarnings: 0,
    },
    deductions: {
      providentFund: pf,
      professionalTax: pt,
      incomeTaxTds: tds,
      esi: 0,
      otherDeductions: 0,
    },
  };
};

/**
 * Calculates calendar days and weekends in month
 */
const getMonthCalendarMetrics = (year, month) => {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const totalDays = new Date(year, month, 0).getDate();

  let weekendDays = 0;
  for (let d = 1; d <= totalDays; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDays++;
    }
  }

  const standardWorkingDays = totalDays - weekendDays;

  return {
    startDate,
    endDate,
    totalDays,
    weekendDays,
    standardWorkingDays,
  };
};

/**
 * Core Payroll Computation Engine
 */
class PayrollService {
  /**
   * Generates or fetches an employee's active salary structure
   */
  async resolveSalaryStructure(organizationId, employee) {
    let structure = await SalaryStructure.findOne({
      organizationId,
      employeeId: employee._id,
      isActive: true,
    }).lean();

    if (!structure) {
      const grade = employee.grade || 'L2';
      const ctc = GRADE_DEFAULT_CTC[grade] || 65000;
      const derived = deriveComponentsFromCtc(ctc);

      structure = await SalaryStructure.create({
        organizationId,
        employeeId: employee._id,
        templateName: `${grade} Standard Pay Band`,
        currency: 'USD',
        annualCtc: derived.annualCtc,
        monthlyCtc: derived.monthlyCtc,
        earnings: derived.earnings,
        deductions: derived.deductions,
        isActive: true,
      });
      structure = structure.toObject();
    }

    return structure;
  }

  /**
   * Computes a single employee's payslip breakdown for a given month and year
   */
  async computeEmployeePayslip({ organizationId, employee, year, month }) {
    const calendar = getMonthCalendarMetrics(year, month);
    const structure = await this.resolveSalaryStructure(organizationId, employee);

    // 1. Query attendance punches in this month
    const attendanceRecords = await AttendanceRecord.find({
      organizationId,
      employeeId: employee._id,
      date: { $gte: calendar.startDate, $lte: calendar.endDate },
    }).lean();

    let presentDays = 0;
    for (const rec of attendanceRecords) {
      if (rec.status === 'present') presentDays += 1;
      else if (rec.status === 'half_day') presentDays += 0.5;
    }

    // 2. Query approved paid leaves in this month
    const approvedLeaves = await LeaveRequest.find({
      organizationId,
      employeeId: employee._id,
      status: 'approved',
      startDate: { $lte: calendar.endDate },
      endDate: { $gte: calendar.startDate },
    }).lean();

    let paidLeaveDays = 0;
    for (const l of approvedLeaves) {
      paidLeaveDays += Number(l.totalDays) || 0;
    }

    // 3. Query holidays in this month
    const holidays = await Holiday.find({
      organizationId,
      date: { $gte: calendar.startDate, $lte: calendar.endDate },
    }).lean();
    const holidayDays = holidays.length;

    // Accounted days = present + leaves + weekends + holidays
    // If an employee has no attendance tracking yet (e.g. newly joined or exempt), default to full attendance
    let payableDays;
    let lopDays = 0;

    if (attendanceRecords.length === 0 && approvedLeaves.length === 0) {
      // Clean default: full payable days
      payableDays = calendar.totalDays;
      presentDays = calendar.standardWorkingDays;
      lopDays = 0;
    } else {
      const accountedDays = presentDays + paidLeaveDays + holidayDays + calendar.weekendDays;
      lopDays = Math.max(0, calendar.totalDays - accountedDays);
      payableDays = Math.max(0, calendar.totalDays - lopDays);
    }

    const prorateFactor = calendar.totalDays > 0 ? payableDays / calendar.totalDays : 1;

    // Prorate components
    const basic = Math.round(structure.earnings.basic * prorateFactor);
    const hra = Math.round(structure.earnings.hra * prorateFactor);
    const specialAllowance = Math.round(structure.earnings.specialAllowance * prorateFactor);
    const conveyance = Math.round((structure.earnings.conveyance || 0) * prorateFactor);
    const medicalAllowance = Math.round((structure.earnings.medicalAllowance || 0) * prorateFactor);
    const performanceBonus = structure.earnings.performanceBonus || 0;
    const reimbursements = 0;
    const otherEarnings = structure.earnings.otherEarnings || 0;

    const grossEarnings = basic + hra + specialAllowance + conveyance + medicalAllowance + performanceBonus + reimbursements + otherEarnings;

    // Deductions
    const providentFund = Math.round(structure.deductions.providentFund * prorateFactor);
    const professionalTax = structure.deductions.professionalTax || 0;
    const incomeTaxTds = structure.deductions.incomeTaxTds || 0;
    const esi = structure.deductions.esi || 0;
    const otherDeductions = structure.deductions.otherDeductions || 0;

    const totalDeductions = providentFund + professionalTax + incomeTaxTds + esi + otherDeductions;
    const netPay = Math.max(0, grossEarnings - totalDeductions);

    // Snapshot details
    const bankDetails = employee.bankDetails || {};
    const accountNumber = bankDetails.accountNumber ? String(bankDetails.accountNumber) : '';
    const maskedAcc = accountNumber.length > 4 ? `•••• •••• ${accountNumber.slice(-4)}` : accountNumber;

    return {
      employeeId: employee._id,
      month,
      year,
      slipCode: `SLIP-${year}-${String(month).padStart(2, '0')}-${employee.employeeCode}`,
      currency: structure.currency || 'USD',
      attendanceSummary: {
        totalDaysInMonth: calendar.totalDays,
        workingDays: calendar.standardWorkingDays,
        presentDays,
        paidLeaveDays,
        weeklyOffDays: calendar.weekendDays,
        holidayDays,
        lopDays,
        payableDays,
      },
      earnings: {
        basic,
        hra,
        specialAllowance,
        conveyance,
        medicalAllowance,
        performanceBonus,
        reimbursements,
        otherEarnings,
        grossEarnings,
      },
      deductions: {
        providentFund,
        professionalTax,
        incomeTaxTds,
        esi,
        lopDeduction: 0,
        otherDeductions,
        totalDeductions,
      },
      netPay,
      bankDetailsSnapshot: {
        bankName: bankDetails.bankName || '',
        branchName: bankDetails.branchName || '',
        accountNumberMasked: maskedAcc,
        ifscCode: bankDetails.ifscCode || '',
      },
      panSnapshot: employee.statutoryIds?.pan || '',
      uanSnapshot: employee.statutoryIds?.uan || '',
      designationSnapshot: employee.designation || '',
      departmentSnapshot: employee.departmentId?.name || '',
    };
  }

  /**
   * Generates a high-quality PDF Buffer for a Payslip
   */
  async generatePayslipPdf(payslip, organization) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `Payslip - ${payslip.slipCode}`,
            Author: organization.name || 'Nebula Technologies',
            Subject: `Salary Slip for ${payslip.employeeId?.fullName || 'Employee'}`,
          },
        });

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const brandOrange = '#f97316';
        const darkText = '#1A1A1A';
        const mutedText = '#6B6B6B';
        const borderColor = '#ECE0D6';
        const warmBg = '#FBF8F4';

        // ── Header Banner ──
        doc.rect(40, 40, 515, 65).fill(warmBg);
        doc.rect(40, 40, 515, 65).stroke(borderColor);

        doc.fillColor(brandOrange).fontSize(16).font('Helvetica-Bold').text(organization.name || 'NEBULA TECHNOLOGIES', 55, 52);
        doc.fillColor(mutedText).fontSize(9).font('Helvetica').text('CONFIDENTIAL SALARY PAYSLIP', 55, 74);
        doc.fillColor(darkText).fontSize(10).font('Helvetica-Bold').text(
          `PAY PERIOD: ${new Date(payslip.year, payslip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}`,
          330,
          52,
          { align: 'right' }
        );
        doc.fillColor(mutedText).fontSize(8).font('Helvetica').text(`SLIP REF: ${payslip.slipCode}`, 330, 74, { align: 'right' });

        // ── Employee Information Table ──
        let y = 120;
        doc.rect(40, y, 515, 80).fill('#ffffff').stroke(borderColor);

        const empName = payslip.employeeId?.fullName || 'Employee';
        const empCode = payslip.employeeId?.employeeCode || '—';
        const designation = payslip.designationSnapshot || payslip.employeeId?.designation || 'Staff';
        const dept = payslip.departmentSnapshot || payslip.employeeId?.departmentId?.name || 'General';

        doc.fillColor(mutedText).fontSize(8).font('Helvetica');
        doc.text('Employee Name:', 55, y + 10);
        doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold').text(empName, 135, y + 10);

        doc.fillColor(mutedText).fontSize(8).font('Helvetica');
        doc.text('Employee Code:', 320, y + 10);
        doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold').text(empCode, 410, y + 10);

        doc.fillColor(mutedText).fontSize(8).font('Helvetica');
        doc.text('Designation:', 55, y + 28);
        doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold').text(designation, 135, y + 28);

        doc.fillColor(mutedText).fontSize(8).font('Helvetica');
        doc.text('Department:', 320, y + 28);
        doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold').text(dept, 410, y + 28);

        doc.fillColor(mutedText).fontSize(8).font('Helvetica');
        doc.text('Bank Account:', 55, y + 46);
        doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold').text(payslip.bankDetailsSnapshot?.accountNumberMasked || 'Direct Deposit', 135, y + 46);

        doc.fillColor(mutedText).fontSize(8).font('Helvetica');
        doc.text('PAN / Tax ID:', 320, y + 46);
        doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold').text(payslip.panSnapshot || '—', 410, y + 46);

        // ── Attendance Metrics Strip ──
        y = 215;
        doc.rect(40, y, 515, 45).fill(warmBg).stroke(borderColor);

        const att = payslip.attendanceSummary || {};
        doc.fillColor(mutedText).fontSize(8).font('Helvetica');
        doc.text('Total Days', 55, y + 8);
        doc.text('Payable Days', 160, y + 8);
        doc.text('Present Days', 265, y + 8);
        doc.text('Paid Leaves', 360, y + 8);
        doc.text('LOP Days', 465, y + 8);

        doc.fillColor(darkText).fontSize(11).font('Helvetica-Bold');
        doc.text(String(att.totalDaysInMonth ?? 30), 55, y + 22);
        doc.fillColor(brandOrange).text(String(att.payableDays ?? 30), 160, y + 22);
        doc.fillColor(darkText).text(String(att.presentDays ?? 0), 265, y + 22);
        doc.text(String(att.paidLeaveDays ?? 0), 360, y + 22);
        doc.fillColor('#dc2626').text(String(att.lopDays ?? 0), 465, y + 22);

        // ── Earnings & Deductions Columns ──
        y = 275;
        // Earnings Column Header
        doc.rect(40, y, 250, 24).fill(brandOrange);
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('EARNINGS', 50, y + 7);
        doc.text('AMOUNT', 230, y + 7, { align: 'right' });

        // Deductions Column Header
        doc.rect(305, y, 250, 24).fill('#6B6B6B');
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('DEDUCTIONS', 315, y + 7);
        doc.text('AMOUNT', 495, y + 7, { align: 'right' });

        y += 24;
        const e = payslip.earnings || {};
        const d = payslip.deductions || {};
        const curr = payslip.currency || 'USD';

        const earningsRows = [
          ['Basic Salary', e.basic],
          ['House Rent Allowance (HRA)', e.hra],
          ['Special Allowance', e.specialAllowance],
          ['Conveyance Allowance', e.conveyance],
          ['Medical Allowance', e.medicalAllowance],
          ['Performance Bonus', e.performanceBonus],
        ].filter(([, val]) => val !== undefined && val > 0);

        const deductionsRows = [
          ['Provident Fund (Employee PF)', d.providentFund],
          ['Professional Tax (PT)', d.professionalTax],
          ['Tax Deducted at Source (TDS)', d.incomeTaxTds],
          ['Employee State Insurance (ESI)', d.esi],
          ['Other Deductions', d.otherDeductions],
        ].filter(([, val]) => val !== undefined && val > 0);

        const maxRows = Math.max(earningsRows.length, deductionsRows.length, 5);

        for (let i = 0; i < maxRows; i++) {
          const rowY = y + i * 22;
          // Row background
          if (i % 2 === 1) {
            doc.rect(40, rowY, 250, 22).fill('#fafafa');
            doc.rect(305, rowY, 250, 22).fill('#fafafa');
          }

          // Earnings
          if (earningsRows[i]) {
            doc.fillColor(darkText).fontSize(8.5).font('Helvetica').text(earningsRows[i][0], 50, rowY + 6);
            doc.font('Helvetica-Bold').text(`${curr} ${Number(earningsRows[i][1]).toLocaleString()}`, 230, rowY + 6, { align: 'right' });
          }

          // Deductions
          if (deductionsRows[i]) {
            doc.fillColor(darkText).fontSize(8.5).font('Helvetica').text(deductionsRows[i][0], 315, rowY + 6);
            doc.font('Helvetica-Bold').text(`${curr} ${Number(deductionsRows[i][1]).toLocaleString()}`, 495, rowY + 6, { align: 'right' });
          }
        }

        y += maxRows * 22;

        // Gross / Deductions sub-totals
        doc.rect(40, y, 250, 24).fill(warmBg).stroke(borderColor);
        doc.rect(305, y, 250, 24).fill(warmBg).stroke(borderColor);

        doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold').text('GROSS EARNINGS', 50, y + 7);
        doc.text(`${curr} ${Number(e.grossEarnings || 0).toLocaleString()}`, 230, y + 7, { align: 'right' });

        doc.text('TOTAL DEDUCTIONS', 315, y + 7);
        doc.text(`${curr} ${Number(d.totalDeductions || 0).toLocaleString()}`, 495, y + 7, { align: 'right' });

        // ── Net Pay Callout Banner ──
        y += 45;
        doc.rect(40, y, 515, 55).fill('#fff7ed');
        doc.rect(40, y, 515, 55).stroke('#fed7aa');

        doc.fillColor(mutedText).fontSize(9).font('Helvetica').text('NET TAKE-HOME PAYABLE:', 55, y + 14);
        doc.fillColor(brandOrange).fontSize(18).font('Helvetica-Bold').text(`${curr} ${Number(payslip.netPay || 0).toLocaleString()}`, 55, y + 28);

        doc.fillColor(mutedText).fontSize(8).font('Helvetica').text(
          `Payment Status: ${(payslip.paymentStatus || 'unpaid').toUpperCase()} ${payslip.paymentDate ? `· Paid on ${new Date(payslip.paymentDate).toLocaleDateString()}` : ''}`,
          330,
          y + 24,
          { align: 'right' }
        );

        // ── Footer Disclaimer ──
        doc.fillColor('#9B9B9B').fontSize(7.5).font('Helvetica').text(
          'This is a computer-generated payroll advice document issued by Nebula HUB. No physical signature is required.',
          40,
          740,
          { align: 'center', width: 515 }
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = new PayrollService();
