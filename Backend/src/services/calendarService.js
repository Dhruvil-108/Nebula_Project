/**
 * Calendar Service — RFC 5545 iCalendar (.ics) Generator
 * Generates standards-compliant iCalendar files for multi-interviewer schedules.
 */

class CalendarService {
  /**
   * Formats a JS Date to UTC format required by iCalendar: YYYYMMDDTHHMMSSZ
   * @param {Date|string} date
   * @returns {string}
   */
  formatIcsDate(date) {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /**
   * Escapes text according to RFC 5545 specifications
   * @param {string} str
   * @returns {string}
   */
  escapeText(str) {
    if (!str) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r\n|\r|\n/g, '\\n');
  }

  /**
   * Generates RFC 5545 .ics string from an interview record
   * @param {Object} interview - Populated interview document
   * @param {Object} [options]
   * @returns {string}
   */
  generateIcs(interview, options = {}) {
    const candidateName = interview.candidateId?.fullName || 'Candidate';
    const candidateEmail = interview.candidateId?.email || '';
    const jobTitle = interview.jobOpeningId?.title || 'Open Position';
    const title = interview.title || `Interview: ${candidateName} - ${jobTitle}`;
    
    const uid = interview.icsUid || `nebula-interview-${interview._id}@nebula.local`;
    const dtStamp = this.formatIcsDate(new Date());
    const dtStart = this.formatIcsDate(interview.scheduledStart);
    const dtEnd = this.formatIcsDate(interview.scheduledEnd);

    const location = interview.meetingLink || interview.location || 'Virtual Video Room';
    
    // Panel interviewers
    const interviewers = Array.isArray(interview.interviewers) ? interview.interviewers : [];
    const interviewerNames = interviewers
      .map((u) => {
        if (!u || typeof u !== 'object') return '';
        return u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Interviewer';
      })
      .filter(Boolean)
      .join(', ');

    const description = [
      `Nebula Recruitment Interview Session`,
      `Position: ${jobTitle}`,
      `Candidate: ${candidateName}`,
      interview.meetingLink ? `Meeting Link: ${interview.meetingLink}` : '',
      interview.meetingPassword ? `Passcode: ${interview.meetingPassword}` : '',
      interviewerNames ? `Interview Panel: ${interviewerNames}` : '',
      interview.timezone ? `Timezone: ${interview.timezone}` : '',
      `Status: ${interview.status.toUpperCase()}`,
    ]
      .filter(Boolean)
      .join('\n');

    let icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nebula ERP//Recruitment ATS//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${this.escapeText(title)}`,
      `DESCRIPTION:${this.escapeText(description)}`,
      `LOCATION:${this.escapeText(location)}`,
      `STATUS:${interview.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
      'SEQUENCE:0',
    ];

    if (options.organizerEmail || options.organizerName) {
      const orgName = options.organizerName || 'Nebula Hiring Team';
      const orgEmail = options.organizerEmail || 'recruitment@nebula.local';
      icsLines.push(`ORGANIZER;CN=${this.escapeText(orgName)}:mailto:${orgEmail}`);
    }

    if (candidateEmail) {
      icsLines.push(`ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${this.escapeText(candidateName)}:mailto:${candidateEmail}`);
    }

    interviewers.forEach((inv) => {
      if (typeof inv === 'object' && inv !== null && inv.email) {
        const invName = inv.fullName || `${inv.firstName || ''} ${inv.lastName || ''}`.trim() || 'Interviewer';
        icsLines.push(`ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${this.escapeText(invName)}:mailto:${inv.email}`);
      }
    });

    icsLines.push('END:VEVENT');
    icsLines.push('END:VCALENDAR');

    return icsLines.join('\r\n');
  }
}

module.exports = new CalendarService();
