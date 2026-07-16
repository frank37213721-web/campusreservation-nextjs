import Link from "next/link";
import {
  Building2,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
  Undo2,
} from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import type { CurrentProfile } from "@/lib/auth";

export function Sidebar({
  schoolSlug,
  schoolName,
  lang,
  profile,
}: {
  schoolSlug: string;
  schoolName: string;
  lang: Lang;
  profile: CurrentProfile | null;
}) {
  const base = `/${schoolSlug}`;
  const role = profile?.role;

  const navGroups: { label: string; href: string; icon: typeof CalendarDays }[] = [
    { label: t(lang, "nav_space_avail"), href: base, icon: CalendarDays },
  ];

  if (profile) {
    navGroups.push({ label: t(lang, "nav_make_reservation"), href: `${base}/dashboard`, icon: LayoutDashboard });
    navGroups.push({ label: t(lang, "nav_class_info"), href: `${base}/classrooms`, icon: Info });
    if (role === "ClassAdmin" || role === "SiteAdmin") {
      navGroups.push({ label: t(lang, "nav_bulk_res"), href: `${base}/bulk`, icon: CalendarRange });
      navGroups.push({ label: t(lang, "nav_review_reservations"), href: `${base}/admin`, icon: ClipboardList });
    }
    if (role === "SiteAdmin") {
      navGroups.push({ label: t(lang, "nav_manage_site"), href: `${base}/site-admin`, icon: Settings });
    }
  }

  return (
    <aside className="w-full shrink-0 border-b border-sidebar-border bg-sidebar md:w-[260px] md:border-r md:border-b-0">
      <div className="px-5 pt-10 pb-5">
        <div className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-[0.2rem] text-muted-foreground uppercase">
          <Building2 className="size-3.5" />
          CAMPUS
        </div>
        <div className="text-[1.1rem] leading-snug font-semibold tracking-tight text-foreground">
          {schoolName}
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {navGroups.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[0.9rem] text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <item.icon className="size-4 text-muted-foreground" />
            {item.label}
          </Link>
        ))}

        {profile ? (
          <form action={`${base}/logout`} method="post" className="px-3">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-[0.9rem] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-4" />
              {t(lang, "nav_logout")}
            </button>
          </form>
        ) : (
          <Link
            href={`${base}/login`}
            className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[0.9rem] text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogIn className="size-4 text-muted-foreground" />
            {t(lang, "nav_login_register")}
          </Link>
        )}
      </nav>

      <div className="mt-6 border-t border-sidebar-border px-5 pt-6">
        <div className="mb-3 text-[0.65rem] font-semibold tracking-[0.2rem] text-muted-foreground uppercase">
          LANGUAGE
        </div>
        <form action="/set-lang" method="post" className="flex gap-2">
          <input type="hidden" name="redirectTo" value={base} />
          <button
            type="submit"
            name="lang"
            value="zh"
            className={`flex-1 rounded-md border px-3 py-1.5 text-[0.75rem] font-medium tracking-wide transition-colors ${
              lang === "zh"
                ? "border-primary/30 bg-secondary text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            繁體中文
          </button>
          <button
            type="submit"
            name="lang"
            value="en"
            className={`flex-1 rounded-md border px-3 py-1.5 text-[0.75rem] font-medium tracking-wide transition-colors ${
              lang === "en"
                ? "border-primary/30 bg-secondary text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            English
          </button>
        </form>
      </div>

      <div className="sidebar-footer mt-6 px-5 pb-6">
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-center text-[0.8rem] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-sidebar-accent hover:text-primary"
        >
          <Undo2 className="size-3.5" />
          Change School
        </Link>
      </div>
    </aside>
  );
}
