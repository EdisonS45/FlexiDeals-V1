// File: src/server/actions/holidayDiscounts.ts
import { db } from "@/drizzle/db";
import { HolidayDiscountTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function createHolidayDiscount(data: any) {
    try {
      const holidayDateValue = new Date(data.holidayDate);
      if (isNaN(holidayDateValue.getTime())) {
        throw new Error("Invalid holidayDate provided");
      }
  
      // Prevent redundant insert if both couponCode and discountPercentage are missing
      const isCouponEmpty = !data.couponCode || data.couponCode.trim() === "";
      const isDiscountEmpty =
        data.discountPercentage === null || data.discountPercentage === undefined;
  
      if (isCouponEmpty && isDiscountEmpty) {
        // Don't insert anything; log and exit
        console.warn("No couponCode or discountPercentage provided. Skipping insert.");
        return null;
      }
  
      const inserted = await db
        .insert(HolidayDiscountTable)
        .values({
          ...data,
          holidayDate: holidayDateValue,
          couponCode: isCouponEmpty ? null : data.couponCode,
          discountPercentage: isDiscountEmpty ? null : data.discountPercentage,
        })
        .returning();
  
      return inserted[0];
    } catch (error) {
      console.error("Failed to create holiday discount:", error);
      throw error;
    }
  }
  

export async function getHolidayDiscounts(productId: string | null) {
  if (!productId) return [];

  const discounts = await db
    .select()
    .from(HolidayDiscountTable)
    .where(eq(HolidayDiscountTable.productId, productId));

  return discounts;
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
