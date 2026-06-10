import { Worker, Job, Queue } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { QUEUE_NAMES } from "../lib/queues.js";
import { prisma } from "@repo/database";

export type FreshnessMonitorJobData = Record<string, never>;

const THRESHOLDS: Record<string, number> = {
  CAREER:               365,
  UNIVERSITY_PROGRAMME: 365,
  BURSARY:              90,
};

async function checkFreshnessAndEnqueue(): Promise<{
  stale: number;
  enqueued: number;
}> {
  const now = Date.now();
  const dataRefreshQueue = new Queue(QUEUE_NAMES.DATA_REFRESH, { connection: redisConnection });
  let stale    = 0;
  let enqueued = 0;

  // Check careers
  const staleCareers = await prisma.career.findMany({
    where: {
      status: { in: ["APPROVED", "VERIFIED"] },
      OR: [
        { lastVerifiedAt: null },
        { lastVerifiedAt: { lt: new Date(now - THRESHOLDS.CAREER * 86_400_000) } },
      ],
    },
    select: { id: true, title: true, lastVerifiedAt: true },
    take: 100,
  });

  stale += staleCareers.length;
  for (const c of staleCareers) {
    await dataRefreshQueue.add("refresh", {
      entityType: "CAREER", entityId: c.id, refreshField: "SALARY_RANGE",
    });
    enqueued++;
  }

  // Check bursaries
  const staleBursaries = await prisma.bursary.findMany({
    where: {
      status: { in: ["APPROVED", "VERIFIED"] },
      OR: [
        { lastVerifiedAt: null },
        { lastVerifiedAt: { lt: new Date(now - THRESHOLDS.BURSARY * 86_400_000) } },
      ],
    },
    select: { id: true, name: true },
    take: 100,
  });

  stale += staleBursaries.length;
  for (const b of staleBursaries) {
    await dataRefreshQueue.add("refresh", {
      entityType: "BURSARY", entityId: b.id, refreshField: "DEADLINE",
    });
    enqueued++;
  }

  // Notify admins if stale count exceeds threshold
  if (stale > 20) {
    const admins = await prisma.user.findMany({
      where:  { role: { in: ["ADMIN", "CONTENT_MANAGER"] }, status: "ACTIVE" },
      select: { id: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title:  "Freshness alert",
          body:   `${stale} entries are past their verification threshold and have been queued for refresh.`,
          link:   "/content-manager/freshness-dashboard",
        },
      });
    }
  }

  console.log(`[FreshnessMonitor] Found ${stale} stale entries — enqueued ${enqueued} refresh jobs`);
  return { stale, enqueued };
}

export function startFreshnessMonitorWorker(): Worker {
  const worker = new Worker<FreshnessMonitorJobData>(
    QUEUE_NAMES.FRESHNESS_MONITOR,
    async () => { await checkFreshnessAndEnqueue(); },
    {
      connection:  redisConnection,
      concurrency: 1,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[FreshnessMonitor] ✗ Job ${job?.id} failed:`, err.message);
  });

  console.log("[FreshnessMonitor] started");
  return worker;
}
