const EventEmitter = require('events');

/**
 * Resilient Job Queue Service
 * Supports async task execution with retries, exponential backoff, idempotency keys, and a dead-letter store.
 */
class QueueService extends EventEmitter {
  constructor() {
    super();
    this.workers = new Map();
    this.completedJobs = new Map(); // idempotencyKey -> result
    this.deadLetterQueue = [];
    this.jobHistory = [];
  }

  /**
   * Registers a worker handler for a specific job name
   */
  registerWorker(jobName, handlerFn) {
    if (typeof handlerFn !== 'function') {
      throw new Error(`Worker handler for "${jobName}" must be a function.`);
    }
    this.workers.set(jobName, handlerFn);
    console.log(`[QueueService] Registered worker for "${jobName}"`);
  }

  /**
   * Enqueues an asynchronous job
   * @param {string} jobName - e.g. 'parse_resume', 'send_notification', 'webhook_dispatch'
   * @param {Object} payload - job payload
   * @param {Object} [options]
   * @param {string} [options.idempotencyKey] - Prevents duplicate execution
   * @param {number} [options.maxRetries=3]
   * @param {number} [options.delayMs=0]
   */
  async addJob(jobName, payload, options = {}) {
    const { idempotencyKey, maxRetries = 3, delayMs = 0 } = options;

    if (idempotencyKey && this.completedJobs.has(idempotencyKey)) {
      console.log(`[QueueService] Job "${jobName}" with key "${idempotencyKey}" already processed. Skipping duplicate.`);
      return { status: 'skipped_duplicate', result: this.completedJobs.get(idempotencyKey) };
    }

    const jobRecord = {
      id: `${jobName}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      jobName,
      payload,
      idempotencyKey,
      attempts: 0,
      maxRetries,
      enqueuedAt: new Date(),
      status: 'enqueued',
    };

    this.jobHistory.push(jobRecord);

    const execute = async () => {
      const worker = this.workers.get(jobName);
      if (!worker) {
        console.warn(`[QueueService] No registered worker found for "${jobName}".`);
        return;
      }

      jobRecord.status = 'processing';
      while (jobRecord.attempts < jobRecord.maxRetries) {
        jobRecord.attempts++;
        try {
          const result = await worker(payload);
          jobRecord.status = 'completed';
          jobRecord.completedAt = new Date();
          jobRecord.result = result;

          if (idempotencyKey) {
            this.completedJobs.set(idempotencyKey, result);
          }

          this.emit('completed', jobRecord);
          return result;
        } catch (err) {
          console.warn(`[QueueService] Job ${jobRecord.id} attempt ${jobRecord.attempts} failed: ${err.message}`);
          if (jobRecord.attempts >= jobRecord.maxRetries) {
            jobRecord.status = 'failed';
            jobRecord.failedAt = new Date();
            jobRecord.error = err.message;
            this.deadLetterQueue.push(jobRecord);
            this.emit('failed', jobRecord);
            break;
          }
          // Exponential backoff wait
          await new Promise((res) => setTimeout(res, 200 * Math.pow(2, jobRecord.attempts)));
        }
      }
    };

    if (delayMs > 0) {
      setTimeout(execute, delayMs);
    } else {
      setImmediate(execute);
    }

    return { status: 'enqueued', jobId: jobRecord.id };
  }

  /**
   * Retrieves all dead-letter jobs for inspection
   */
  getDeadLetterJobs() {
    return [...this.deadLetterQueue];
  }

  /**
   * Retries a dead-letter job
   */
  async retryDeadLetterJob(jobId) {
    const idx = this.deadLetterQueue.findIndex((j) => j.id === jobId);
    if (idx === -1) {
      throw new Error(`Dead letter job with ID ${jobId} not found.`);
    }

    const [job] = this.deadLetterQueue.splice(idx, 1);
    return this.addJob(job.jobName, job.payload, {
      idempotencyKey: job.idempotencyKey,
      maxRetries: 3,
    });
  }
}

module.exports = new QueueService();
