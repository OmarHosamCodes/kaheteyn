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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaheteyn/ui/components/table";
import { Textarea } from "@kaheteyn/ui/components/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  DownloadIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm";
import { EmptyState, Field, PageHeader } from "@/components/page";
import { downloadCSV } from "@/lib/csv";
import { PAYMENT_METHOD_LABEL, formatUSD } from "@/lib/format";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_app/sponsors")({
  component: SponsorsPage,
});

type Sponsor = {
  id: string;
  name: string;
  phone: string | null;
  paymentMethod: string | null;
  notes: string | null;
  childrenCount: number;
  totalDisbursedCents: number;
};

const emptyForm = {
  name: "",
  phone: "",
  paymentMethod: "" as "" | "bank_palestine" | "palpay" | "bank_transfer",
  notes: "",
};

function SponsorsPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const confirm = useConfirm();

  const sponsorsQ = useQuery(trpc.sponsors.list.queryOptions());
  const sponsors = sponsorsQ.data ?? [];

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sponsors;
    return sponsors.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.phone ?? "").toLowerCase().includes(q),
    );
  }, [sponsors, search]);

  const totals = useMemo(
    () => ({
      sponsors: sponsors.length,
      children: sponsors.reduce((a, s) => a + s.childrenCount, 0),
      disbursed: sponsors.reduce((a, s) => a + s.totalDisbursedCents, 0),
    }),
    [sponsors],
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: trpc.sponsors.list.queryKey() });
  };

  const createMut = useMutation(
    trpc.sponsors.create.mutationOptions({
      onSuccess: () => {
        toast.success("تمت إضافة الكفيل");
        setOpen(false);
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const updateMut = useMutation(
    trpc.sponsors.update.mutationOptions({
      onSuccess: () => {
        toast.success("تم تحديث الكفيل");
        setOpen(false);
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const removeMut = useMutation(
    trpc.sponsors.remove.mutationOptions({
      onSuccess: () => {
        toast.success("تم حذف الكفيل");
        invalidate();
        qc.invalidateQueries({ queryKey: trpc.children.list.queryKey() });
        qc.invalidateQueries({ queryKey: trpc.payments.list.queryKey() });
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (s: Sponsor) => {
    setEditing(s);
    setForm({
      name: s.name,
      phone: s.phone ?? "",
      paymentMethod:
        (s.paymentMethod as typeof emptyForm.paymentMethod) || "",
      notes: s.notes ?? "",
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("الاسم مطلوب");
      return;
    }
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      paymentMethod: form.paymentMethod || null,
      notes: form.notes.trim() || null,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const remove = async (s: Sponsor) => {
    const ok = await confirm({
      title: `حذف ${s.name}؟`,
      description:
        s.childrenCount > 0
          ? `هذا الكفيل مرتبط بـ ${s.childrenCount} طفل وسيتم فك الارتباط. هل تريد المتابعة؟`
          : "سيُحذف الكفيل نهائياً.",
      variant: "destructive",
      confirmLabel: "حذف",
    });
    if (ok) removeMut.mutate({ id: s.id, force: true });
  };

  const exportCSV = () => {
    const rows = filtered.map((s) => ({
      ID: s.id,
      Name: s.name,
      Phone: s.phone ?? "",
      PaymentMethod: s.paymentMethod
        ? (PAYMENT_METHOD_LABEL[s.paymentMethod] ?? s.paymentMethod)
        : "",
      Children: s.childrenCount,
      TotalUSD: (s.totalDisbursedCents / 100).toFixed(2),
      Notes: s.notes ?? "",
    }));
    downloadCSV(`sponsors-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="الكفلاء"
        subtitle={`${totals.sponsors} كفيل · ${totals.children} طفل · ${formatUSD(totals.disbursed)} إجمالي`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <DownloadIcon className="size-4 ms-1" /> تصدير CSV
            </Button>
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-4 ms-1" /> إضافة كفيل
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="بحث بالاسم، المعرّف، الهاتف…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {sponsorsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">جاري التحميل…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="size-8" />}
          title="لا يوجد كفلاء"
          description={
            search ? "لا نتائج للبحث الحالي." : "ابدأ بإضافة أول كفيل."
          }
          action={
            !search && (
              <Button onClick={openCreate} size="sm">
                <PlusIcon className="size-4 ms-1" /> إضافة كفيل
              </Button>
            )
          }
        />
      ) : (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المعرّف</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead className="text-center">الأطفال</TableHead>
                  <TableHead>إجمالي مدفوع</TableHead>
                  <TableHead className="text-end">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.id}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.phone ?? "—"}</TableCell>
                    <TableCell>
                      {s.paymentMethod ? (
                        <Badge variant="outline">
                          {PAYMENT_METHOD_LABEL[s.paymentMethod] ??
                            s.paymentMethod}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={s.childrenCount > 0 ? "success" : "outline"}>
                        {s.childrenCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatUSD(s.totalDisbursedCents)}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(s)}
                          aria-label="تعديل"
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove(s)}
                          aria-label="حذف"
                          className="text-destructive"
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل كفيل" : "كفيل جديد"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="الاسم" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الهاتف">
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="طريقة الدفع المفضّلة">
                <Select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentMethod: e.target
                        .value as typeof form.paymentMethod,
                    })
                  }
                >
                  <option value="">—</option>
                  <option value="bank_palestine">
                    {PAYMENT_METHOD_LABEL.bank_palestine}
                  </option>
                  <option value="palpay">{PAYMENT_METHOD_LABEL.palpay}</option>
                  <option value="bank_transfer">
                    {PAYMENT_METHOD_LABEL.bank_transfer}
                  </option>
                </Select>
              </Field>
            </div>
            <Field label="ملاحظات">
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={submit}
              disabled={createMut.isPending || updateMut.isPending}
            >
              {editing ? "حفظ التغييرات" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
