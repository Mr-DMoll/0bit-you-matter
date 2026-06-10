import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { QUEUE_NAMES } from "../lib/queues.js";
import { runContentGenerationAgent } from "../agents/contentGeneration.agent.js";

export type ContentGenerationJobData = {
  generationJobId: string;
};

export function startContentGenerationWorker(): Worker {
  const worker = new Worker<ContentGenerationJobData>(
    QUEUE_NAMES.CONTENT_GENERATION,
    async (job: Job<ContentGenerationJobData>) => {
      console.log(`[ContentGenWorker] Processing job ${job.id} — generationJobId: ${job.data.generationJobId}`);
      await runContentGenerationAgent(job.data.generationJobId);
    },
    {
      connection:  redisConnection,
      concurrency: 3,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[ContentGenWorker] ✓ Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[ContentGenWorker] ✗ Job ${job?.id} failed:`, err.message);
  });

  console.log("[ContentGenWorker] started — concurrency: 3");
  return worker;
}
