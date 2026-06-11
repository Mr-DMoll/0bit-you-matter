import { Router } from "express";
import {
  getMyProfile, updateMyProfile, generateProfile, matchCareers,
  saveCareer, unsaveCareer,
  getMyRoadmap, updateMilestone,
  getChatHistory, sendChatMessage,
} from "./learner.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();
router.use(protect);

router.get("/profile",            getMyProfile);
router.patch("/profile",          updateMyProfile);
router.post("/profile/generate",  generateProfile);
router.post("/profile/match",     matchCareers);

router.post("/saved-careers",         saveCareer);
router.delete("/saved-careers/:careerId", unsaveCareer);

router.get("/roadmap",            getMyRoadmap);
router.patch("/roadmap/milestone", updateMilestone);

router.get("/chat/history",       getChatHistory);
router.post("/chat/message",      sendChatMessage);

export default router;
