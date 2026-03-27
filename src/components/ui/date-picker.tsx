"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { cn } from "./utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  /**
   * Отключить конкретные даты (например, занятые/прошлые).
   * Если задан, передаётся в react-day-picker как disabled matcher.
   */
  disabledDate?: (date: Date) => boolean;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Выберите дату",
  label,
  className,
  disabled,
  disabledDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <label className="text-sm font-medium text-[#222222]">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-between text-left font-normal h-10 rounded-xl bg-white border-gray-200",
              !value && "text-gray-500"
            )}
          >
            <span>{value ? formatDate(value) : placeholder}</span>
            <CalendarIcon className="h-4 w-4 shrink-0 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={8}
          className="w-auto p-0"
        >
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(date) => {
              onChange?.(date ?? undefined);
              setOpen(false);
            }}
            disabled={disabledDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
