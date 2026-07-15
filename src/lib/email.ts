import "server-only";
import { Resend } from "resend";
import { shortTime } from "@/lib/dates";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "空間借用系統 <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    return !error;
  } catch (err) {
    console.error("[Email Error]", err);
    return false;
  }
}

export type ReservationEmailInfo = {
  classroomName: string;
  requestDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  userName: string;
  userDept: string;
};

/** Notifies all admins of a classroom about a new pending reservation. Never blocks the caller on failure. */
export async function notifyAdminsNewReservation(
  reservation: ReservationEmailInfo,
  adminEmails: string[]
): Promise<boolean> {
  if (adminEmails.length === 0) return false;

  const subject = `【空間借用通知】新預約申請 - ${reservation.classroomName} ${reservation.requestDate}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
      <h2 style="color: #2c3e50;">📋 新的空間借用申請</h2>
      <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
        <tr style="background:#f8f9fa">
          <td style="padding:10px 16px; font-weight:bold; width:30%;">教室</td>
          <td style="padding:10px 16px;">${reservation.classroomName}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px; font-weight:bold;">日期</td>
          <td style="padding:10px 16px;">${reservation.requestDate}</td>
        </tr>
        <tr style="background:#f8f9fa">
          <td style="padding:10px 16px; font-weight:bold;">時間</td>
          <td style="padding:10px 16px;">${shortTime(reservation.startTime)} - ${shortTime(reservation.endTime)}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px; font-weight:bold;">預約者</td>
          <td style="padding:10px 16px;">${reservation.userName || "—"}</td>
        </tr>
        <tr style="background:#f8f9fa">
          <td style="padding:10px 16px; font-weight:bold;">處室或科別</td>
          <td style="padding:10px 16px;">${reservation.userDept || "—"}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px; font-weight:bold;">用途</td>
          <td style="padding:10px 16px;">${reservation.purpose || "—"}</td>
        </tr>
      </table>
      <p style="margin-top:24px; color:#666;">請登入系統進行審核。</p>
    </div>
  `;

  const results = await Promise.all(
    adminEmails.filter(Boolean).map((email) => sendEmail(email, subject, html))
  );
  return results.every(Boolean);
}
