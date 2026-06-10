import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { QUEUE_NAMES } from "../lib/queues.js";
import { runAssessmentAnalysisAgent } from "../agents/assessmentAnalysis.agent.js";
import { prisma } from "@repo/database";

export type AssessmentProfileJobData = {
  learnerId:       string;
  generationJobId: string;
};

export function startAssessmentProfileWorker(): Worker {
  const worker = new Worker<AssessmentProfileJobData>(
    QUEUE_NAMES.ASSESSMENT_PROFILE,
    async (job: Job<AssessmentProfileJobData>) => {
      const { learnerId, generationJobId } = job.data;
      console.log(`[AssessmentProfileWorker] Processing profile for learner ${learnerId}`);

      await prisma.generationJob.update({
        where: { id: generationJobId },
        data:  { status: "PROCESSING", startedAt: new Date() },
      });

      try {
        const result = await runAssessmentAnalysisAgent(learnerId);

        await prisma.learnerProfile.upsert({
          where:  { learnerId },
          create: {
            learnerId,
            riasecType:       result.riasecType,
            riasecScores:     result.riasecScores as any,
            profileSummary:   result.profileSummary,
            strengthsSummary: result.strengthsSummary,
          },
          update: {
            riasecType:       result.riasecType,
            riasecScores:     result.riasecScores as any,
            profileSummary:   result.profileSummary,
            strengthsSummary: result.strengthsSummary,
          },
        });

        await prisma.generationJob.update({
          where: { id: generationJobId },
          data:  { status: "COMPLETED", result: result as any, completedAt: new Date() },
        });

        console.log(`[AssessmentProfileWorker] ✓ Profile generated for ${learnerId} — RIASEC: ${result.riasecType}`);
      } catch (err: any) {
        await prisma.generationJob.update({
          where: { id: generationJobId },
          data:  { status: "FAILED", errorLog: err?.message ?? String(err), completedAt: new Date() },
        });
        throw err;
      }
    },
    {
      connection:  redisConnection,
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[AssessmentProfileWorker] ✗ Job ${job?.id} failed:`, err.message);
  });

  console.log("[AssessmentProfileWorker] started — concurrency: 5");
  return worker;
}
