import { Queue } from "bullmq";
import { redisConnection } from "./redis.js";

export const contentGenerationQueue = new Queue("content-generation",  { connection: redisConnection });
export const assessmentProfileQueue = new Queue("assessment-profile",  { connection: redisConnection });
export const dataRefreshQueue       = new Queue("data-refresh",        { connection: redisConnection });
export const deadlineAlertsQueue    = new Queue("deadline-alerts",     { connection: redisConnection });
export const freshnessMonitorQueue  = new Queue("freshness-monitor",   { connection: redisConnection });
export const bursaryScraperQueue    = new Queue("bursary-scraper",     { connection: redisConnection });

export const QUEUE_NAMES = {
  CONTENT_GENERATION: "content-generation",
  ASSESSMENT_PROFILE: "assessment-profile",
  DATA_REFRESH:       "data-refresh",
  DEADLINE_ALERTS:    "deadline-alerts",
  FRESHNESS_MONITOR:  "freshness-monitor",
  BURSARY_SCRAPER:    "bursary-scraper",
} as const;
