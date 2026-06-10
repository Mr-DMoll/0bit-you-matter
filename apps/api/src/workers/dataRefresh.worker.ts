import { Worker, Job, Queue } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { QUEUE_NAMES } from "../lib/queues.js";
import { runWebResearchAgent } from "../agents/webResearch.agent.js";
import { prisma } from "@repo/database";

export type DataRefreshJobData = {
  entityType:   "BURSARY" | "UNIVERSITY_PROGRAMME" | "CAREER";
  entityId:     string;
  refreshField: "DEADLINE" | "APS_SCORE" | "SALARY_RANGE" | "PROGRAMME_FEES";
};

const REFRESH_THRESHOLDS_DAYS: Record<string, number> = {
  BURSARY:              90,
  UNIVERSITY_PROGRAMME: 180,
  CAREER:               365,
};

// Scheduled job — enqueues all stale entities for refresh
export async function enqueueStaleEntities(): Promise<number> {
  const dataRefreshQueue = new Queue(QUEUE_NAMES.DATA_REFRESH, { connection: redisConnection });
  const now     = new Date();
  let   queued  = 0;

  const staleBursaries = await prisma.bursary.findMany({
    where: {
      OR: [
        { lastVerifiedAt: null },
        { lastVerifiedAt: { lt: new Date(now.getTime() - REFRESH_THRESHOLDS_DAYS.BURSARY * 86_400_000) } },
      ],
      status: { in: ["APPROVED", "VERIFIED"] },
    },
    take: 50,
  });

  for (const b of staleBursaries) {
    await dataRefreshQueue.add("refresh", {
      entityType: "BURSARY", entityId: b.id, refreshField: "DEADLINE",
    } satisfies DataRefreshJobData);
    queued++;
  }

  const staleProgs = await prisma.programme.findMany({
    where: {
      OR: [
        { lastVerifiedAt: null },
        { lastVerifiedAt: { lt: new Date(now.getTime() - REFRESH_THRESHOLDS_DAYS.UNIVERSITY_PROGRAMME * 86_400_000) } },
      ],
      status: { in: ["APPROVED", "VERIFIED"] },
    },
    include: { university: true },
    take: 50,
  });

  for (const p of staleProgs) {
    await dataRefreshQueue.add("refresh", {
      entityType: "UNIVERSITY_PROGRAMME", entityId: p.id, refreshField: "APS_SCORE",
    } satisfies DataRefreshJobData);
    queued++;
  }

  console.log(`[DataRefreshWorker] Enqueued ${queued} stale entities for refresh`);
  return queued;
}

export function startDataRefreshWorker(): Worker {
  const worker = new Worker<DataRefreshJobData>(
    QUEUE_NAMES.DATA_REFRESH,
    async (job: Job<DataRefreshJobData>) => {
      const { entityType, entityId, refreshField } = job.data;
      console.log(`[DataRefreshWorker] Refreshing ${entityType} ${entityId} — field: ${refreshField}`);

      let name = entityId;
      let url: string | undefined;

      if (entityType === "BURSARY") {
        const b = await prisma.bursary.findUnique({ where: { id: entityId } });
        if (!b) return;
        name = b.name;
        url  = b.applicationUrl ?? undefined;
      } else if (entityType === "UNIVERSITY_PROGRAMME") {
        const p = await prisma.programme.findUnique({
          where:   { id: entityId },
          include: { university: true },
        });
        if (!p) return;
        name = `${p.name} — ${(p as any).university?.name ?? ""}`;
      }

      const typeMap: Record<string, any> = {
        DEADLINE:      "BURSARY_DEADLINE",
        APS_SCORE:     "APS_SCORE",
        SALARY_RANGE:  "SALARY_RANGE",
        PROGRAMME_FEES:"SALARY_RANGE",
      };

      const result = await runWebResearchAgent({
        type:     typeMap[refreshField],
        entityId,
        name,
        url,
      });

      if (!result.found) {
        console.warn(`[DataRefreshWorker] No data found for ${entityType} ${entityId}`);
        return;
      }

      if (entityType === "BURSARY" && result.data.deadline) {
        await prisma.bursary.update({
          where: { id: entityId },
          data:  { applicationDeadline: new Date(result.data.deadline) },
        });
      } else if (entityType === "UNIVERSITY_PROGRAMME" && result.data.apsRequired != null) {
        await prisma.programme.update({
          where: { id: entityId },
          data:  { apsMin: result.data.apsRequired },
        });
      }

      console.log(`[DataRefreshWorker] ✓ ${entityType} ${entityId} updated (confidence: ${result.confidence})`);
    },
    {
      connection:  redisConnection,
      concurrency: 2,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[DataRefreshWorker] ✗ Job ${job?.id} failed:`, err.message);
  });

  console.log("[DataRefreshWorker] started — concurrency: 2");
  return worker;
}
