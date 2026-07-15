import { notFound } from "next/navigation";
import { getSchoolBySlug } from "@/db/queries/schools";
import { classroomIdsManagedBy } from "@/db/queries/classrooms";
import { getActionedReservations, getPendingReservations } from "@/db/queries/reservations";
import { requireRole } from "@/lib/auth";
import { setReservationStatus } from "@/actions/reservations";
import { shortTime } from "@/lib/dates";

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

  const statusLabel: Record<string, string> = {
    APPROVED: "🟢",
    REJECTED: "🔴",
    CANCELLED: "🔴",
  };

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="mb-2 text-xl font-medium tracking-wide">📋 管理員面板</h1>
      <p className="mb-6 text-sm text-muted-foreground">審核預約</p>

      {pending.length === 0 ? (
        <p className="text-sm text-emerald-700">目前沒有待審核的預約。</p>
      ) : (
        <div className="flex flex-col divide-y divide-border border-y border-border">
          {pending.map((req) => (
            <div key={req.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
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
                  <button
                    type="submit"
                    className="border border-input px-3 py-1.5 text-sm text-emerald-700 hover:bg-secondary"
                  >
                    ✅ 核准
                  </button>
                </form>
                <form action={async () => {
                  "use server";
                  await setReservationStatus(schoolSlug, req.id, "REJECTED");
                }}>
                  <button
                    type="submit"
                    className="border border-input px-3 py-1.5 text-sm text-destructive hover:bg-secondary"
                  >
                    ❌ 拒絕
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <hr className="my-8 border-border" />
      <h2 className="muji-label mb-4">已處理的申請</h2>
      {actioned.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無已處理的申請。</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {actioned.map((r) => (
            <li key={r.id}>
              {statusLabel[r.status]} {r.classroomName} — {r.requestDate} (
              {shortTime(r.startTime)} - {shortTime(r.endTime)}) :{" "}
              <span className="font-medium">{r.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
