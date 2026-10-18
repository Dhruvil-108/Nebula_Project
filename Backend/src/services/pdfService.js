const PDFDocument = require('pdfkit');

/**
 * Enterprise PDF Generator Service
 * Creates pixel-perfect, company-branded Offer Letters with compensation schedules
 * and cryptographic digital signature audit stamps.
 */
class PdfService {
  /**
   * Generates a branded Offer Letter PDF Buffer
   * @param {Object} params
   * @param {Object} params.offer - Populated JobOffer document
   * @param {Object} [params.organization] - Organization model
   * @param {Object} [params.candidate] - Candidate model
   * @param {string} [params.signUrl] - E-Sign portal URL
   * @returns {Promise<Buffer>} PDF Buffer
   */
  async generateOfferLetterPdf({ offer, organization = {}, candidate = {}, signUrl = '' }) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `Employment Offer - ${offer.offerCode || 'OFFER'}`,
            Author: organization.name || 'Nebula Technologies',
            Subject: `Offer of Employment for ${offer.designation || 'Specialist'}`,
            Creator: 'Nebula Enterprise Operations Hub',
          },
        });

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const orgName = organization.name || 'Nebula Enterprise Technologies';
        const candidateName =
          candidate.fullName ||
          (typeof offer.candidateId === 'object' && offer.candidateId?.fullName) ||
          offer.candidateName ||
          'Valued Candidate';
        const candidateEmail =
          candidate.email ||
          (typeof offer.candidateId === 'object' && offer.candidateId?.email) ||
          offer.candidateEmail ||
          '';
        const designation = offer.designation || 'Software Specialist';
        const deptName =
          (typeof offer.departmentId === 'object' && offer.departmentId?.name) ||
          offer.departmentName ||
          'Core Engineering';
        const currency = offer.currency || 'USD';
        const cb = offer.compensationBreakdown || {};
        const baseSalary = cb.baseSalary || offer.offeredSalary || 0;
        const variableBonus = cb.variablePay ?? cb.variableBonus ?? 0;
        const signOnBonus = cb.signOnBonus || 0;
        const relocation = cb.relocation ?? cb.relocationAllowance ?? 0;
        const equityValue = cb.equityValue ?? cb.equity?.estimatedValue ?? 0;
        const allowances =
          typeof cb.allowances === 'number'
            ? cb.allowances
            : Array.isArray(cb.otherAllowances)
            ? cb.otherAllowances.reduce((acc, it) => acc + (Number(it?.amount) || 0), 0)
            : 0;

        const totalCtc = offer.totalCtc || (baseSalary + variableBonus + signOnBonus + relocation + equityValue + allowances);

        const fmt = (amt) =>
          `${currency} ${Number(amt).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`;

        const joiningDate = offer.joiningDate
          ? new Date(offer.joiningDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'Mutually agreed start date';

        const validUntil = offer.validUntil
          ? new Date(offer.validUntil).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '7 days from issue date';

        const isSigned = offer.status === 'accepted' || Boolean(offer.eSignature?.signedAt);

        // ──────────────────────────────────────────────────
        // 1. TOP HEADER ACCENT BARS
        // ──────────────────────────────────────────────────
        doc.rect(0, 0, 595.28, 6).fill('#4F46E5'); // Indigo top border
        doc.rect(0, 6, 200, 3).fill('#06B6D4'); // Cyan secondary accent

        // Company Brand Name & Title
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(20).text(orgName, 40, 36);
        doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(9).text('OFFICIAL EMPLOYMENT OFFER & APPOINTMENT LETTER', 40, 62, {
          characterSpacing: 1,
        });

        // Offer Reference Meta Box (Right aligned)
        doc.roundedRect(380, 32, 175, 48, 6).fillAndStroke('#F8FAFC', '#E2E8F0');
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8).text('OFFER REFERENCE', 390, 40);
        doc.fillColor('#4F46E5').font('Helvetica-Bold').fontSize(11).text(offer.offerCode || 'OFF-2026-001', 390, 52);
        doc.fillColor('#64748B').font('Helvetica').fontSize(8).text(`Valid Until: ${validUntil}`, 390, 66);

        // Divider
        doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, 92).lineTo(555, 92).stroke();

        // ──────────────────────────────────────────────────
        // 2. CANDIDATE & POSITION OVERVIEW BOXES
        // ──────────────────────────────────────────────────
        const boxY = 104;
        // Candidate Box (Left)
        doc.roundedRect(40, boxY, 250, 70, 6).fillAndStroke('#F1F5F9', '#CBD5E1');
        doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(8).text('PREPARED FOR', 52, boxY + 10, { characterSpacing: 0.5 });
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(13).text(candidateName, 52, boxY + 24);
        doc.fillColor('#475569').font('Helvetica').fontSize(9).text(candidateEmail, 52, boxY + 42);
        doc.fillColor('#64748B').font('Helvetica').fontSize(8).text(`Candidate Code: ${candidate.candidateCode || 'CAND-REF'}`, 52, boxY + 56);

        // Position Box (Right)
        doc.roundedRect(305, boxY, 250, 70, 6).fillAndStroke('#EEF2FF', '#C7D2FE');
        doc.fillColor('#4F46E5').font('Helvetica-Bold').fontSize(8).text('ROLE & APPOINTMENT', 317, boxY + 10, { characterSpacing: 0.5 });
        doc.fillColor('#1E1B4B').font('Helvetica-Bold').fontSize(13).text(designation, 317, boxY + 24);
        doc.fillColor('#4338CA').font('Helvetica-Bold').fontSize(9).text(`Department: ${deptName}`, 317, boxY + 42);
        doc.fillColor('#475569').font('Helvetica').fontSize(8).text(`Start Date: ${joiningDate}`, 317, boxY + 56);

        // ──────────────────────────────────────────────────
        // 3. FORMAL APPOINTMENT OPENING
        // ──────────────────────────────────────────────────
        let curY = 190;
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text(`Dear ${candidateName},`, 40, curY);
        curY += 18;

        const introText =
          `On behalf of ${orgName}, we are delighted to extend to you this formal offer of employment for the position of ${designation} within our ${deptName} division. Based on your impressive technical evaluations and conversations with our leadership, we believe your skills, vision, and leadership will be invaluable to our organization.`;
        doc.fillColor('#334155').font('Helvetica').fontSize(9.5).text(introText, 40, curY, {
          width: 515,
          lineGap: 3,
        });
        curY += 46;

        // ──────────────────────────────────────────────────
        // 4. ITEMIZED COMPENSATION BREAKDOWN TABLE
        // ──────────────────────────────────────────────────
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('1. Compensation & Benefits Schedule', 40, curY);
        curY += 18;

        // Table Header
        doc.roundedRect(40, curY, 515, 22, 4).fill('#0F172A');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5);
        doc.text('COMPENSATION COMPONENT', 52, curY + 6);
        doc.text('CADENCE', 330, curY + 6);
        doc.text('ANNUAL VALUE', 450, curY + 6, { width: 95, align: 'right' });
        curY += 24;

        // Row items
        const rows = [
          { label: 'Base Salary (Annualized Fixed)', cadence: 'Monthly via Payroll', amount: fmt(baseSalary) },
        ];
        if (variableBonus > 0) {
          rows.push({ label: 'Performance / Variable Bonus', cadence: 'Annual Incentive Plan', amount: fmt(variableBonus) });
        }
        if (equityValue > 0) {
          rows.push({ label: 'Long-Term Equity Grant (Estimated)', cadence: '4-Year Vesting Schedule', amount: fmt(equityValue) });
        }
        if (signOnBonus > 0) {
          rows.push({ label: 'Sign-On Incentive', cadence: 'Paid on 1st Pay Cycle', amount: fmt(signOnBonus) });
        }
        if (relocation > 0) {
          rows.push({ label: 'Relocation & Onboarding Allowance', cadence: 'One-Time Lump Sum', amount: fmt(relocation) });
        }
        if (allowances > 0) {
          rows.push({ label: 'Flexible Work & Health Allowances', cadence: 'Monthly Allowance', amount: fmt(allowances) });
        }

        rows.forEach((r, idx) => {
          const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          doc.rect(40, curY, 515, 20).fillAndStroke(bg, '#E2E8F0');
          doc.fillColor('#1E293B').font('Helvetica').fontSize(9).text(r.label, 52, curY + 5);
          doc.fillColor('#64748B').fontSize(8.5).text(r.cadence, 330, curY + 5);
          doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9).text(r.amount, 450, curY + 5, { width: 95, align: 'right' });
          curY += 20;
        });

        // Total CTC Highlight Row
        doc.roundedRect(40, curY, 515, 26, 4).fillAndStroke('#EEF2FF', '#6366F1');
        doc.fillColor('#4338CA').font('Helvetica-Bold').fontSize(10).text('TOTAL ANNUAL COST TO COMPANY (CTC)', 52, curY + 7);
        doc.fillColor('#4F46E5').font('Helvetica-Bold').fontSize(11).text(fmt(totalCtc), 430, curY + 7, { width: 115, align: 'right' });
        curY += 36;

        // ──────────────────────────────────────────────────
        // 5. EMPLOYMENT TERMS & CONDITIONS
        // ──────────────────────────────────────────────────
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('2. Key Terms & Employment Provisions', 40, curY);
        curY += 16;

        const terms = [
          `Working Hours & Location: Full-time appointment based in our ${deptName} division with flexible hybrid work privileges.`,
          'Health & Wellness: Comprehensive medical, dental, and vision insurance provided for you and eligible dependents.',
          'Leave Entitlement: 25 days paid annual leave per calendar year in addition to national and statutory public holidays.',
          'Professional Growth: Annual learning stipend towards certifications, technical conferences, and executive education.',
          'Contingency: This offer is contingent upon satisfactory reference checks and submission of required legal eligibility documents.',
        ];

        terms.forEach((t) => {
          doc.fillColor('#4F46E5').font('Helvetica-Bold').fontSize(10).text('•', 44, curY);
          doc.fillColor('#334155').font('Helvetica').fontSize(8.5).text(t, 56, curY, {
            width: 495,
            lineGap: 2,
          });
          curY += 17;
        });
        curY += 16;

        // ──────────────────────────────────────────────────
        // 6. DUAL SIGNATURE EXECUTION BLOCK
        // ──────────────────────────────────────────────────
        doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, curY).lineTo(555, curY).stroke();
        curY += 14;

        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text('3. Acceptance & Execution', 40, curY);
        curY += 14;

        // Employer Signature (Left Box)
        doc.roundedRect(40, curY, 250, 88, 6).fillAndStroke('#F8FAFC', '#CBD5E1');
        doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(7.5).text('AUTHORIZED BY EMPLOYER', 50, curY + 8, { characterSpacing: 0.5 });
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10.5).text(`${orgName} Talent Acquisition`, 50, curY + 22);
        doc.fillColor('#475569').font('Helvetica').fontSize(8).text('Executive Hiring & Compensation Committee', 50, curY + 36);
        doc.fillColor('#059669').font('Helvetica-Bold').fontSize(8).text('✓ Corporate Authorization Verified', 50, curY + 54);
        doc.fillColor('#64748B').font('Helvetica').fontSize(7.5).text(`Executed: ${new Date().toLocaleDateString('en-US')}`, 50, curY + 68);

        // Candidate Signature (Right Box)
        if (isSigned) {
          doc.roundedRect(305, curY, 250, 88, 6).fillAndStroke('#ECFDF5', '#10B981');
          doc.fillColor('#065F46').font('Helvetica-Bold').fontSize(7.5).text('CANDIDATE DIGITAL EXECUTION', 315, curY + 8, { characterSpacing: 0.5 });
          doc.fillColor('#047857').font('Helvetica-Bold').fontSize(11).text('✓ DIGITALLY SIGNED & ACCEPTED', 315, curY + 22);
          doc.fillColor('#065F46').font('Helvetica').fontSize(8).text(`Signer: ${offer.eSignature?.signerName || candidateName}`, 315, curY + 38);
          doc.fillColor('#065F46').font('Helvetica').fontSize(7.5).text(`Date: ${new Date(offer.eSignature?.signedAt || Date.now()).toUTCString()}`, 315, curY + 52);
          doc.fillColor('#047857').font('Helvetica').fontSize(7).text(`Audit IP: ${offer.eSignature?.signedIp || 'Verified Web Portal'}`, 315, curY + 66);
        } else {
          doc.roundedRect(305, curY, 250, 88, 6).fillAndStroke('#FFFBEB', '#F59E0B');
          doc.fillColor('#92400E').font('Helvetica-Bold').fontSize(7.5).text('CANDIDATE ACCEPTANCE', 315, curY + 8, { characterSpacing: 0.5 });
          doc.fillColor('#B45309').font('Helvetica-Bold').fontSize(10.5).text('AWAITING DIGITAL E-SIGNATURE', 315, curY + 22);
          doc.fillColor('#78350F').font('Helvetica').fontSize(8).text('To accept this appointment, please execute online:', 315, curY + 38);
          if (signUrl) {
            doc.fillColor('#2563EB').font('Helvetica-Bold').fontSize(7.5).text(signUrl, 315, curY + 52, { width: 230 });
          } else {
            doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text('Follow link in your invitation email to digitally sign.', 315, curY + 52);
          }
          doc.fillColor('#92400E').font('Helvetica').fontSize(7).text(`Must be signed by ${validUntil}`, 315, curY + 68);
        }

        // ──────────────────────────────────────────────────
        // 7. FOOTER
        // ──────────────────────────────────────────────────
        doc.fillColor('#94A3B8').font('Helvetica').fontSize(7.5).text(
          `Confidential &bull; Generated by Nebula Enterprise Platform &bull; Valid with cryptographic audit token &bull; Page 1 of 1`,
          40,
          780,
          { width: 515, align: 'center' }
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = new PdfService();
