const Candidate = require('../models/Candidate');

/**
 * Intelligent duplicate candidate detection service
 * Identifies duplicate persons across email, phone, and name to prevent splintered records.
 */
class DuplicateDetectionService {
  /**
   * Checks if candidate already exists in tenant organization
   * @param {string|ObjectId} organizationId
   * @param {Object} candidateData
   * @param {string} candidateData.email
   * @param {string} [candidateData.phone]
   * @param {string} [candidateData.fullName]
   * @returns {Promise<{ isDuplicate: boolean, existingCandidate: any|null, matchReason: string|null }>}
   */
  async findDuplicate(organizationId, { email, phone, fullName }) {
    if (!organizationId) {
      return { isDuplicate: false, existingCandidate: null, matchReason: null };
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';

    // 1. Exact Email Match (Primary Key for Person)
    if (cleanEmail) {
      const matchByEmail = await Candidate.findOne({
        organizationId,
        email: cleanEmail,
      });

      if (matchByEmail) {
        return {
          isDuplicate: true,
          existingCandidate: matchByEmail,
          matchReason: `Exact email match (${cleanEmail})`,
        };
      }
    }

    if (cleanPhone && cleanPhone.length >= 7) {
      const phoneDigits = cleanPhone.slice(-7).split('').join('\\D*');
      const matchByPhone = await Candidate.findOne({
        organizationId,
        phone: { $regex: new RegExp(phoneDigits) },
      });

      if (matchByPhone) {
        return {
          isDuplicate: true,
          existingCandidate: matchByPhone,
          matchReason: `Phone number match (${phone})`,
        };
      }
    }

    // 3. Normalized Name + Company Match
    if (fullName) {
      const trimmedName = String(fullName).trim();
      const matchByName = await Candidate.findOne({
        organizationId,
        fullName: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      });

      if (matchByName && (cleanEmail || cleanPhone)) {
        return {
          isDuplicate: true,
          existingCandidate: matchByName,
          matchReason: `Candidate name match (${trimmedName})`,
        };
      }
    }

    return {
      isDuplicate: false,
      existingCandidate: null,
      matchReason: null,
    };
  }
}

module.exports = new DuplicateDetectionService();
