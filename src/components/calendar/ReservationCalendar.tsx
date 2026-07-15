"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg, DateSelectArg, DatesSetArg, EventInput } from "@fullcalendar/core";
import type { Lang } from "@/lib/i18n";

export type CalendarEvent = EventInput & {
  id?: string;
  title: string;
  start: string;
  end: string;
  color?: string;
  extendedProps?: Record<string, unknown>;
};

export function ReservationCalendar({
  events,
  lang,
  selectable = false,
  onDateClick,
  onEventClick,
  onSelect,
  onRangeChange,
}: {
  events: CalendarEvent[];
  lang: Lang;
  selectable?: boolean;
  onDateClick?: (dateStr: string) => void;
  onEventClick?: (arg: EventClickArg) => void;
  onSelect?: (startStr: string, endStr: string) => void;
  onRangeChange?: (startStr: string, endStr: string) => void;
}) {
  return (
    <div className="muji-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "today prev,next",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        timeZone="Asia/Taipei"
        locale={lang === "zh" ? "zh-tw" : "en"}
        events={events}
        selectable={selectable}
        dayMaxEvents={3}
        height="auto"
        select={
          onSelect
            ? (arg: DateSelectArg) => onSelect(arg.startStr, arg.endStr)
            : undefined
        }
        dateClick={
          onDateClick ? (arg: DateClickArg) => onDateClick(arg.dateStr) : undefined
        }
        eventClick={onEventClick}
        datesSet={
          onRangeChange
            ? (arg: DatesSetArg) => onRangeChange(arg.startStr, arg.endStr)
            : undefined
        }
      />
    </div>
  );
}
