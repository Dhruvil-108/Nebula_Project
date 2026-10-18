class ExportService {
  /**
   * Escape and format CSV cell
   */
  escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * Generates CSV for candidates pipeline report
   */
  generatePipelineCsv(candidates = []) {
    const headers = [
      'Candidate Code',
      'Full Name',
      'Email',
      'Phone',
      'Target Job',
      'Stage',
      'Rating',
      'Source',
      'Created Date',
    ];

    const rows = candidates.map((c) => {
      const jobTitle =
        typeof c.jobOpeningId === 'object' && c.jobOpeningId ? c.jobOpeningId.title : 'Unassigned';
      return [
        this.escapeCsv(c.candidateCode),
        this.escapeCsv(c.fullName),
        this.escapeCsv(c.email),
        this.escapeCsv(c.phone || ''),
        this.escapeCsv(jobTitle),
        this.escapeCsv(c.stage || 'applied'),
        this.escapeCsv(c.rating || 0),
        this.escapeCsv(c.source || 'direct'),
        this.escapeCsv(new Date(c.createdAt).toLocaleDateString()),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }

  /**
   * Generates CSV for offers report
   */
  generateOffersCsv(offers = []) {
    const headers = [
      'Offer Code',
      'Candidate Name',
      'Designation',
      'Department',
      'Total CTC',
      'Currency',
      'Status',
      'Joining Date',
      'E-Signed Date',
    ];

    const rows = offers.map((o) => {
      const candName =
        typeof o.candidateId === 'object' && o.candidateId ? o.candidateId.fullName : 'Candidate';
      const deptName =
        typeof o.departmentId === 'object' && o.departmentId ? o.departmentId.name : 'General';
      const signedAt = o.eSignature?.signedAt
        ? new Date(o.eSignature.signedAt).toLocaleDateString()
        : 'Pending';

      return [
        this.escapeCsv(o.offerCode),
        this.escapeCsv(candName),
        this.escapeCsv(o.designation),
        this.escapeCsv(deptName),
        this.escapeCsv(o.offeredSalary || o.compensationBreakdown?.totalCtc || 0),
        this.escapeCsv(o.currency || 'USD'),
        this.escapeCsv(o.status),
        this.escapeCsv(new Date(o.joiningDate).toLocaleDateString()),
        this.escapeCsv(signedAt),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }
}

module.exports = new ExportService();
