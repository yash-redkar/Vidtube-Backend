import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId, //One who is SUBSCIBING
            ref: "User",
        },
        channel: {
            type: Schema.Types.ObjectId, // one to whom `subscriber` is SUBSCIBING
            ref: "User",
        },
    },
    {timestamps: true}
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema)
