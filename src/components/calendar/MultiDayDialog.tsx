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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PURPOSE_OPTIONS } from "@/lib/dates";
import { createBulkMultiDayReservations } from "@/actions/reservations";

export function MultiDayDialog({
  schoolSlug,
  schoolId,
  classroomId,
  range,
  defaultDepartment,
  open,
  onOpenChange,
  onCreated,
}: {
  schoolSlug: string;
  schoolId: number;
  classroomId: number;
  range: { start: string; end: string } | null;
  defaultDepartment: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [department, setDepartment] = useState(defaultDepartment);
  const [purpose, setPurpose] = useState<string>(PURPOSE_OPTIONS[0]);
  const [weekdaysOnly, setWeekdaysOnly] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!range) return;
    setMessage(null);
    startTransition(async () => {
      const result = await createBulkMultiDayReservations(schoolSlug, schoolId, {
        classroomId,
        startDate: range.start,
        endDate: range.end,
        department,
        purpose,
        weekdaysOnly,
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
          <DialogTitle>跨日預約申請 (多天拖曳)</DialogTitle>
        </DialogHeader>

        <p className="text-sm">
          預約區間：<span className="font-medium">{range?.start}</span> 至{" "}
          <span className="font-medium">{range?.end}</span>
        </p>

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

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={weekdaysOnly} onCheckedChange={(v) => setWeekdaysOnly(!!v)} />
          僅限平日 (週一至週五)
        </label>

        {message && (
          <p className={message.type === "success" ? "text-sm text-status-approved" : "text-sm text-destructive"}>
            {message.text}
          </p>
        )}

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "建立中…" : "建立跨日預約"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
