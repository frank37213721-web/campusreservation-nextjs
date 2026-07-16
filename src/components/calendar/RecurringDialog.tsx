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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PURPOSE_OPTIONS, TIME_SLOTS } from "@/lib/dates";
import { createBulkRecurringReservations } from "@/actions/reservations";

export function RecurringDialog({
  schoolSlug,
  schoolId,
  classroomId,
  date,
  defaultDepartment,
  open,
  onOpenChange,
  onCreated,
}: {
  schoolSlug: string;
  schoolId: number;
  classroomId: number;
  date: string | null;
  defaultDepartment: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [startTime, setStartTime] = useState<string>(TIME_SLOTS[0]);
  const [endTime, setEndTime] = useState<string>(TIME_SLOTS[1]);
  const [department, setDepartment] = useState(defaultDepartment);
  const [purpose, setPurpose] = useState<string>(PURPOSE_OPTIONS[0]);
  const [weeks, setWeeks] = useState(1);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!date) return;
    setMessage(null);
    startTransition(async () => {
      const result = await createBulkRecurringReservations(schoolSlug, schoolId, {
        classroomId,
        startDate: date,
        startTime: startTime as (typeof TIME_SLOTS)[number],
        endTime: endTime as (typeof TIME_SLOTS)[number],
        department,
        purpose,
        weeks,
      });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({
        type: "success",
        text: result.warning ?? `成功建立了 ${result.count} 筆預約！`,
      });
      onCreated();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>單日/重複預約申請</DialogTitle>
        </DialogHeader>

        <p className="text-sm">
          起始日期：<span className="font-medium">{date}</span>
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">開始時間</Label>
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
            <Label className="mb-2 block">結束時間</Label>
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
          <Label className="mb-2 block">使用單位/處室</Label>
          <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>

        <div>
          <Label className="mb-2 block">活動目的</Label>
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

        <div>
          <Label className="mb-2 block">重複預約週數 (包含起始日)：{weeks}</Label>
          <Slider
            min={1}
            max={21}
            step={1}
            value={[weeks]}
            onValueChange={(v) => setWeeks(Array.isArray(v) ? v[0] : v)}
          />
        </div>

        {message && (
          <p className={message.type === "success" ? "text-sm text-status-approved" : "text-sm text-destructive"}>
            {message.text}
          </p>
        )}

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "建立中…" : "建立預約"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
