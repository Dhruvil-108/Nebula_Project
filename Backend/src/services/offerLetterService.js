/**
 * Offer Letter Service
 * Generates formatted, company-branded HTML offer letters with detailed compensation breakdown tables.
 */

class OfferLetterService {
  /**
   * Generates formatted HTML offer letter document
   * @param {Object} arg1 - Populated JobOffer document or options object { offer, organization, candidate }
   * @param {Object} [arg2] - Organization document
   * @returns {string} HTML string
   */
  generateOfferLetterHtml(arg1, arg2 = {}) {
    let offer = arg1;
    let organization = arg2;

    if (arg1 && arg1.offer) {
      offer = arg1.offer;
      organization = arg1.organization || arg2;
      if (arg1.candidate && !offer.candidateId) {
        offer.candidateId = arg1.candidate;
      }
    }

    const orgName = organization?.name || 'Nebula Enterprise Hub';
    const orgAddress = organization?.address || 'Global Headquarters';
    const candidateName =
      (typeof offer.candidateId === 'object' && offer.candidateId?.fullName) ||
      offer.candidateName ||
      'Valued Candidate';
    const candidateEmail =
      (typeof offer.candidateId === 'object' && offer.candidateId?.email) ||
      offer.candidateEmail ||
      '';
    const designation = offer.designation || 'Specialist';
    const departmentName =
      (typeof offer.departmentId === 'object' && offer.departmentId?.name) ||
      offer.departmentName ||
      'Operations';
    const currency = offer.currency || 'USD';

    const joiningDate = offer.joiningDate
      ? new Date(offer.joiningDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'To be confirmed';

    const validUntil = offer.validUntil
      ? new Date(offer.validUntil).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Within 7 business days';

    const cb = offer.compensationBreakdown || {};
    const baseSalary = cb.baseSalary || offer.offeredSalary || 0;
    const variableBonus = cb.variablePay ?? cb.variableBonus ?? 0;
    const signOnBonus = cb.signOnBonus || 0;
    const relocationAllowance = cb.relocation ?? cb.relocationAllowance ?? 0;
    const equityValue = cb.equityValue ?? cb.equity?.estimatedValue ?? 0;
    const allowances =
      typeof cb.allowances === 'number'
        ? cb.allowances
        : Array.isArray(cb.otherAllowances)
        ? cb.otherAllowances.reduce((acc, item) => acc + (Number(item?.amount) || 0), 0)
        : 0;

    const totalCtc =
      cb.totalCtc ||
      baseSalary + variableBonus + signOnBonus + relocationAllowance + equityValue + allowances;

    const fmtMoney = (amount) =>
      `${currency} ${Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;

    const isSigned =
      offer.status === 'accepted' || Boolean(offer.eSignature?.signedAt);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Formal Employment Offer - ${offer.offerCode}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #FBF8F4;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #ECE0D6;
      border-radius: 16px;
      padding: 48px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #F3EDE4;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #EA580C;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .meta {
      text-align: right;
      font-size: 12px;
      color: #6B7280;
    }
    .meta strong {
      color: #111827;
    }
    .salutation {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #111827;
    }
    .intro {
      font-size: 14px;
      line-height: 1.6;
      color: #374151;
      margin-bottom: 24px;
    }
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      margin: 28px 0;
      border: 1px solid #ECE0D6;
      border-radius: 12px;
      overflow: hidden;
    }
    .comp-table th {
      background: #FBF8F4;
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6B7280;
      border-bottom: 1px solid #ECE0D6;
    }
    .comp-table td {
      padding: 12px 16px;
      font-size: 13px;
      border-bottom: 1px solid #F3EDE4;
      color: #1F2937;
    }
    .comp-table tr.total-row td {
      background: #FFF7ED;
      font-weight: 800;
      font-size: 15px;
      color: #EA580C;
      border-top: 2px solid #FDBA74;
      border-bottom: none;
    }
    .terms-box {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 20px;
      margin: 28px 0;
    }
    .terms-box h4 {
      margin: 0 0 12px 0;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #4B5563;
    }
    .terms-box ul {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      color: #4B5563;
      line-height: 1.6;
    }
    .signature-section {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 2px dashed #ECE0D6;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .sig-block {
      width: 45%;
    }
    .sig-label {
      font-size: 12px;
      font-weight: 700;
      color: #6B7280;
      margin-bottom: 8px;
    }
    .sig-seal {
      padding: 16px;
      border: 1px solid #10B981;
      background: #ECFDF5;
      border-radius: 8px;
      font-size: 11px;
      color: #065F46;
    }
    .sig-seal strong {
      display: block;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .sig-pending {
      padding: 16px;
      border: 1px dashed #D1D5DB;
      border-radius: 8px;
      font-size: 11px;
      color: #9CA3AF;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="brand-title">${orgName}</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #6B7280;">${orgAddress}</p>
      </div>
      <div class="meta">
        <p style="margin: 0;">Ref: <strong>${offer.offerCode}</strong></p>
        <p style="margin: 4px 0 0 0;">Offer Date: <strong>${new Date().toLocaleDateString('en-US')}</strong></p>
        <p style="margin: 4px 0 0 0;">Valid Until: <strong>${validUntil}</strong></p>
      </div>
    </div>

    <div class="salutation">Dear ${candidateName},</div>

    <div class="intro">
      On behalf of <strong>${orgName}</strong>, we are thrilled to extend this formal offer of employment for the position of 
      <strong>${designation}</strong> within our <strong>${departmentName}</strong> team. We were deeply impressed by your experience, 
      technical problem solving, and values alignment during our interview conversations.
    </div>

    <div class="intro">
      Your official scheduled commencement date will be <strong>${joiningDate}</strong>. Below is the comprehensive breakdown of your 
      annual compensation package and standard employment terms:
    </div>

    <table class="comp-table">
      <thead>
        <tr>
          <th>Compensation Component</th>
          <th>Annual / Allotted Structure</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Base Fixed Salary</strong></td>
          <td>${fmtMoney(baseSalary)}</td>
        </tr>
        ${
          variableBonus > 0
            ? `
        <tr>
          <td><strong>Performance Variable Bonus (Target)</strong></td>
          <td>${fmtMoney(variableBonus)}</td>
        </tr>`
            : ''
        }
        ${
          signOnBonus > 0
            ? `
        <tr>
          <td><strong>Sign-on Joining Bonus</strong></td>
          <td>${fmtMoney(signOnBonus)}</td>
        </tr>`
            : ''
        }
        ${
          relocationAllowance > 0
            ? `
        <tr>
          <td><strong>Relocation Assistance Allowance</strong></td>
          <td>${fmtMoney(relocationAllowance)}</td>
        </tr>`
            : ''
        }
        ${
          equityValue > 0 || cb.equity?.shares > 0
            ? `
        <tr>
          <td><strong>Equity Grant / Stock Options</strong></td>
          <td>${cb.equity?.shares > 0 ? `${cb.equity.shares.toLocaleString()} Shares ` : ''}${
                equityValue > 0 ? `(${fmtMoney(equityValue)})` : ''
              }${cb.equity?.vestingSchedule ? ` · ${cb.equity.vestingSchedule}` : ''}</td>
        </tr>`
            : ''
        }
        ${
          allowances > 0
            ? `
        <tr>
          <td><strong>Allowances (HRA / Remote / Transport)</strong></td>
          <td>${fmtMoney(allowances)}</td>
        </tr>`
            : ''
        }
        ${
          Array.isArray(cb.otherAllowances)
            ? cb.otherAllowances
                .map(
                  (a) => `
        <tr>
          <td><strong>${a.name}</strong></td>
          <td>${fmtMoney(a.amount)}</td>
        </tr>`
                )
                .join('')
            : ''
        }
        <tr class="total-row">
          <td>Total Cost to Company (Annual CTC)</td>
          <td>${fmtMoney(totalCtc)}</td>
        </tr>
      </tbody>
    </table>

    <div class="terms-box">
      <h4>Summary of Benefits & Governance Terms</h4>
      <ul>
        ${
          Array.isArray(offer.benefits) && offer.benefits.length > 0
            ? offer.benefits.map((b) => `<li>${b}</li>`).join('')
            : `
          <li>Comprehensive Medical, Dental & Life Insurance coverage.</li>
          <li>Flexible remote / hybrid work allowance and hardware provision.</li>
          <li>Annual learning & professional development stipend.</li>
          <li>Standard 25 days paid annual leave plus statutory holidays.</li>
          `
        }
        <li>This offer is contingent upon successful verification of references and standard background checks.</li>
      </ul>
    </div>

    <div class="signature-section">
      <div class="sig-block">
        <div class="sig-label">AUTHORIZED BY ORGANIZATION</div>
        <div style="font-size: 14px; font-weight: 700; color: #111827;">${orgName} Talent Acquisition</div>
        <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">Executive Hiring Committee</div>
      </div>

      <div class="sig-block">
        <div class="sig-label">CANDIDATE ACCEPTANCE</div>
        ${
          isSigned
            ? `
        <div class="sig-seal">
          <strong>✓ DIGITALLY SIGNED &amp; EXECUTED</strong>
          <span>Signed by: ${offer.eSignature?.signerName || candidateName}</span><br>
          <span>Date: ${
            offer.eSignature?.signedAt
              ? new Date(offer.eSignature.signedAt).toUTCString()
              : new Date().toUTCString()
          }</span><br>
          <span>IP Audit: ${offer.eSignature?.signedIp || 'Verified Web Portal'}</span>
        </div>`
            : `
        <div class="sig-pending">
          PENDING DIGITAL SIGNATURE<br>
          <span style="font-size: 10px;">To be executed electronically via secure candidate portal</span>
        </div>`
        }
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

module.exports = new OfferLetterService();
