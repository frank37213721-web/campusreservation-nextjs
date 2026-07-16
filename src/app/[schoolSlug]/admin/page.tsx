import { notFound } from "next/navigation";
import { Check, ClipboardCheck, Inbox, X } from "lucide-react";
import { getSchoolBySlug } from "@/db/queries/schools";
import { classroomIdsManagedBy } from "@/db/queries/classrooms";
import { getActionedReservations, getPendingReservations } from "@/db/queries/reservations";
import { requireRole } from "@/lib/auth";
import { setReservationStatus } from "@/actions/reservations";
import { shortTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  const profile = await requireRole(schoolSlug, ["ClassAdmin", "SiteAdmin"]);
  const classroomIds =
    profile.role === "SiteAdmin" ? undefined : await classroomIdsManagedBy(profile.id);

  const [pending, actioned] = await Promise.all([
    getPendingReservations(school.id, classroomIds),
    getActionedReservations(school.id, classroomIds),
  ]);

  const statusDotClass: Record<string, string> = {
    APPROVED: "bg-status-approved",
    REJECTED: "bg-destructive",
    CANCELLED: "bg-muted-foreground",
  };

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="mb-2 flex items-center gap-2 page-heading">
        <ClipboardCheck className="size-6 text-primary" />
        管理員面板
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">審核預約</p>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
          <Inbox className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">目前沒有待審核的預約。</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
          {pending.map((req) => (
            <div
              key={req.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-muted/40"
            >
              <div className="text-sm">
                <div className="font-medium">
                  {req.userEmail} — {req.classroomName}
                </div>
                <div className="text-muted-foreground">
                  {req.requestDate} {shortTime(req.startTime)} - {shortTime(req.endTime)} |{" "}
                  {req.purpose}
                </div>
              </div>
              <div className="flex gap-2">
                <form action={async () => {
                  "use server";
                  await setReservationStatus(schoolSlug, req.id, "APPROVED");
                }}>
                  <Button type="submit" size="sm">
                    <Check className="size-4" />
                    核准
                  </Button>
                </form>
                <form action={async () => {
                  "use server";
                  await setReservationStatus(schoolSlug, req.id, "REJECTED");
                }}>
                  <Button type="submit" size="sm" variant="destructive">
                    <X className="size-4" />
                    拒絕
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <hr className="my-8 border-border" />
      <h2 className="mb-4 muji-label">已處理的申請</h2>
      {actioned.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無已處理的申請。</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {actioned.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40">
              <span className={`size-1.5 shrink-0 rounded-full ${statusDotClass[r.status]}`} />
              {r.classroomName} — {r.requestDate} (
              {shortTime(r.startTime)} - {shortTime(r.endTime)}) :{" "}
              <span className="font-medium">{r.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
