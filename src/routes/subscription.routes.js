import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT);

// Toggle Subscribe (subscribe/unsubscribe)
//channelId is userid of the channel to subscribe/unsubscribe to

router.route("/toggle/:channelId").post(toggleSubscription);

// Get Subscribers of a Channel

router.route("/channel/:channelId").get(getUserChannelSubscribers);


// Get Channels a User Has Subscribed To

router.route("/user/:subscriberId").get(getSubscribedChannels);

export default router;
