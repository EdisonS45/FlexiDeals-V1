import { env } from "@/data/env/server"
import { getTierByPriceId, subscriptionTiers } from "@/data/subscriptionTiers"
import { UserSubscriptionTable } from "@/drizzle/schema"
import { updateUserSubscription } from "@/server/db/subscription"
import { eq } from "drizzle-orm"
import { NextRequest } from "next/server"
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {Stripe} from "stripe"

const stripe = new Stripe(env.STRIPE_SECRET_KEY)

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  try {
    const event = stripe.webhooks.constructEvent(rawBody, sig!, env.STRIPE_WEBHOOK_SECRET);
    console.log("Received Stripe event:", event.type);

    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.clerkUserId;
        const subscriptionId = subscription.id;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price?.id;
        
        console.log("📌 Subscription created for user:", userId, "Subscription ID:", subscriptionId);
      
        if (userId) {
          await updateUserSubscription(eq(UserSubscriptionTable.clerkUserId, userId), {
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            tier: getTierByPriceId(priceId)?.name ?? "Standard",
          });
          console.log("✅ Successfully updated subscription with ID:", subscriptionId);
        }
        break;
      }
      
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.clerkUserId;
        console.log("User ID from metadata:", userId);
        console.log("Session object:", session);
        if (userId) {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
      
          console.log("Extracted Stripe Subscription ID:", subscriptionId);
          console.log("Extracted Stripe Customer ID:", customerId);
      
          if (subscriptionId && customerId) {
            await updateUserSubscription(eq(UserSubscriptionTable.clerkUserId, userId), {
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: customerId,
            });
            console.log("✅ User subscription updated with Stripe IDs.");
          }
        }
        
        break;
      }
      
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.clerkUserId;
        const priceId = subscription.items.data[0]?.price?.id;
        const subscriptionItemId = subscription.items.data[0]?.id; // ✅ Extract item ID
        console.log(subscription.items.data[0])
      
        console.log("Subscription updated for user:", userId, "New Price ID:", priceId);
      
        if (userId && priceId) {
          await updateUserSubscription(eq(UserSubscriptionTable.clerkUserId, userId), {
            stripeSubscriptionId: subscription.id, // ✅ Store subscription ID
            stripeSubscriptionItemId: subscriptionItemId, // ✅ Store subscription item ID
            tier: getTierByPriceId(priceId)?.name ?? "Standard", // ✅ Update tier correctly
          });
        }
        break;
      }
      
          case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.clerkUserId;
        console.log("Subscription canceled for user:", userId);

        if (userId) {
          await updateUserSubscription(eq(UserSubscriptionTable.clerkUserId, userId), { stripeSubscriptionId: "Free" });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}

async function handleCreate(subscription: Stripe.Subscription) {
  const tier = getTierByPriceId(subscription.items.data[0]?.price?.id); // ✅ Fixed indexing
  const clerkUserId = subscription.metadata?.clerkUserId;

  if (!clerkUserId || !tier) {
    return new Response(null, { status: 500 });
  }

  const customer = subscription.customer;
  const customerId = typeof customer === "string" ? customer : customer.id;

  return await updateUserSubscription(
    eq(UserSubscriptionTable.clerkUserId, clerkUserId),
    {
      stripeCustomerId: customerId, // ✅ Added this property in `updateUserSubscription`
      tier: tier.name as "Free" | "Basic" | "Standard" | "Premium", // ✅ Fixed type issue
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionItemId: subscription.items.data[0]?.id, // ✅ Fixed indexing
    }
  );
}

async function handleUpdate(subscription: Stripe.Subscription) {
  const tier = getTierByPriceId(subscription.items.data[0].price.id)
  const customer = subscription.customer
  const customerId = typeof customer === "string" ? customer : customer.id
  if (tier == null) {
    return new Response(null, { status: 500 })
  }

  return await updateUserSubscription(
    eq(UserSubscriptionTable.stripeCustomerId, customerId),
    { tier: tier.name }
  )
}

async function handleDelete(subscription: Stripe.Subscription) {
  const customer = subscription.customer;
  const customerId = typeof customer === "string" ? customer : customer.id;

  return await updateUserSubscription(
    eq(UserSubscriptionTable.stripeCustomerId, customerId),
    {
      tier: "Free", // ✅ Fixed type issue
      stripeSubscriptionId: undefined, // ✅ Fixed null assignment (use `undefined` instead)
      stripeSubscriptionItemId: undefined, // ✅ Fixed null assignment
    }
  );
}
