import { NextResponse } from 'next/server';
import { deleteHolidayDiscount, updateHolidayDiscount } from '@/server/actions/holidayDiscounts';

// PUT request — update a holiday discount by ID
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const data = await req.json();

  try {
    const updatedDiscount = await updateHolidayDiscount(id, data);
    return NextResponse.json(updatedDiscount, { status: 200 });
  } catch (error) {
    console.error('Error updating discount:', error);
    return NextResponse.json({ message: 'Failed to update discount' }, { status: 500 });
  }
}

// DELETE request — delete a holiday discount by ID
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  try {
    await deleteHolidayDiscount(id);
    return NextResponse.json({ message: 'Discount deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting discount:', error);
    return NextResponse.json({ message: 'Failed to delete discount' }, { status: 500 });
  }
}
