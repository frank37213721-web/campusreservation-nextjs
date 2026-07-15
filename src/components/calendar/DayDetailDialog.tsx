"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { shortTime } from "@/lib/dates";

export type PublicReservationRow = {
  id: number;
  classroomName: string;
  startTime: string;
  endTime: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED";
  purpose?: string;
  userName?: string;
  userDept?: string;
};

export function DayDetailDialog({
  date,
  rows,
  open,
  onOpenChange,
  showPii,
}: {
  date: string | null;
  rows: PublicReservationRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showPii: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>預約詳細資訊 — {date}</DialogTitle>
        </DialogHeader>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">這天目前沒有符合條件的預約。</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {rows.map((r) => (
              <div key={r.id} className="py-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <span>{r.status === "APPROVED" ? "🟢" : "🟡"}</span>
                  <span className="font-medium">
                    {shortTime(r.startTime)} - {shortTime(r.endTime)}
                  </span>
                  <span className="text-muted-foreground">
                    {r.status === "APPROVED" ? "已核准" : "審核中"}
                  </span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted-foreground">
                  <span>🏫 教室</span>
                  <span>{r.classroomName}</span>
                  {showPii && (
                    <>
                      <span>👤 預約者</span>
                      <span>{r.userName || "—"}</span>
                      <span>🏢 處室或科別</span>
                      <span>{r.userDept || "—"}</span>
                      <span>📋 用途</span>
                      <span>{r.purpose || "—"}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
