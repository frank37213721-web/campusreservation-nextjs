import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  date,
  time,
  timestamp,
  primaryKey,
  index,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["User", "ClassAdmin", "SiteAdmin"]);
export const reservationStatusEnum = pgEnum("reservation_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 1:1 with Neon Auth (Stack Auth) user. `id` matches the Stack Auth user id.
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  department: text("department").notNull(),
  role: roleEnum("role").notNull().default("User"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const classrooms = pgTable(
  "classrooms",
  {
    id: serial("id").primaryKey(),
    schoolId: integer("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    accessMethod: text("access_method"),
    location: text("location"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("classrooms_school_id_idx").on(t.schoolId)]
);

// Replaces the old CSV `admin_id` column with a proper join table.
export const classroomAdmins = pgTable(
  "classroom_admins",
  {
    classroomId: integer("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.classroomId, t.profileId] }),
    index("classroom_admins_profile_id_idx").on(t.profileId),
  ]
);

export const reservations = pgTable(
  "reservations",
  {
    id: serial("id").primaryKey(),
    schoolId: integer("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    classroomId: integer("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    requestDate: date("request_date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    status: reservationStatusEnum("status").notNull().default("PENDING"),
    purpose: text("purpose"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reservations_school_date_idx").on(t.schoolId, t.requestDate),
    index("reservations_classroom_date_idx").on(t.classroomId, t.requestDate),
    index("reservations_user_id_idx").on(t.userId),
    index("reservations_school_status_idx").on(t.schoolId, t.status),
    check("reservations_end_after_start", sql`${t.endTime} > ${t.startTime}`),
  ]
);

export const schoolsRelations = relations(schools, ({ many }) => ({
  classrooms: many(classrooms),
  reservations: many(reservations),
}));

export const profilesRelations = relations(profiles, ({ many }) => ({
  reservations: many(reservations),
  classroomAdmins: many(classroomAdmins),
}));

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  school: one(schools, { fields: [classrooms.schoolId], references: [schools.id] }),
  admins: many(classroomAdmins),
  reservations: many(reservations),
}));

export const classroomAdminsRelations = relations(classroomAdmins, ({ one }) => ({
  classroom: one(classrooms, {
    fields: [classroomAdmins.classroomId],
    references: [classrooms.id],
  }),
  profile: one(profiles, {
    fields: [classroomAdmins.profileId],
    references: [profiles.id],
  }),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  school: one(schools, { fields: [reservations.schoolId], references: [schools.id] }),
  classroom: one(classrooms, {
    fields: [reservations.classroomId],
    references: [classrooms.id],
  }),
  user: one(profiles, { fields: [reservations.userId], references: [profiles.id] }),
}));
