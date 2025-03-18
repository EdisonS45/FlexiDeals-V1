import { subscriptionTiers } from "@/data/subscriptionTiers"
import { db } from "@/drizzle/db"
import { UserSubscriptionTable } from "@/drizzle/schema"
import { CACHE_TAGS, dbCache, getUserTag, revalidateDbCache } from "@/lib/cache"
import { eq, SQL } from "drizzle-orm"
import { SQLWrapper } from "drizzle-orm"; // Import if needed

export async function createUserSubscription(
  data: typeof UserSubscriptionTable.$inferInsert
) {
  const [newSubscription] = await db
    .insert(UserSubscriptionTable)
    .values(data)
    .onConflictDoNothing({
      target: UserSubscriptionTable.clerkUserId,
    })
    .returning({
      id: UserSubscriptionTable.id,
      userId: UserSubscriptionTable.clerkUserId,
    })

  if (newSubscription != null) {
    revalidateDbCache({
      tag: CACHE_TAGS.subscription,
      id: newSubscription.id,
      userId: newSubscription.userId,
    })
  }

  return newSubscription
}


export async function getUserSubscription(userId: string) {
  console.log("🔍 Fetching subscription for user:", userId);

  try {
    if (!userId) {
      console.error("❌ Error: userId is missing!");
      return null;
    }

    console.log("🛠️ Executing DB query...");
    const subscription = await db
      .select()
      .from(UserSubscriptionTable)
      .where(eq(UserSubscriptionTable.clerkUserId, userId))
      .limit(1);

    console.log("📌 Fetched Subscription from DB:", subscription);

    if (!subscription || subscription.length === 0) {
      console.warn("⚠️ No subscription found for user:", userId);
      
      // 🔥 Automatically create a default subscription
      const newSubscription = await db.insert(UserSubscriptionTable).values({
        clerkUserId: userId,
        tier: "Free",  // Default subscription tier
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      console.log("✅ Created default subscription:", newSubscription);
      return newSubscription[0]; 
    }

    return subscription[0];
  } catch (error) {
    console.error("🔥 Database query failed:", error);
    return null;
  }
}

export async function updateUserSubscription(
  where: SQL<unknown>, // ✅ Fixed type: SQLWrapper → SQL<unknown>
  data: Partial<{
    clerkUserId?: string;
    stripeSubscriptionId?: string | undefined; // ✅ Allowed undefined instead of null
    stripeSubscriptionItemId?: string | undefined;
    stripeCustomerId?: string | undefined; // ✅ Added missing property
    tier?: "Free" | "Basic" | "Standard" | "Premium" | undefined; // ✅ Fixed type
  }>
) {
  console.log("Updating subscription with:", where, data); // Debugging

  const [updatedSubscription] = await db
    .update(UserSubscriptionTable)
    .set(data)
    .where(where)
    .returning({
      id: UserSubscriptionTable.id,
      userId: UserSubscriptionTable.clerkUserId,
      stripeSubscriptionId: UserSubscriptionTable.stripeSubscriptionId,
    });

  if (!updatedSubscription) {
    console.warn("No subscription updated for:", where);
    return;
  }

  console.log("Updated Subscription:", updatedSubscription); // Debugging

  revalidateDbCache({
    tag: CACHE_TAGS.subscription,
    userId: updatedSubscription.userId,
    id: updatedSubscription.id,
  });
}


export async function getUserSubscriptionTier(userId: string) {
  const subscription = await getUserSubscription(userId)

  if (subscription == null) throw new Error("User has no subscription")

  return subscriptionTiers[subscription.tier]
}

function getUserSubscriptionInternal(userId: string) {
  return db.query.UserSubscriptionTable.findFirst({
    where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
  })
}
