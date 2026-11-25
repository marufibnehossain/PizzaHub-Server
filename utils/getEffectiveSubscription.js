import { SUBSCRIPTION_PLANS } from "../constants/subscription.js";

export const getEffectiveSubscription = (vendor) => {
    if (vendor.subscriptionPlan !== SUBSCRIPTION_PLANS.PREMIUM) {
        return SUBSCRIPTION_PLANS.FREE;
    }

    if (!vendor.subscriptionExpiresAt) {
        return SUBSCRIPTION_PLANS.FREE;
    }

    const expiresAt = new Date(vendor.subscriptionExpiresAt).getTime();

    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        return SUBSCRIPTION_PLANS.FREE;
    }

    return SUBSCRIPTION_PLANS.PREMIUM;
};