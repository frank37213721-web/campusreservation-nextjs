"use client";

import { useCallback, useMemo, useState } from "react";
import type { EventClickArg } from "@fullcalendar/core";
import { ReservationCalendar, type CalendarEvent } from "@/components/calendar/ReservationCalendar";
import { DayDetailDialog, type PublicReservationRow } from "@/components/calendar/DayDetailDialog";
import { t, type Lang } from "@/lib/i18n";

type ClassroomInfo = {
  id: number;
  name: string;
  location: string | null;
  description: string | null;
  accessMethod: string | null;
};

type ReservationApiRow = {
  id: number;
  classroomId: number;
  classroomName: string;
  requestDate: string;
  startTime: string;
  endTime: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED";
  purpose?: string;
  userName?: string;
  userDept?: string;
};

const STATUS_COLOR: Record<string, string> = {
  APPROVED: "var(--status-approved)",
  PENDING: "var(--status-pending)",
};

export function HomeView({
  schoolSlug,
  lang,
  classrooms,
  isAuthenticated,
}: {
  schoolSlug: string;
  lang: Lang;
  classrooms: ClassroomInfo[];
  isAuthenticated: boolean;
}) {
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | "all">("all");
  const [rows, setRows] = useState<ReservationApiRow[]>([]);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchRange = useCallback(
    async (startStr: string, endStr: string) => {
      const from = startStr.slice(0, 10);
      const to = endStr.slice(0, 10);
      const res = await fetch(`/${schoolSlug}/api/reservations?from=${from}&to=${to}`);
      if (!res.ok) return;
      const data = await res.json();
      setRows(data.reservations ?? []);
    },
    [schoolSlug]
  );

  const filteredRows = useMemo(
    () =>
      selectedClassroomId === "all"
        ? rows
        : rows.filter((r) => r.classroomId === selectedClassroomId),
    [rows, selectedClassroomId]
  );

  const events: CalendarEvent[] = useMemo(
    () =>
      filteredRows.map((r) => ({
        id: String(r.id),
        title: `${r.status === "APPROVED" ? "🟢" : "🟡"} ${t(lang, "home_reserved")}: ${r.classroomName}`,
        start: `${r.requestDate}T${r.startTime}`,
        end: `${r.requestDate}T${r.endTime}`,
        color: STATUS_COLOR[r.status],
      })),
    [filteredRows, lang]
  );

  const activeDateRows: PublicReservationRow[] = useMemo(() => {
    if (!activeDate) return [];
    return filteredRows.filter((r) => r.requestDate === activeDate);
  }, [filteredRows, activeDate]);

  function openDay(dateStr: string) {
    setActiveDate(dateStr);
    setDialogOpen(true);
  }

  function handleEventClick(arg: EventClickArg) {
    const start = arg.event.startStr;
    openDay(start.slice(0, 10));
  }

  const displayClassrooms =
    selectedClassroomId === "all"
      ? classrooms
      : classrooms.filter((c) => c.id === selectedClassroomId);

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="mb-2 text-xl font-medium tracking-wide">{t(lang, "home_title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t(lang, "home_subtitle")}</p>

      <div className="mb-4 max-w-xs">
        <label className="muji-label mb-2 block">{t(lang, "home_filter")}</label>
        <select
          className="w-full border border-input bg-transparent px-3 py-2 text-sm"
          value={selectedClassroomId}
          onChange={(e) =>
            setSelectedClassroomId(e.target.value === "all" ? "all" : Number(e.target.value))
          }
        >
          <option value="all">{t(lang, "home_all_classrooms")}</option>
          {classrooms.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <h2 className="muji-label mb-3">{t(lang, "home_calendar_title")}</h2>
      <ReservationCalendar
        events={events}
        lang={lang}
        onDateClick={openDay}
        onEventClick={handleEventClick}
        onRangeChange={fetchRange}
      />

      <DayDetailDialog
        date={activeDate}
        rows={activeDateRows}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        showPii={isAuthenticated}
      />

      <hr className="my-8 border-border" />
      <h2 className="muji-label mb-4">{t(lang, "home_dir_title")}</h2>
      {displayClassrooms.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t(lang, "home_no_classrooms")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {displayClassrooms.map((room) => (
            <div key={room.id} className="border-b border-border pb-4">
              <div className="mb-1 font-medium">{room.name}</div>
              <div className="mb-1 text-sm text-muted-foreground">📍 {room.location}</div>
              <div className="mb-1 text-sm italic text-muted-foreground">{room.description}</div>
              <div className="text-sm text-muted-foreground">🔑 {room.accessMethod}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
