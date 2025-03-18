"use server"
import { eq } from "drizzle-orm"
import { PaidTierNames, subscriptionTiers } from "@/data/subscriptionTiers"
import { auth, currentUser, User } from "@clerk/nextjs/server"
import { getUserSubscription, updateUserSubscription } from "../db/subscription"
import { Stripe } from "stripe"
import { env as serverEnv } from "@/data/env/server"
import { env as clientEnv } from "@/data/env/client"
import { redirect } from "next/navigation"
import { UserSubscriptionTable } from "@/drizzle/schema"

const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY)

export async function createCancelSession(): Promise<void> {
  const user = await currentUser();
  if (user == null) return;

  const subscription = await getUserSubscription(user.id);
  if (subscription == null) return;

  if (
    !subscription.stripeCustomerId ||
    !subscription.stripeSubscriptionId
  ) {
    return;
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
    flow_data: {
      type: "subscription_cancel",
      subscription_cancel: {
        subscription: subscription.stripeSubscriptionId,
      },
    },
  });

  redirect(portalSession.url);
}


export async function createCustomerPortalSession(): Promise<void> {
  console.log("createCustomerPortalSession called"); // Debugging line
  const { userId } = await auth();
  if (!userId) return;

  const subscription = await getUserSubscription(userId);
  if (!subscription?.stripeCustomerId) return;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
  });

  redirect(portalSession.url);
}


export async function createCheckoutSession(tier: PaidTierNames): Promise<void> {
  const user = await currentUser();
  if (!user) return;

  const subscription = await getUserSubscription(user.id);
  if (!subscription) return;

  let url;
  if (!subscription.stripeCustomerId) {
    url = await getCheckoutSession(tier, user);
  } else {
    url = await getSubscriptionUpgradeSession(tier, subscription);
  }

  if (!url) return;

  // ✅ Update the user's subscription in the database
  await updateUserSubscription(
    eq(UserSubscriptionTable.clerkUserId, user.id),
    { tier }
  );

  redirect(url);
}


async function getCheckoutSession(tier: PaidTierNames, user: User) {
  const session = await stripe.checkout.sessions.create({
    customer_email: user.primaryEmailAddress?.emailAddress,
    metadata: { clerkUserId: user.id, newTier: tier }, // ✅ Add metadata here
    subscription_data: {  
      metadata: { clerkUserId: user.id, newTier: tier }, // ✅ Ensure metadata is passed inside subscription_data
    },
    line_items: [
      {
        price: subscriptionTiers[tier].stripePriceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
    cancel_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
  });

  console.log("Created Checkout Session:", session);
  return session.url;
}



async function getSubscriptionUpgradeSession(
  tier: PaidTierNames,
  subscription: {
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    stripeSubscriptionItemId: string | null
  }
) {
  if (
    subscription.stripeCustomerId == null ||
    subscription.stripeSubscriptionId == null ||
    subscription.stripeSubscriptionItemId == null
  ) {
    throw new Error()
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
    flow_data: {
      type: "subscription_update_confirm",
      subscription_update_confirm: {
        subscription: subscription.stripeSubscriptionId,
        items: [
          {
            id: subscription.stripeSubscriptionItemId,
            price: subscriptionTiers[tier].stripePriceId,
            quantity: 1,
          },
        ],
      },
    },
  })

  return portalSession.url
}
