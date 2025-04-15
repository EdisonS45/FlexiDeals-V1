"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const DAYS_OPTIONS = [0, 1, 2, 3, 7];

interface HolidayEntry {
  id: string;
  date: Date;
  name: string;
  startBefore: number;
  endAfter: number;
  discount: string;
  couponCode: string;
}

export function HolidayDiscountsForm({
  productId,
  initialEntries,
}: {
  productId: string;
  initialEntries: HolidayEntry[];
}) {
  const [entries, setEntries] = useState<HolidayEntry[]>(initialEntries);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Track saving state

  // Fetch global holidays and merge with existing DB entries
  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://date.nager.at/api/v3/PublicHolidays/2025/US");
        const holidays = await res.json();

        const mapped: HolidayEntry[] = holidays.map((holiday: any) => ({
          id: `api-${holiday.date}`,
          date: new Date(holiday.date),
          name: holiday.name,
          startBefore: 7,
          endAfter: 3,
          discount: "40",
          couponCode: "",
        }));

        // Merge API holidays with database holidays (avoid duplicates)
        const mergedHolidays = [
          ...initialEntries,
          ...mapped.filter((h) => !initialEntries.some((entry) => entry.date.getTime() === h.date.getTime())),
        ];

        setEntries(mergedHolidays);
      } catch (err) {
        console.error("Failed to fetch holidays:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, [initialEntries]);

  const updateEntry = (id: string, key: keyof HolidayEntry, value: any) => {
    setEntries((prevEntries) =>
      prevEntries.map((entry) => (entry.id === id ? { ...entry, [key]: value } : entry))
    );
  };

  const saveChanges = async () => {
    setIsSaving(true); // Start saving
    try {
      for (const entry of entries) {
        const payload = {
          productId,
          holidayDate: entry.date,
          holidayName: entry.name,
          startBefore: entry.startBefore,
          endAfter: entry.endAfter,
          discountPercentage: parseFloat(entry.discount),
          couponCode: entry.couponCode,
        };
  
        await fetch("/api/holiday-discounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
  
      console.log("Holiday deals updated successfully."); // Logging instead of alert
    } catch (error) {
      console.error("Error saving holiday discounts:", error);
    } finally {
      setIsSaving(false); // Stop saving
    }
  };
  

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Holiday Deals</CardTitle>
        <CardDescription>Global holidays with preset discount. Edit as needed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p>Loading holidays...</p>
        ) : entries.length === 0 ? (
          <p>No holidays found.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="p-4 border rounded-md flex flex-wrap gap-4 items-end">
              <div className="w-full sm:w-1/3 md:w-1/4">
                <Label>Date</Label>
                <Input value={format(entry.date, "PPP")} disabled />
              </div>
              <div className="w-full sm:w-1/3 md:w-1/4">
                <Label>Holiday Name</Label>
                <Input value={entry.name} disabled />
              </div>
              <div className="w-full sm:w-1/4 md:w-1/6">
                <Label>Start Before</Label>
                <Select
                  value={entry.startBefore.toString()}
                  onValueChange={(value) => updateEntry(entry.id, "startBefore", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Days" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OPTIONS.map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-1/4 md:w-1/6">
                <Label>End After</Label>
                <Select
                  value={entry.endAfter.toString()}
                  onValueChange={(value) => updateEntry(entry.id, "endAfter", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Days" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OPTIONS.map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-1/4 md:w-1/6">
                <Label>Discount %</Label>
                <Input
                  value={entry.discount}
                  onChange={(e) => updateEntry(entry.id, "discount", e.target.value)}
                  type="number"
                  min={0}
                  max={100}
                />
              </div>
              <div className="w-full sm:w-1/3 md:w-1/4">
                <Label>Coupon Code</Label>
                <Input
                  value={entry.couponCode}
                  onChange={(e) => updateEntry(entry.id, "couponCode", e.target.value)}
                />
              </div>
            </div>
          ))
        )}
        <div className="flex justify-end">
          <Button disabled={isSaving} onClick={saveChanges}>
            {isSaving ? "Saving..." : "Save All Deals"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
