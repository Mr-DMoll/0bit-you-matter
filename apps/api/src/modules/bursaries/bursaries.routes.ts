import { Router } from "express";
import {
  listBursaries, getBursary, createBursary, updateBursary, upcomingDeadlines,
  listBursarySources, triggerBursaryScrape, testScrape,
} from "./bursaries.controller.js";
import { protect, optionalAuth } from "../../middleware/auth.middleware.js";
import { authorize }             from "../../middleware/role.middleware.js";
import { Role }      from "@repo/types";

const router = Router();
// REVIEWER replaces DATA_VERIFIER — reviewers can edit content they verify
const editors = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER, Role.REVIEWER];

router.get("/",                  optionalAuth, listBursaries);
router.get("/deadlines/upcoming", upcomingDeadlines);
router.get("/:id",               optionalAuth, getBursary);

router.get("/scrape/sources",        protect, authorize(editors), listBursarySources);
router.post("/scrape",               protect, authorize(editors), triggerBursaryScrape);
router.get("/scrape/test/:sourceKey", protect, authorize(editors), testScrape);

router.post("/",     protect, authorize(editors), createBursary);
router.patch("/:id", protect, authorize(editors), updateBursary);

export default router;
