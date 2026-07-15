"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClassroom, updateClassroom } from "@/actions/classrooms";

type ClassroomRow = {
  id: number;
  name: string;
  location: string | null;
  description: string | null;
  accessMethod: string | null;
};

type ClassAdminOption = { id: string; fullName: string; department: string };

export function ClassroomsView({
  schoolSlug,
  schoolId,
  myClassrooms,
  isSiteAdmin,
  classAdmins,
}: {
  schoolSlug: string;
  schoolId: number;
  myClassrooms: ClassroomRow[];
  isSiteAdmin: boolean;
  classAdmins: ClassAdminOption[];
}) {
  const router = useRouter();

  return (
    <Tabs defaultValue="edit" className="w-full">
      <TabsList>
        <TabsTrigger value="edit">編輯現有教室</TabsTrigger>
        <TabsTrigger value="add">新增教室</TabsTrigger>
      </TabsList>

      <TabsContent value="edit" className="pt-4">
        {myClassrooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">您目前沒有管理的教室。</p>
        ) : (
          <EditClassroomForm
            schoolSlug={schoolSlug}
            classrooms={myClassrooms}
            onSaved={() => router.refresh()}
          />
        )}
      </TabsContent>

      <TabsContent value="add" className="pt-4">
        <AddClassroomForm
          schoolSlug={schoolSlug}
          schoolId={schoolId}
          isSiteAdmin={isSiteAdmin}
          classAdmins={classAdmins}
          onCreated={() => router.refresh()}
        />
      </TabsContent>
    </Tabs>
  );
}

function EditClassroomForm({
  schoolSlug,
  classrooms,
  onSaved,
}: {
  schoolSlug: string;
  classrooms: ClassroomRow[];
  onSaved: () => void;
}) {
  const [selectedId, setSelectedId] = useState<number>(classrooms[0]?.id);
  const room = classrooms.find((c) => c.id === selectedId) ?? classrooms[0];

  const [name, setName] = useState(room?.name ?? "");
  const [location, setLocation] = useState(room?.location ?? "");
  const [description, setDescription] = useState(room?.description ?? "");
  const [accessMethod, setAccessMethod] = useState(room?.accessMethod ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function selectRoom(id: number) {
    const r = classrooms.find((c) => c.id === id);
    if (!r) return;
    setSelectedId(id);
    setName(r.name);
    setLocation(r.location ?? "");
    setDescription(r.description ?? "");
    setAccessMethod(r.accessMethod ?? "");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateClassroom(schoolSlug, selectedId, {
        name,
        location,
        description,
        accessMethod,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <div>
        <Label className="mb-2 block">選擇教室</Label>
        <Select value={String(selectedId)} onValueChange={(v) => v && selectRoom(Number(v))}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {classrooms.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name} ({c.location})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label className="mb-2 block">名稱</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label className="mb-2 block">位置</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
        <div>
          <Label className="mb-2 block">描述</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label className="mb-2 block">門禁方式</Label>
          <Input value={accessMethod} onChange={(e) => setAccessMethod(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "儲存中…" : "更新教室"}
        </Button>
      </form>
    </div>
  );
}

function AddClassroomForm({
  schoolSlug,
  schoolId,
  isSiteAdmin,
  classAdmins,
  onCreated,
}: {
  schoolSlug: string;
  schoolId: number;
  isSiteAdmin: boolean;
  classAdmins: ClassAdminOption[];
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [accessMethod, setAccessMethod] = useState("");
  const [adminId, setAdminId] = useState<string>("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!name || !location) {
      setMessage({ type: "error", text: "請輸入教室名稱與位置。" });
      return;
    }
    startTransition(async () => {
      const result = await createClassroom(schoolSlug, schoolId, {
        name,
        location,
        description,
        accessMethod,
        adminIds: adminId ? [adminId] : [],
      });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: "教室建立成功！" });
      setName("");
      setLocation("");
      setDescription("");
      setAccessMethod("");
      setAdminId("");
      onCreated();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div>
        <Label className="mb-2 block">名稱</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：S201 討論教室" required />
      </div>
      <div>
        <Label className="mb-2 block">位置</Label>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="例如：科學大樓2樓" required />
      </div>
      <div>
        <Label className="mb-2 block">描述</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="容納人數、設備等說明" />
      </div>
      <div>
        <Label className="mb-2 block">門禁方式</Label>
        <Input value={accessMethod} onChange={(e) => setAccessMethod(e.target.value)} placeholder="例如：刷卡、向處室借鑰匙" />
      </div>

      {isSiteAdmin && classAdmins.length > 0 && (
        <div>
          <Label className="mb-2 block">指派教室管理員</Label>
          <Select value={adminId} onValueChange={(v) => setAdminId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="（未指派）" />
            </SelectTrigger>
            <SelectContent>
              {classAdmins.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.fullName} ({a.department})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {message && (
        <p className={message.type === "success" ? "text-sm text-emerald-700" : "text-sm text-destructive"}>
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "建立中…" : "建立教室"}
      </Button>
    </form>
  );
}
