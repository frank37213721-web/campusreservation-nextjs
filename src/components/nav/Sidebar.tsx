import Link from "next/link";
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

  const navGroups: { label: string; href: string }[] = [
    { label: t(lang, "nav_space_avail"), href: base },
  ];

  if (profile) {
    navGroups.push({ label: t(lang, "nav_make_reservation"), href: `${base}/dashboard` });
    navGroups.push({ label: t(lang, "nav_class_info"), href: `${base}/classrooms` });
    if (role === "ClassAdmin" || role === "SiteAdmin") {
      navGroups.push({ label: t(lang, "nav_bulk_res"), href: `${base}/bulk` });
      navGroups.push({ label: t(lang, "nav_review_reservations"), href: `${base}/admin` });
    }
    if (role === "SiteAdmin") {
      navGroups.push({ label: t(lang, "nav_manage_site"), href: `${base}/site-admin` });
    }
  }

  return (
    <aside className="w-full shrink-0 border-b border-sidebar-border bg-sidebar md:w-[260px] md:border-r md:border-b-0">
      <div className="px-5 pt-10 pb-5">
        <div className="muji-label mb-3">CAMPUS</div>
        <div className="text-[1.1rem] font-medium leading-snug tracking-wide text-foreground">
          {schoolName}
        </div>
      </div>
      <hr className="mx-5 mb-5 border-sidebar-border" />

      <nav className="flex flex-col">
        {navGroups.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-5 py-3 text-[0.95rem] text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {item.label}
          </Link>
        ))}

        {profile ? (
          <form action={`${base}/logout`} method="post" className="px-5 py-3">
            <button
              type="submit"
              className="text-[0.95rem] text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground"
            >
              {t(lang, "nav_logout")}
            </button>
          </form>
        ) : (
          <Link
            href={`${base}/login`}
            className="px-5 py-3 text-[0.95rem] text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {t(lang, "nav_login_register")}
          </Link>
        )}
      </nav>

      <div className="mt-8 px-5">
        <div className="muji-label mb-3">LANGUAGE</div>
        <form action="/set-lang" method="post" className="flex gap-2">
          <input type="hidden" name="redirectTo" value={base} />
          <button
            type="submit"
            name="lang"
            value="zh"
            className={`flex-1 border border-input px-3 py-2 text-[0.75rem] uppercase tracking-wide ${
              lang === "zh" ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            繁體中文
          </button>
          <button
            type="submit"
            name="lang"
            value="en"
            className={`flex-1 border border-input px-3 py-2 text-[0.75rem] uppercase tracking-wide ${
              lang === "en" ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            English
          </button>
        </form>
      </div>

      <div className="sidebar-footer mt-10 px-5">
        <Link
          href="/"
          className="block w-full border border-input px-3 py-2 text-center text-[0.8rem] uppercase tracking-wide text-muted-foreground transition-colors hover:border-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
        >
          ↩ Change School
        </Link>
      </div>
    </aside>
  );
}
