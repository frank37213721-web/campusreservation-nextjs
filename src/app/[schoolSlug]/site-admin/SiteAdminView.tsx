"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { updateUserRole } from "@/actions/profiles";
import { createClassroom, updateClassroomAdmins } from "@/actions/classrooms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const ROLES = ["User", "ClassAdmin", "SiteAdmin"] as const;

type UserRow = {
  id: string;
  email: string;
  fullName: string;
  department: string;
  role: (typeof ROLES)[number];
};

type ClassroomRow = {
  id: number;
  name: string;
  location: string | null;
};

export function SiteAdminView({
  schoolSlug,
  schoolId,
  users,
  classrooms,
  adminMap,
}: {
  schoolSlug: string;
  schoolId: number;
  users: UserRow[];
  classrooms: ClassroomRow[];
  adminMap: Record<number, string[]>;
}) {
  const router = useRouter();

  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList>
        <TabsTrigger value="users">權限與使用者管理</TabsTrigger>
        <TabsTrigger value="classrooms">教室與管理員設定</TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="flex flex-col gap-2 pt-4">
        {users.map((u) => (
          <UserRoleRow key={u.id} schoolSlug={schoolSlug} user={u} onSaved={() => router.refresh()} />
        ))}
      </TabsContent>

      <TabsContent value="classrooms" className="flex flex-col gap-8 pt-4">
        <NewClassroomForm
          schoolSlug={schoolSlug}
          schoolId={schoolId}
          onCreated={() => router.refresh()}
        />

        <div className="flex flex-col gap-4">
          <h3 className="muji-label">指派教室管理員</h3>
          {classrooms.map((c) => (
            <ClassroomAdminRow
              key={c.id}
              schoolSlug={schoolSlug}
              classroom={c}
              classAdmins={users.filter((u) => u.role !== "User")}
              currentAdminIds={adminMap[c.id] ?? []}
              onSaved={() => router.refresh()}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function UserRoleRow({
  schoolSlug,
  user,
  onSaved,
}: {
  schoolSlug: string;
  user: UserRow;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<(typeof ROLES)[number]>(user.role);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateUserRole(schoolSlug, user.id, role);
      onSaved();
    });
  }

  return (
    <details className="overflow-hidden rounded-lg border border-border bg-card">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
        {user.fullName} ({user.email}) — {user.department}
      </summary>
      <div className="flex items-end gap-3 px-4 pb-4">
        <div className="w-48">
          <Label className="mb-2 block">角色</Label>
          <Select value={role} onValueChange={(v) => v && setRole(v as (typeof ROLES)[number])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSave} disabled={pending}>
          {pending ? "更新中…" : "更新角色"}
        </Button>
      </div>
    </details>
  );
}

function ClassroomAdminRow({
  schoolSlug,
  classroom,
  classAdmins,
  currentAdminIds,
  onSaved,
}: {
  schoolSlug: string;
  classroom: ClassroomRow;
  classAdmins: UserRow[];
  currentAdminIds: string[];
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentAdminIds));
  const [pending, startTransition] = useTransition();

  const adminNames = classAdmins
    .filter((a) => currentAdminIds.includes(a.id))
    .map((a) => a.fullName)
    .join("、");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      await updateClassroomAdmins(schoolSlug, classroom.id, [...selected]);
      onSaved();
    });
  }

  return (
    <details className="overflow-hidden rounded-lg border border-border bg-card">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
        {classroom.name} ({classroom.location}) — 管理員：{adminNames || "尚未指派"}
      </summary>
      <div className="flex flex-col gap-2 px-4 pb-4">
        {classAdmins.length === 0 ? (
          <p className="text-sm text-muted-foreground">目前沒有 ClassAdmin/SiteAdmin 使用者。</p>
        ) : (
          classAdmins.map((a) => (
            <label key={a.id} className="flex items-center gap-2 text-sm">
              <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggle(a.id)} />
              {a.fullName} ({a.department})
            </label>
          ))
        )}
        <Button className="mt-2 w-fit" onClick={handleSave} disabled={pending}>
          {pending ? "儲存中…" : "儲存管理者設定"}
        </Button>
      </div>
    </details>
  );
}

function NewClassroomForm({
  schoolSlug,
  schoolId,
  onCreated,
}: {
  schoolSlug: string;
  schoolId: number;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [accessMethod, setAccessMethod] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!name) {
      setMessage("請輸入教室名稱");
      return;
    }
    startTransition(async () => {
      const result = await createClassroom(schoolSlug, schoolId, {
        name,
        location,
        description,
        accessMethod,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("教室建立成功！");
      setName("");
      setLocation("");
      setDescription("");
      setAccessMethod("");
      onCreated();
    });
  }

  return (
    <details className="overflow-hidden rounded-lg border border-border bg-card">
      <summary className="cursor-pointer list-none px-4 py-3 muji-label transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
        建立新教室
      </summary>
      <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4 px-4 pb-4">
        <Input placeholder="教室名稱" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="位置" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Textarea placeholder="描述" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input placeholder="門禁方式" value={accessMethod} onChange={(e) => setAccessMethod(e.target.value)} />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "建立中…" : "建立"}
        </Button>
      </form>
    </details>
  );
}
