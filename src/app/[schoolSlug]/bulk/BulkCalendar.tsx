"use client";

import { useCallback, useMemo, useState } from "react";
import { ReservationCalendar, type CalendarEvent } from "@/components/calendar/ReservationCalendar";
import { MultiDayDialog } from "@/components/calendar/MultiDayDialog";
import { RecurringDialog } from "@/components/calendar/RecurringDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, shortTime } from "@/lib/dates";

type ClassroomOption = { id: number; name: string; location: string | null };

type ReservationRow = {
  id: number;
  requestDate: string;
  startTime: string;
  endTime: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED";
  purpose: string | null;
  userName: string;
  userDept: string;
};

const STATUS_COLOR: Record<string, string> = {
  APPROVED: "var(--status-approved)",
  PENDING: "var(--status-pending)",
};

export function BulkCalendar({
  schoolSlug,
  schoolId,
  classrooms,
  defaultDepartment,
}: {
  schoolSlug: string;
  schoolId: number;
  classrooms: ClassroomOption[];
  defaultDepartment: string;
}) {
  const [classroomId, setClassroomId] = useState<number>(classrooms[0]?.id ?? 0);
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [visibleRange, setVisibleRange] = useState<{ from: string; to: string } | null>(null);

  const [multiDayRange, setMultiDayRange] = useState<{ start: string; end: string } | null>(null);
  const [multiDayOpen, setMultiDayOpen] = useState(false);

  const [recurringDate, setRecurringDate] = useState<string | null>(null);
  const [recurringOpen, setRecurringOpen] = useState(false);

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

  function refreshCurrentRange() {
    if (visibleRange) fetchRangeFor(classroomId, visibleRange.from, visibleRange.to);
  }

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
        title: `${shortTime(r.startTime)}-${shortTime(r.endTime)} | ${r.userName} (${r.userDept}) | ${r.purpose ?? ""}`,
        start: `${r.requestDate}T${r.startTime}`,
        end: `${r.requestDate}T${r.endTime}`,
        color: STATUS_COLOR[r.status],
      })),
    [rows]
  );

  function handleSelect(startStr: string, endStr: string) {
    const start = startStr.slice(0, 10);
    const rawEnd = endStr.slice(0, 10);
    // FullCalendar's select end date is exclusive.
    const adjustedEnd = rawEnd > start ? addDays(rawEnd, -1) : start;

    if (adjustedEnd === start) {
      setRecurringDate(start);
      setRecurringOpen(true);
    } else {
      setMultiDayRange({ start, end: adjustedEnd });
      setMultiDayOpen(true);
    }
  }

  function handleDateClick(dateStr: string) {
    setRecurringDate(dateStr);
    setRecurringOpen(true);
  }

  function handleCreated() {
    setMultiDayOpen(false);
    setRecurringOpen(false);
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
        selectable
        onDateClick={handleDateClick}
        onSelect={handleSelect}
        onRangeChange={fetchRange}
      />

      <MultiDayDialog
        schoolSlug={schoolSlug}
        schoolId={schoolId}
        classroomId={classroomId}
        range={multiDayRange}
        defaultDepartment={defaultDepartment}
        open={multiDayOpen}
        onOpenChange={setMultiDayOpen}
        onCreated={handleCreated}
      />

      <RecurringDialog
        schoolSlug={schoolSlug}
        schoolId={schoolId}
        classroomId={classroomId}
        date={recurringDate}
        defaultDepartment={defaultDepartment}
        open={recurringOpen}
        onOpenChange={setRecurringOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
