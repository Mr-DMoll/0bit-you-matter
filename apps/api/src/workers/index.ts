import "../config/env.config.js"; // load env first

import { startContentGenerationWorker } from "./contentGeneration.worker.js";
import { startAssessmentProfileWorker }  from "./assessmentProfile.worker.js";
import { startDataRefreshWorker }        from "./dataRefresh.worker.js";
import { startDeadlineAlertsWorker }     from "./deadlineAlerts.worker.js";
import { startFreshnessMonitorWorker }   from "./freshnessMonitor.worker.js";
import { startBursaryScraperWorker }     from "./bursaryScraper.worker.js";
import { setupScheduledJobs }            from "./scheduler.js";

async function main() {
  console.log("=== You Matter Workers ===");

  const workers = [
    startContentGenerationWorker(),
    startAssessmentProfileWorker(),
    startDataRefreshWorker(),
    startDeadlineAlertsWorker(),
    startFreshnessMonitorWorker(),
    startBursaryScraperWorker(),
  ];

  await setupScheduledJobs();

  console.log(`\n✓ ${workers.length} workers running — waiting for jobs\n`);

  const shutdown = async () => {
    console.log("\n[Workers] Shutting down gracefully…");
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT",  shutdown);
}

main().catch((err) => {
  console.error("[Workers] Fatal startup error:", err);
  process.exit(1);
});
