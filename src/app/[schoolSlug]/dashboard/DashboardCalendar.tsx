"use client";

import { useCallback, useMemo, useState } from "react";
import type { EventClickArg } from "@fullcalendar/core";
import { ReservationCalendar, type CalendarEvent } from "@/components/calendar/ReservationCalendar";
import { NewBookingDialog } from "@/components/calendar/NewBookingDialog";
import { EventDetailDialog, type EventDetail } from "@/components/calendar/EventDetailDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shortTime } from "@/lib/dates";

type ClassroomOption = { id: number; name: string; location: string | null };

type ReservationRow = {
  id: number;
  requestDate: string;
  startTime: string;
  endTime: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED";
  purpose: string | null;
  userId: string;
  userName: string;
  userDept: string;
};

type MyReservationRow = {
  id: number;
  classroomId: number;
  classroomName: string;
  requestDate: string;
  startTime: string;
  endTime: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED";
  purpose: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  APPROVED: "var(--status-approved)",
  PENDING: "var(--status-pending)",
};

export function DashboardCalendar({
  schoolSlug,
  schoolId,
  currentUserId,
  classrooms,
  initialMyReservations,
}: {
  schoolSlug: string;
  schoolId: number;
  currentUserId: string;
  classrooms: ClassroomOption[];
  initialMyReservations: MyReservationRow[];
}) {
  const [classroomId, setClassroomId] = useState<number>(classrooms[0]?.id ?? 0);
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [myReservations, setMyReservations] = useState(initialMyReservations);
  const [visibleRange, setVisibleRange] = useState<{ from: string; to: string } | null>(null);

  const [newBookingDate, setNewBookingDate] = useState<string | null>(null);
  const [newBookingOpen, setNewBookingOpen] = useState(false);

  const [activeDetail, setActiveDetail] = useState<EventDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const selectedRoom = classrooms.find((c) => c.id === classroomId);

  const refreshMyReservations = useCallback(async () => {
    const res = await fetch(`/${schoolSlug}/api/my-reservations`);
    if (!res.ok) return;
    const data = await res.json();
    setMyReservations(data.reservations ?? []);
  }, [schoolSlug]);

  const fetchRangeFor = useCallback(
    async (cid: number, startStr: string, endStr: string) => {
      if (!cid) return;
      const from = startStr.slice(0, 10);
      const to = endStr.slice(0, 10);
      setVisibleRange({ from, to });
      const res = await fetch(
        `/${schoolSlug}/api/classroom-reservations?classroomId=${cid}&from=${from}&to=${to}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setRows(data.reservations ?? []);
    },
    [schoolSlug]
  );

  const fetchRange = useCallback(
    (startStr: string, endStr: string) => fetchRangeFor(classroomId, startStr, endStr),
    [fetchRangeFor, classroomId]
  );

  const refreshCurrentRange = useCallback(() => {
    if (visibleRange) fetchRangeFor(classroomId, visibleRange.from, visibleRange.to);
  }, [visibleRange, fetchRangeFor, classroomId]);

  // The FullCalendar instance stays mounted when the classroom picker changes, so
  // `datesSet` (which only fires on view/navigation changes) won't refire on its
  // own — explicitly refetch the already-visible range for the newly selected room.
  function handleClassroomChange(id: number) {
    setClassroomId(id);
    if (visibleRange) fetchRangeFor(id, visibleRange.from, visibleRange.to);
  }

  const events: CalendarEvent[] = useMemo(
    () =>
      rows.map((r) => ({
        id: String(r.id),
        title: `${shortTime(r.startTime)}-${shortTime(r.endTime)} | ${r.userName} | ${r.purpose ?? ""}`,
        start: `${r.requestDate}T${r.startTime}`,
        end: `${r.requestDate}T${r.endTime}`,
        color: STATUS_COLOR[r.status],
      })),
    [rows]
  );

  function handleDateClick(dateStr: string) {
    setNewBookingDate(dateStr);
    setNewBookingOpen(true);
  }

  function handleEventClick(arg: EventClickArg) {
    const id = Number(arg.event.id);
    const row = rows.find((r) => r.id === id);
    if (!row || !selectedRoom) return;
    setActiveDetail({
      id: row.id,
      classroomName: selectedRoom.name,
      requestDate: row.requestDate,
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status,
      purpose: row.purpose ?? "",
      userName: row.userName,
      userDept: row.userDept,
      isOwner: row.userId === currentUserId,
    });
    setDetailOpen(true);
  }

  function handleChanged() {
    refreshMyReservations();
    refreshCurrentRange();
  }

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <label className="muji-label mb-2 block">選擇教室</label>
        <Select value={String(classroomId)} onValueChange={(v) => v && handleClassroomChange(Number(v))}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {classrooms.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name} ({c.location})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ReservationCalendar
        events={events}
        lang="zh"
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
        onRangeChange={fetchRange}
      />

      <NewBookingDialog
        schoolSlug={schoolSlug}
        schoolId={schoolId}
        classroomId={classroomId}
        date={newBookingDate}
        open={newBookingOpen}
        onOpenChange={setNewBookingOpen}
        onCreated={handleChanged}
      />

      <EventDetailDialog
        key={activeDetail?.id ?? "none"}
        schoolSlug={schoolSlug}
        detail={activeDetail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onChanged={handleChanged}
      />

      <hr className="my-8 border-border" />
      <h2 className="muji-label mb-4">我的預約紀錄</h2>
      {myReservations.length === 0 ? (
        <p className="text-sm text-muted-foreground">目前尚無預約紀錄。</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {myReservations.map((r) => (
            <li key={r.id}>
              {r.status === "APPROVED" ? "🟢" : r.status === "PENDING" ? "🟡" : "🔴"}{" "}
              <span className="font-medium">{r.classroomName}</span> : {r.requestDate}{" "}
              {shortTime(r.startTime)}~{shortTime(r.endTime)} | {r.purpose} →{" "}
              <span className="font-medium">{r.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
