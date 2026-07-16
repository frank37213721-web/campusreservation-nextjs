"use client";

import { useState, useTransition } from "react";
import { Save, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PURPOSE_OPTIONS, shortTime, TIME_SLOTS } from "@/lib/dates";
import { cancelReservation, updateReservation } from "@/actions/reservations";

export type EventDetail = {
  id: number;
  classroomName: string;
  requestDate: string;
  startTime: string;
  endTime: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED";
  purpose: string;
  userName: string;
  userDept: string;
  isOwner: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "已核准",
  PENDING: "審核中",
  CANCELLED: "已取消",
  REJECTED: "已拒絕",
};

const STATUS_DOT: Record<string, string> = {
  APPROVED: "bg-status-approved",
  PENDING: "bg-status-pending",
  CANCELLED: "bg-muted-foreground",
  REJECTED: "bg-destructive",
};

export function EventDetailDialog({
  schoolSlug,
  detail,
  open,
  onOpenChange,
  onChanged,
}: {
  schoolSlug: string;
  detail: EventDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [startTime, setStartTime] = useState<string>(detail?.startTime.slice(0, 5) ?? TIME_SLOTS[0]);
  const [endTime, setEndTime] = useState<string>(detail?.endTime.slice(0, 5) ?? TIME_SLOTS[1]);
  const [purpose, setPurpose] = useState<string>(detail?.purpose ?? PURPOSE_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!detail) return null;

  const canEdit = detail.isOwner && detail.status === "PENDING";

  function handleSave() {
    if (!detail) return;
    setError(null);
    startTransition(async () => {
      const result = await updateReservation(schoolSlug, detail.id, {
        startTime: startTime as (typeof TIME_SLOTS)[number],
        endTime: endTime as (typeof TIME_SLOTS)[number],
        purpose,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      onChanged();
    });
  }

  function handleCancel() {
    if (!detail) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelReservation(schoolSlug, detail.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      onChanged();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>預約詳情</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <span className="text-muted-foreground">狀態</span>
          <span className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${STATUS_DOT[detail.status]}`} />
            {STATUS_LABEL[detail.status]}
          </span>
          <span className="text-muted-foreground">教室</span>
          <span>{detail.classroomName}</span>
          <span className="text-muted-foreground">日期</span>
          <span>{detail.requestDate}</span>
          <span className="text-muted-foreground">時間</span>
          <span>
            {shortTime(detail.startTime)} - {shortTime(detail.endTime)}
          </span>
          <span className="text-muted-foreground">用途</span>
          <span>{detail.purpose || "—"}</span>
          <span className="text-muted-foreground">預約者</span>
          <span>
            {detail.userName || "—"} ({detail.userDept || "—"})
          </span>
        </div>

        {canEdit && (
          <>
            <hr className="border-border" />
            <p className="muji-label">修改預約</p>
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

            <DialogFooter className="gap-2">
              <Button variant="secondary" onClick={handleCancel} disabled={pending}>
                <Trash2 className="size-4" />
                取消此預約
              </Button>
              <Button onClick={handleSave} disabled={pending}>
                <Save className="size-4" />
                儲存修改
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
