const Counter = require('../models/Counter');

/**
 * Atomic sequence generator service
 * Prevents race conditions and duplicate codes under concurrent document creation.
 */
class CounterService {
  /**
   * Atomically increments and returns the next integer sequence for a tenant entity
   * @param {string|mongoose.Types.ObjectId} organizationId
   * @param {string} entityType - e.g. 'job_opening', 'candidate', 'job_offer', 'employee'
   * @returns {Promise<number>}
   */
  async getNextSequence(organizationId, entityType) {
    if (!organizationId || !entityType) {
      throw new Error('organizationId and entityType are required for counter sequence generation.');
    }

    const counter = await Counter.findOneAndUpdate(
      { organizationId, entityType: String(entityType).toLowerCase() },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return counter.seq;
  }

  /**
   * Formats a sequential code with prefix and zero-padding
   * @param {string|mongoose.Types.ObjectId} organizationId
   * @param {string} entityType - e.g. 'candidate'
   * @param {string} prefix - e.g. 'CAND-2026-'
   * @param {number} padLength - e.g. 4 -> '0001'
   * @returns {Promise<string>} e.g. 'CAND-2026-0001'
   */
  async generateFormattedCode(organizationId, entityType, prefix, padLength = 4) {
    const seq = await this.getNextSequence(organizationId, entityType);
    return `${prefix}${String(seq).padStart(padLength, '0')}`;
  }

  /**
   * Updates the counter only if the target value is higher than current sequence.
   * Useful for backfill scripts and migrations.
   */
  async setCounterIfHigher(organizationId, entityType, highestVal) {
    if (!organizationId || !entityType || typeof highestVal !== 'number') return;
    const normalizedType = String(entityType).toLowerCase();

    const existing = await Counter.findOne({ organizationId, entityType: normalizedType });
    if (!existing) {
      await Counter.create({
        organizationId,
        entityType: normalizedType,
        seq: highestVal,
      });
    } else if (highestVal > existing.seq) {
      existing.seq = highestVal;
      await existing.save();
    }
  }

  /**
   * Helpers for Recruitment Module Entities
   */
  async generateJobCode(organizationId) {
    const year = new Date().getFullYear();
    const entityType = `job_opening_${year}`;
    return this.generateFormattedCode(organizationId, entityType, `JOB-${year}-`, 3);
  }

  async generateCandidateCode(organizationId) {
    const year = new Date().getFullYear();
    const entityType = `candidate_${year}`;
    return this.generateFormattedCode(organizationId, entityType, `CAND-${year}-`, 4);
  }

  async generateApplicationCode(organizationId) {
    const year = new Date().getFullYear();
    const entityType = `application_${year}`;
    return this.generateFormattedCode(organizationId, entityType, `APP-${year}-`, 4);
  }

  async generateRequisitionCode(organizationId) {
    const year = new Date().getFullYear();
    const entityType = `requisition_${year}`;
    return this.generateFormattedCode(organizationId, entityType, `REQ-${year}-`, 4);
  }

  async generateOfferCode(organizationId) {
    const year = new Date().getFullYear();
    const entityType = `job_offer_${year}`;
    return this.generateFormattedCode(organizationId, entityType, `OFF-${year}-`, 3);
  }

  async generateEmployeeCode(organizationId) {
    return this.generateFormattedCode(organizationId, 'employee', 'EMP-', 4);
  }
}

module.exports = new CounterService();
