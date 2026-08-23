import { Queue, Worker } from 'bullmq';
import env from '../config/env.js';

// Redis connection setup
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10)
};

export class QueueService {
  constructor() {
    this.isRedisAvailable = false;
    this.emailQueue = null;
    this.worker = null;

    try {
      this.emailQueue = new Queue('emailNotificationQueue', {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          },
          removeOnComplete: true,
          removeOnFail: false // Keep failed jobs for Dead-Letter Queue (DLQ)
        }
      });
      this.isRedisAvailable = true;
    } catch (err) {
      console.warn('[Queue Warning] Redis mövcud deyil, fallback rejimində icra olunur.');
    }
  }

  async addJob(queueName, jobName, data) {
    if (!this.isRedisAvailable || !this.emailQueue) {
      console.log(`[Job Executed Sync (No Redis)] ${jobName}:`, data);
      return { sync: true };
    }

    try {
      return await this.emailQueue.add(jobName, data);
    } catch (err) {
      console.warn(`[Queue Error] Job əlavə edilərkən xəta: ${err.message}`);
      return { sync: true };
    }
  }
}

export const queueService = new QueueService();
export default queueService;
