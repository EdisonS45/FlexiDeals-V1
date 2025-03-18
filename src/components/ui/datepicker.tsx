// src/components/ui/datepicker.tsx
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
}

export function DatePicker({ selected, onChange }: DatePickerProps) {
  return (
    <ReactDatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="yyyy/MM/dd"
      className="border rounded px-2 py-1 w-full"
    />
  );
}
