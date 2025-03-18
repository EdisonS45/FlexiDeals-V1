import { NextResponse, NextRequest } from 'next/server';
import { createHolidayDiscount, getHolidayDiscounts } from '@/server/actions/holidayDiscounts';

export async function POST(req: Request) {
  const data = await req.json();
  const result = await createHolidayDiscount(data);
  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId');
  const result = await getHolidayDiscounts(productId);
  return NextResponse.json(result);
}
