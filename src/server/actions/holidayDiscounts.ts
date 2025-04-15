// File: src/server/actions/holidayDiscounts.ts
import { db } from "@/drizzle/db";
import { HolidayDiscountTable } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function createHolidayDiscount(data: any) {
  try {
    if (!data.couponCode || data.couponCode.trim() === "") {
      console.warn("Skipping insert: No couponCode provided.");
      return null;
    }

    const holidayDateValue = new Date(data.holidayDate);
    if (isNaN(holidayDateValue.getTime())) {
      throw new Error("Invalid holidayDate provided");
    }

    const existingDiscount = await db
      .select()
      .from(HolidayDiscountTable)
      .where(
        and(
          eq(HolidayDiscountTable.productId, data.productId),
          eq(HolidayDiscountTable.holidayDate, holidayDateValue) // ✅ Use Date directly
        )
      )
      .execute();

    if (existingDiscount.length > 0) {
      // ✅ Override existing record
      console.log("Overriding existing holiday discount...");
      const updated = await db
        .update(HolidayDiscountTable)
        .set({
          holidayName: data.holidayName,
          startBefore: data.startBefore,
          endAfter: data.endAfter,
          discountPercentage: data.discountPercentage ?? null,
          couponCode: data.couponCode.trim(),
        })
        .where(eq(HolidayDiscountTable.id, existingDiscount[0].id))
        .returning()
        .execute();

      return updated[0] ?? null;
    }

    // ✅ Insert new record if no existing entry found
    const inserted = await db
      .insert(HolidayDiscountTable)
      .values({
        productId: data.productId,
        holidayDate: holidayDateValue, // ✅ Keep as Date object
        holidayName: data.holidayName,
        startBefore: data.startBefore,
        endAfter: data.endAfter,
        discountPercentage: data.discountPercentage ?? null,
        couponCode: data.couponCode.trim(),
      })
      .returning()
      .execute();

    return inserted[0] ?? null;
  } catch (error) {
    console.error("Failed to create/update holiday discount:", error);
    throw error;
  }
}



export async function getHolidayDiscounts(productId: string | null) {
  if (!productId) return [];

  const discounts = await db
    .select()
    .from(HolidayDiscountTable)
    .where(eq(HolidayDiscountTable.productId, productId));

  // Ensure we are returning coupon codes properly
  return discounts.map(d => ({
    id: d.id,
    holidayDate: d.holidayDate,
    holidayName: d.holidayName,
    discountPercentage: d.discountPercentage ?? null,
    couponCode: d.couponCode ?? "", // Ensure empty string instead of null
  }));
}

export async function updateHolidayDiscount(id: string, data: any) {
  try {
    const updateData = { ...data };

    if (data.holidayDate) {
      const holidayDateValue = new Date(data.holidayDate);
      if (isNaN(holidayDateValue.getTime())) {
        throw new Error("Invalid holidayDate provided");
      }
      updateData.holidayDate = holidayDateValue;
    }

    const updated = await db
      .update(HolidayDiscountTable)
      .set(updateData)
      .where(eq(HolidayDiscountTable.id, id))
      .returning();

    return updated[0]; // Return updated record
  } catch (error) {
    console.error("Error updating holiday discount:", error);
    throw error;
  }
}

export async function deleteHolidayDiscount(id: string) {
  await db.delete(HolidayDiscountTable).where(eq(HolidayDiscountTable.id, id));
}
