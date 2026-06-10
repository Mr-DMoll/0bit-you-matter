import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { QUEUE_NAMES } from "../lib/queues.js";
import { prisma } from "@repo/database";

export type DeadlineAlertsJobData = {
  daysAhead: number; // notify learners about bursaries closing within N days
};

async function sendDeadlineNotifications(daysAhead: number): Promise<number> {
  const cutoff = new Date(Date.now() + daysAhead * 86_400_000);
  const soon   = new Date(Date.now() + (daysAhead - 1) * 86_400_000);

  const upcomingBursaries = await prisma.bursary.findMany({
    where: {
      applicationDeadline: { gte: soon, lte: cutoff },
      status: { in: ["APPROVED", "VERIFIED"] },
    },
  });

  if (upcomingBursaries.length === 0) return 0;

  const learners = await prisma.user.findMany({
    where: { role: "LEARNER", status: "ACTIVE" },
    select: { id: true },
  });

  let notified = 0;
  for (const bursary of upcomingBursaries) {
    for (const learner of learners) {
      await prisma.notification.create({
        data: {
          userId: learner.id,
          title:  "Bursary closing soon",
          body:   `"${bursary.name}" — deadline in ${daysAhead} days`,
          link:   `/bursaries/${bursary.id}`,
        },
      });
      notified++;
    }
  }

  console.log(`[DeadlineAlertsWorker] Sent ${notified} notifications for ${upcomingBursaries.length} bursaries closing in ${daysAhead} days`);
  return notified;
}

export function startDeadlineAlertsWorker(): Worker {
  const worker = new Worker<DeadlineAlertsJobData>(
    QUEUE_NAMES.DEADLINE_ALERTS,
    async (job: Job<DeadlineAlertsJobData>) => {
      const { daysAhead } = job.data;
      await sendDeadlineNotifications(daysAhead);
    },
    {
      connection:  redisConnection,
      concurrency: 1,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[DeadlineAlertsWorker] ✗ Job ${job?.id} failed:`, err.message);
  });

  console.log("[DeadlineAlertsWorker] started");
  return worker;
}
