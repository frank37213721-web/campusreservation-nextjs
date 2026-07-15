export type Lang = "en" | "zh";

export const translations = {
  en: {
    nav_public: "Public",
    nav_space_avail: "Space Availability",
    nav_account: "Account",
    nav_login_register: "Login / Register",
    nav_logout: "Logout",
    nav_user_dashboard: "User Dashboard (User)",
    nav_make_reservation: "Make a Reservation",
    nav_bulk_res: "Bulk Reservation (Admin)",
    nav_class_info: "Classroom Info",
    nav_admin_dashboard: "Admin Dashboard",
    nav_review_reservations: "Review Reservations",
    nav_site_admin: "Site Admin",
    nav_manage_site: "Manage Site",

    home_title: "Campus Spaces Overview",
    home_subtitle:
      "Browse current classroom availability and information. Please login to make a reservation.",
    home_filter: "📅 Filter by Classroom",
    home_all_classrooms: "All Classrooms",
    home_calendar_title: "Calendar",
    home_dir_title: "Classrooms Directory",
    home_reserved: "Reserved",
    home_no_classrooms: "No classrooms available yet.",

    login_title: "Login to your account",
    login_email: "Email",
    login_pwd: "Password",
    login_btn: "Login",
    login_success: "Login successful!",
    login_error: "Invalid credentials",
    login_verify_req: "Please verify your email before logging in.",
    register_title: "Register a new account",
    register_btn: "Register",
    register_success:
      "Registration successful! Please check your email to verify your account.",
    register_error: "Email already exists",
    verify_success: "Account verified successfully! You can now log in.",
    verify_invalid: "Invalid or expired verification token.",

    logout_title: "You have been logged out.",
    logout_btn: "Go to Login",

    user_title: "Make a Reservation",
    user_select_room: "Select Classroom",
    user_date: "Date",
    user_start: "Start Time",
    user_end: "End Time",
    user_submit: "Request Reservation",
    user_res_success: "Reservation requested! Waiting for admin approval.",
    user_my_res: "My Reservations",
    user_no_res: "You have no reservations.",

    admin_title: "Review Reservations",
    admin_no_pending: "No pending reservations to review.",
    admin_approve: "Approve",
    admin_reject: "Reject",
    admin_status_updated: "Reservation status updated.",

    site_title: "Site Administration",
    site_users: "All Users",
    site_classrooms: "All Classrooms",
  },
  zh: {
    nav_public: "公開資訊",
    nav_space_avail: "校園空間可用狀態總覽",
    nav_account: "帳號",
    nav_login_register: "登入 / 註冊",
    nav_logout: "登出",
    nav_user_dashboard: "一般預約",
    nav_make_reservation: "預約空間",
    nav_bulk_res: "大量預約",
    nav_class_info: "教室資訊",
    nav_admin_dashboard: "管理員面板",
    nav_review_reservations: "審核預約",
    nav_site_admin: "網站管理員",
    nav_manage_site: "網站管理",

    home_title: "校園空間可用狀態總覽",
    home_subtitle: "瀏覽當前教室的可用狀態與資訊。請登入以進行預約。",
    home_filter: "📅 依照教室篩選",
    home_all_classrooms: "所有教室",
    home_calendar_title: "日曆",
    home_dir_title: "教室資訊列表",
    home_reserved: "已預約",
    home_no_classrooms: "目前沒有可用的教室。",

    login_title: "登入帳號",
    login_email: "電子郵件",
    login_pwd: "密碼",
    login_btn: "登入",
    login_success: "登入成功！",
    login_error: "帳號或密碼錯誤",
    login_verify_req: "登入前請先驗證您的電子郵件信箱。",
    register_title: "註冊新帳號",
    register_btn: "註冊",
    register_success: "註冊成功！請檢查您的信箱以驗證帳號。",
    register_error: "此電子郵件已存在",
    verify_success: "帳號驗證成功！您現在可以登入。",
    verify_invalid: "無效或已過期的驗證碼。",

    logout_title: "您已登出。",
    logout_btn: "前往登入頁面",

    user_title: "預約空間",
    user_select_room: "選擇教室",
    user_date: "日期",
    user_start: "開始時間",
    user_end: "結束時間",
    user_submit: "提出預約申請",
    user_res_success: "已送出預約申請！請等待管理員審核。",
    user_my_res: "我的預約紀錄",
    user_no_res: "您目前沒有預約紀錄。",

    admin_title: "審核預約",
    admin_no_pending: "目前沒有待審核的預約。",
    admin_approve: "核准",
    admin_reject: "拒絕",
    admin_status_updated: "預約狀態已更新。",

    site_title: "網站系統管理",
    site_users: "所有使用者",
    site_classrooms: "所有教室",
  },
} as const satisfies Record<Lang, Record<string, string>>;

export type TranslationKey = keyof (typeof translations)["en"];

export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

export const LANG_COOKIE = "lang";

export function isLang(value: string | undefined | null): value is Lang {
  return value === "en" || value === "zh";
}
