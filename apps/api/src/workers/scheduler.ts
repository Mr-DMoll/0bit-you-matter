import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { QUEUE_NAMES } from "../lib/queues.js";

export async function setupScheduledJobs(): Promise<void> {
  const deadlineQueue  = new Queue(QUEUE_NAMES.DEADLINE_ALERTS,  { connection: redisConnection });
  const freshnessQueue = new Queue(QUEUE_NAMES.FRESHNESS_MONITOR, { connection: redisConnection });

  // Deadline alerts — run daily at 08:00 SAST (06:00 UTC)
  // Check bursaries closing in 7 days
  await deadlineQueue.upsertJobScheduler("daily-deadline-7d", {
    pattern: "0 6 * * *",
  }, {
    name: "deadline-check",
    data: { daysAhead: 7 },
  });

  // Check bursaries closing in 14 days
  await deadlineQueue.upsertJobScheduler("daily-deadline-14d", {
    pattern: "30 6 * * *",
  }, {
    name: "deadline-check",
    data: { daysAhead: 14 },
  });

  // Freshness monitor — run every Sunday at 02:00 UTC
  await freshnessQueue.upsertJobScheduler("weekly-freshness-check", {
    pattern: "0 2 * * 0",
  }, {
    name: "freshness-scan",
    data: {},
  });

  console.log("[Scheduler] Recurring jobs registered:");
  console.log("  - Deadline alerts (7-day): daily 06:00 UTC");
  console.log("  - Deadline alerts (14-day): daily 06:30 UTC");
  console.log("  - Freshness monitor: weekly Sunday 02:00 UTC");
}
