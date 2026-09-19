import { env } from '../config/env.js';

export interface JobData {
  type: 'AI_PROCESSING' | 'DOCUMENT_PARSING' | 'NOTIFICATION_DISPATCH' | 'RISK_ANALYSIS' | 'REPORT_GENERATION';
  payload: any;
}

export type JobHandler = (data: JobData) => Promise<any>;

class JobQueueService {
  private handlers = new Map<string, JobHandler>();
  private inMemoryQueue: { id: string; data: JobData; attempts: number }[] = [];
  private isProcessing = false;

  constructor() {
    // Start background poller for in-memory jobs
    setInterval(() => {
      this.processInMemoryQueue();
    }, 1000);
  }

  registerWorker(type: string, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  async addJob(type: JobData['type'], payload: any): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.inMemoryQueue.push({ id: jobId, data: { type, payload }, attempts: 0 });
    console.log(`[JobQueue] Job ${jobId} (${type}) enqueued.`);
    return jobId;
  }

  private async processInMemoryQueue() {
    if (this.isProcessing || this.inMemoryQueue.length === 0) return;
    this.isProcessing = true;

    try {
      const job = this.inMemoryQueue.shift();
      if (!job) return;

      const handler = this.handlers.get(job.data.type);
      if (handler) {
        try {
          await handler(job.data);
          console.log(`[JobQueue] Job ${job.id} (${job.data.type}) completed successfully.`);
        } catch (err) {
          console.error(`[JobQueue] Job ${job.id} failed:`, err);
          if (job.attempts < 3) {
            job.attempts += 1;
            this.inMemoryQueue.push(job);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}

export const jobQueue = new JobQueueService();
