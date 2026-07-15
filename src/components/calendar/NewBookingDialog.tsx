"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PURPOSE_OPTIONS, TIME_SLOTS } from "@/lib/dates";
import { createReservation } from "@/actions/reservations";

export function NewBookingDialog({
  schoolSlug,
  schoolId,
  classroomId,
  date,
  open,
  onOpenChange,
  onCreated,
}: {
  schoolSlug: string;
  schoolId: number;
  classroomId: number;
  date: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [startTime, setStartTime] = useState<string>(TIME_SLOTS[0]);
  const [endTime, setEndTime] = useState<string>(TIME_SLOTS[1]);
  const [purpose, setPurpose] = useState<string>(PURPOSE_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!date) return;
    setError(null);
    startTransition(async () => {
      const result = await createReservation(schoolSlug, schoolId, {
        classroomId,
        requestDate: date,
        startTime: startTime as (typeof TIME_SLOTS)[number],
        endTime: endTime as (typeof TIME_SLOTS)[number],
        purpose,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      onCreated();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增預約申請</DialogTitle>
        </DialogHeader>

        <p className="text-sm">
          <span className="font-medium">預約日期：</span>
          {date}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="muji-label mb-2 block">開始時間</label>
            <Select value={startTime} onValueChange={(v) => v && setStartTime(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="muji-label mb-2 block">結束時間</label>
            <Select value={endTime} onValueChange={(v) => v && setEndTime(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="muji-label mb-2 block">活動目的</label>
          <Select value={purpose} onValueChange={(v) => v && setPurpose(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PURPOSE_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "送出中…" : "送出預約"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
