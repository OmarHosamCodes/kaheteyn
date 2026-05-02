import { Badge } from "@kaheteyn/ui/components/badge";
import { Button } from "@kaheteyn/ui/components/button";
import { Card, CardContent } from "@kaheteyn/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaheteyn/ui/components/dialog";
import { Input } from "@kaheteyn/ui/components/input";
import { Select } from "@kaheteyn/ui/components/select";
import { Textarea } from "@kaheteyn/ui/components/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UserCircleIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm";
import { FileUpload } from "@/components/file-upload";
import { EmptyState, Field, PageHeader } from "@/components/page";
import { downloadCSV } from "@/lib/csv";
import {
  PAYMENT_METHOD_LABEL,
  SCHOOL_STAGES,
  SPONSORSHIP_STATUS_LABEL,
} from "@/lib/format";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_app/children/")({
  component: ChildrenPage,
});

type ChildRow = {
  id: string;
  fullName: string;
  age: number | null;
  birthDate: string | null;
  gender: string | null;
  residence: string | null;
  healthStatus: string | null;
  schoolStage: string | null;
  fatherName: string | null;
  fatherDeathDate: string | null;
  fatherDeathCause: string | null;
  motherName: string | null;
  siblingsCount: number | null;
  guardianName: string | null;
  guardianRelation: string | null;
  phone: string | null;
  guardianAccount: string | null;
  sponsorshipStatus: string;
  sponsorId: string | null;
  photo: string | null;
  birthCertificate: string | null;
  notes: string | null;
};

function emptyChild(): ChildRow {
  return {
    id: "",
    fullName: "",
    age: null,
    birthDate: null,
    gender: null,
    residence: null,
    healthStatus: null,
    schoolStage: null,
    fatherName: null,
    fatherDeathDate: null,
    fatherDeathCause: null,
    motherName: null,
    siblingsCount: null,
    guardianName: null,
    guardianRelation: null,
    phone: null,
    guardianAccount: null,
    sponsorshipStatus: "unsponsored",
    sponsorId: null,
    photo: null,
    birthCertificate: null,
    notes: null,
  };
}

function ChildrenPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const confirm = useConfirm();

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"all" | "sponsored" | "unsponsored">(
    "all",
  );
  const [schoolStage, setSchoolStage] = React.useState("");
  const [sponsorId, setSponsorId] = React.useState("");

  const list = useQuery(
    trpc.children.list.queryOptions({
      search: search || undefined,
      status,
      schoolStage: schoolStage || undefined,
      sponsorId: sponsorId || undefined,
    }),
  );
  const sponsors = useQuery(trpc.sponsors.list.queryOptions());

  const [editing, setEditing] = React.useState<ChildRow | null>(null);

  const createMut = useMutation(
    trpc.children.create.mutationOptions({
      onSuccess: () => {
        toast.success("تمت إضافة الطفل");
        qc.invalidateQueries({ queryKey: trpc.children.list.queryKey() });
        setEditing(null);
      },
      onError: (e) => toast.error(e.message),
    }),
  );
  const updateMut = useMutation(
    trpc.children.update.mutationOptions({
      onSuccess: () => {
        toast.success("تم حفظ التعديلات");
        qc.invalidateQueries({ queryKey: trpc.children.list.queryKey() });
        setEditing(null);
      },
      onError: (e) => toast.error(e.message),
    }),
  );
  const removeMut = useMutation(
    trpc.children.remove.mutationOptions({
      onSuccess: () => {
        toast.success("تم الحذف");
        qc.invalidateQueries({ queryKey: trpc.children.list.queryKey() });
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  function exportCsv() {
    const sponsorMap = new Map(
      (sponsors.data ?? []).map((s) => [s.id, s.name]),
    );
    downloadCSV(
      "children.csv",
      (list.data ?? []).map((c) => ({
        id: c.id,
        fullName: c.fullName,
        age: c.age ?? "",
        gender: c.gender ?? "",
        residence: c.residence ?? "",
        schoolStage: c.schoolStage ?? "",
        guardianName: c.guardianName ?? "",
        phone: c.phone ?? "",
        sponsorshipStatus: SPONSORSHIP_STATUS_LABEL[c.sponsorshipStatus] ?? "",
        sponsorName: c.sponsorId ? sponsorMap.get(c.sponsorId) ?? "" : "",
      })),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="الأطفال"
        subtitle="إدارة سجلات الأطفال المكفولين وغير المكفولين"
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} size="sm">
              <DownloadIcon className="size-4 ms-1" /> تصدير CSV
            </Button>
            <Button
              onClick={() => setEditing(emptyChild())}
              size="sm"
            >
              <PlusIcon className="size-4 ms-1" /> طفل جديد
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <SearchIcon className="absolute end-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو رقم السجل أو ولي الأمر..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pe-8"
                />
              </div>
            </div>
            <Select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "all" | "sponsored" | "unsponsored")
              }
            >
              <option value="all">الكل</option>
              <option value="sponsored">المكفولون</option>
              <option value="unsponsored">غير المكفولين</option>
            </Select>
            <Select
              value={schoolStage}
              onChange={(e) => setSchoolStage(e.target.value)}
            >
              <option value="">جميع المراحل</option>
              {SCHOOL_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select
              value={sponsorId}
              onChange={(e) => setSponsorId(e.target.value)}
              className="md:col-span-4"
            >
              <option value="">جميع الكفلاء</option>
              {(sponsors.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">جاري التحميل…</p>
      ) : (list.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="لا يوجد أطفال مطابقون"
          description="ابدأ بإضافة طفل جديد أو عدّل الفلاتر."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(list.data ?? []).map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <Link
                to="/children/$id"
                params={{ id: c.id }}
                className="block hover:bg-muted/30"
              >
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    {c.photo ? (
                      <img
                        src={c.photo}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-muted grid place-items-center">
                        <UserCircleIcon className="size-7 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{c.fullName}</p>
                      <p className="text-xs text-muted-foreground">{c.id}</p>
                    </div>
                    {c.sponsorshipStatus === "sponsored" ? (
                      <Badge variant="success">مكفول</Badge>
                    ) : (
                      <Badge variant="warning">غير مكفول</Badge>
                    )}
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <div>
                      <dt className="text-foreground/60">العمر</dt>
                      <dd>{c.age ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">المرحلة</dt>
                      <dd>{c.schoolStage ?? "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-foreground/60">السكن</dt>
                      <dd className="truncate">{c.residence ?? "—"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Link>
              <div className="flex border-t bg-muted/20 text-xs">
                <button
                  type="button"
                  className="flex-1 py-2 hover:bg-muted/40"
                  onClick={() => setEditing(c as ChildRow)}
                >
                  تعديل
                </button>
                <span className="w-px bg-border" />
                <button
                  type="button"
                  className="flex-1 py-2 text-destructive hover:bg-destructive/10"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "حذف الطفل؟",
                      description: `سيُحذف ${c.fullName} وكل دفعاته.`,
                      variant: "destructive",
                      confirmLabel: "حذف",
                    });
                    if (ok) removeMut.mutate({ id: c.id });
                  }}
                >
                  <Trash2Icon className="size-3 inline ms-1" /> حذف
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ChildDialog
        open={!!editing}
        value={editing}
        onClose={() => setEditing(null)}
        sponsors={sponsors.data ?? []}
        saving={createMut.isPending || updateMut.isPending}
        onSubmit={(data) => {
          if (editing?.id) {
            const { id: _id, ...rest } = data;
            updateMut.mutate({ id: editing.id, data: rest as never });
          } else {
            const { id: _id, ...rest } = data;
            createMut.mutate(rest as never);
          }
        }}
      />
    </div>
  );
}

function ChildDialog({
  open,
  value,
  onClose,
  onSubmit,
  saving,
  sponsors,
}: {
  open: boolean;
  value: ChildRow | null;
  onClose: () => void;
  onSubmit: (data: ChildRow) => void;
  saving: boolean;
  sponsors: { id: string; name: string }[];
}) {
  const [form, setForm] = React.useState<ChildRow>(emptyChild());
  React.useEffect(() => {
    if (value) setForm({ ...value });
  }, [value]);

  function set<K extends keyof ChildRow>(k: K, v: ChildRow[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{value?.id ? "تعديل طفل" : "إضافة طفل جديد"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.fullName.trim()) {
              toast.error("الاسم مطلوب");
              return;
            }
            if (form.sponsorshipStatus === "sponsored" && !form.sponsorId) {
              toast.error("يجب اختيار كفيل عند تعيين الحالة كمكفول");
              return;
            }
            onSubmit(form);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="الاسم الكامل" className="md:col-span-2">
              <Input
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                required
              />
            </Field>
            <Field label="الجنس">
              <Select
                value={form.gender ?? ""}
                onChange={(e) => set("gender", e.target.value || null)}
              >
                <option value="">—</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </Select>
            </Field>
            <Field label="العمر">
              <Input
                type="number"
                min={0}
                max={40}
                value={form.age ?? ""}
                onChange={(e) =>
                  set("age", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </Field>
            <Field label="تاريخ الميلاد">
              <Input
                type="date"
                value={form.birthDate ?? ""}
                onChange={(e) => set("birthDate", e.target.value || null)}
              />
            </Field>
            <Field label="المرحلة الدراسية">
              <Select
                value={form.schoolStage ?? ""}
                onChange={(e) => set("schoolStage", e.target.value || null)}
              >
                <option value="">—</option>
                {SCHOOL_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="السكن" className="md:col-span-2">
              <Input
                value={form.residence ?? ""}
                onChange={(e) => set("residence", e.target.value || null)}
              />
            </Field>
            <Field label="الحالة الصحية">
              <Input
                value={form.healthStatus ?? ""}
                onChange={(e) => set("healthStatus", e.target.value || null)}
              />
            </Field>
            <Field label="اسم الأب">
              <Input
                value={form.fatherName ?? ""}
                onChange={(e) => set("fatherName", e.target.value || null)}
              />
            </Field>
            <Field label="تاريخ وفاة الأب">
              <Input
                type="date"
                value={form.fatherDeathDate ?? ""}
                onChange={(e) => set("fatherDeathDate", e.target.value || null)}
              />
            </Field>
            <Field label="سبب الوفاة">
              <Input
                value={form.fatherDeathCause ?? ""}
                onChange={(e) => set("fatherDeathCause", e.target.value || null)}
              />
            </Field>
            <Field label="اسم الأم">
              <Input
                value={form.motherName ?? ""}
                onChange={(e) => set("motherName", e.target.value || null)}
              />
            </Field>
            <Field label="عدد الإخوة">
              <Input
                type="number"
                min={0}
                value={form.siblingsCount ?? ""}
                onChange={(e) =>
                  set(
                    "siblingsCount",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
            </Field>
            <Field label="ولي الأمر">
              <Input
                value={form.guardianName ?? ""}
                onChange={(e) => set("guardianName", e.target.value || null)}
              />
            </Field>
            <Field label="صلة القرابة">
              <Input
                value={form.guardianRelation ?? ""}
                onChange={(e) =>
                  set("guardianRelation", e.target.value || null)
                }
              />
            </Field>
            <Field label="رقم الهاتف">
              <Input
                value={form.phone ?? ""}
                onChange={(e) => set("phone", e.target.value || null)}
              />
            </Field>
            <Field label="حساب البنك / المحفظة" className="md:col-span-2">
              <Input
                value={form.guardianAccount ?? ""}
                onChange={(e) =>
                  set("guardianAccount", e.target.value || null)
                }
              />
            </Field>
            <Field label="الحالة">
              <Select
                value={form.sponsorshipStatus}
                onChange={(e) =>
                  set(
                    "sponsorshipStatus",
                    e.target.value as ChildRow["sponsorshipStatus"],
                  )
                }
              >
                <option value="unsponsored">غير مكفول</option>
                <option value="sponsored">مكفول</option>
              </Select>
            </Field>
            <Field label="الكفيل" className="md:col-span-2">
              <Select
                value={form.sponsorId ?? ""}
                onChange={(e) => set("sponsorId", e.target.value || null)}
              >
                <option value="">—</option>
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="الصورة الشخصية">
              <FileUpload
                value={form.photo}
                onChange={(v) => set("photo", v)}
                accept="image/*"
              />
            </Field>
            <Field label="شهادة الميلاد">
              <FileUpload
                value={form.birthCertificate}
                onChange={(v) => set("birthCertificate", v)}
              />
            </Field>
            <Field label="ملاحظات" className="md:col-span-3">
              <Textarea
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value || null)}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "جاري الحفظ…" : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// silence unused
export const _unused = PAYMENT_METHOD_LABEL;
