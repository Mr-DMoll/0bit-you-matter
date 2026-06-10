import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { QUEUE_NAMES }     from "../lib/queues.js";
import { runBursaryScraperAgent } from "../agents/bursaryScraper.agent.js";
import { prisma } from "@repo/database";

export interface BursaryScraperJobData {
  sourceKey:      string;
  generationJobId: string; // so we can update job status in DB
}

export function startBursaryScraperWorker(): Worker {
  const worker = new Worker<BursaryScraperJobData>(
    QUEUE_NAMES.BURSARY_SCRAPER,
    async (job: Job<BursaryScraperJobData>) => {
      const { sourceKey, generationJobId } = job.data;
      console.log(`[BursaryScraperWorker] Scraping source: ${sourceKey}`);

      // Mark job as running
      await prisma.generationJob.update({
        where: { id: generationJobId },
        data:  { status: "PROCESSING" },
      });

      const result = await runBursaryScraperAgent(sourceKey);

      // Mark job complete/failed
      // Consider it failed only if: fetch failed (saved=0 AND errors has fetch/extraction errors)
      const fetchFailed = result.errors.some((e) =>
        e.includes("Failed to fetch") || e.includes("Extraction failed") || e.includes("too short")
      );

      if (fetchFailed && result.saved === 0) {
        await prisma.generationJob.update({
          where: { id: generationJobId },
          data:  {
            status:      "FAILED",
            completedAt: new Date(),
            errorLog:    result.errors.join("\n"),
          },
        });
      } else {
        // Completed — even if 0 saved (site had no bursaries or all were duplicates)
        await prisma.generationJob.update({
          where: { id: generationJobId },
          data:  {
            status:      "COMPLETED",
            completedAt: new Date(),
            result: {
              scraped:  result.scraped,
              saved:    result.saved,
              skipped:  result.skipped,
              errors:   result.errors.length > 0 ? result.errors : undefined,
            } as any,
          },
        });
      }

      console.log(`[BursaryScraperWorker] ✓ ${sourceKey}: ${result.saved} saved, ${result.skipped} skipped, ${result.errors.length} errors`);
      return result;
    },
    {
      connection:  redisConnection,
      concurrency: 2, // Don't hammer sites simultaneously
    }
  );

  worker.on("completed", (job) => {
    console.log(`[BursaryScraperWorker] ✓ Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[BursaryScraperWorker] ✗ Job ${job?.id} failed:`, err.message);
  });

  console.log("[BursaryScraperWorker] started — concurrency: 2");
  return worker;
}
