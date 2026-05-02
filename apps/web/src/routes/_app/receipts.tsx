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
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm";
import { FileUpload } from "@/components/file-upload";
import { EmptyState, Field, PageHeader } from "@/components/page";
import { downloadCSV } from "@/lib/csv";
import { formatDate, formatUSD } from "@/lib/format";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_app/receipts")({
  component: ReceiptsPage,
});

type FormState = {
  paymentId: string;
  document: string | null;
  dateReceived: string; // YYYY-MM-DD
  notes: string;
};

function defaultForm(): FormState {
  return {
    paymentId: "",
    document: null,
    dateReceived: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

function ReceiptsPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const confirm = useConfirm();

  const receiptsQ = useQuery(trpc.receipts.list.queryOptions());
  const paymentsQ = useQuery(trpc.payments.list.queryOptions());

  const receipts = receiptsQ.data ?? [];
  const payments = paymentsQ.data ?? [];

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return receipts;
    return receipts.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.paymentId.toLowerCase().includes(q) ||
        r.childName.toLowerCase().includes(q) ||
        r.sponsorName.toLowerCase().includes(q),
    );
  }, [receipts, search]);

  // Payments without receipts (for new receipt dropdown)
  const paymentsWithoutReceipts = useMemo(
    () => payments.filter((p) => !p.hasReceipt),
    [payments],
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: trpc.receipts.list.queryKey() });
    qc.invalidateQueries({ queryKey: trpc.payments.list.queryKey() });
    qc.invalidateQueries({ queryKey: trpc.dashboard.summary.queryKey() });
  };

  const createMut = useMutation(
    trpc.receipts.create.mutationOptions({
      onSuccess: () => {
        toast.success("تمت إضافة الإقرار");
        setOpen(false);
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const updateMut = useMutation(
    trpc.receipts.update.mutationOptions({
      onSuccess: () => {
        toast.success("تم تحديث الإقرار");
        setOpen(false);
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const removeMut = useMutation(
    trpc.receipts.remove.mutationOptions({
      onSuccess: () => {
        toast.success("تم حذف الإقرار");
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm());
    setOpen(true);
  };

  const openEdit = (r: (typeof receipts)[number]) => {
    setEditingId(r.id);
    setForm({
      paymentId: r.paymentId,
      document: r.document ?? null,
      dateReceived: new Date(r.dateReceived).toISOString().slice(0, 10),
      notes: r.notes ?? "",
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.paymentId) return toast.error("اختر الدفعة");
    const payload = {
      paymentId: form.paymentId,
      document: form.document,
      dateReceived: new Date(form.dateReceived).getTime(),
      notes: form.notes.trim() || null,
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const remove = async (r: (typeof receipts)[number]) => {
    const ok = await confirm({
      title: `حذف الإقرار ${r.id}؟`,
      description: `${r.childName} · ${r.paymentMonth}`,
      variant: "destructive",
      confirmLabel: "حذف",
    });
    if (ok) removeMut.mutate({ id: r.id });
  };

  const exportCSV = () => {
    const rows = filtered.map((r) => ({
      ID: r.id,
      PaymentID: r.paymentId,
      Child: r.childName,
      Sponsor: r.sponsorName,
      Month: r.paymentMonth,
      AmountUSD: (r.amountUsd / 100).toFixed(2),
      DateReceived: formatDate(r.dateReceived),
      HasDocument: r.document ? "نعم" : "لا",
      Notes: r.notes ?? "",
    }));
    downloadCSV(`receipts-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const paymentOptions = editingId
    ? payments
    : paymentsWithoutReceipts;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإقرارات"
        subtitle={`${receipts.length} إقرار · ${paymentsWithoutReceipts.length} دفعة بدون إقرار`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <DownloadIcon className="size-4 ms-1" /> تصدير CSV
            </Button>
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-4 ms-1" /> إقرار جديد
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="بحث بالمعرّف، الدفعة، الطفل، الكفيل…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {receiptsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">جاري التحميل…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileTextIcon className="size-8" />}
          title="لا توجد إقرارات"
          description={
            search ? "لا نتائج للبحث الحالي." : "ابدأ بإضافة أول إقرار."
          }
          action={
            !search && (
              <Button onClick={openCreate} size="sm">
                <PlusIcon className="size-4 ms-1" /> إقرار جديد
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
                  <TableHead>الدفعة</TableHead>
                  <TableHead>الطفل</TableHead>
                  <TableHead>الكفيل</TableHead>
                  <TableHead>الشهر</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>تاريخ الاستلام</TableHead>
                  <TableHead>المستند</TableHead>
                  <TableHead className="text-end">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.paymentId}
                    </TableCell>
                    <TableCell>{r.childName}</TableCell>
                    <TableCell>{r.sponsorName}</TableCell>
                    <TableCell>{r.paymentMonth}</TableCell>
                    <TableCell className="font-semibold">
                      {formatUSD(r.amountUsd)}
                    </TableCell>
                    <TableCell>{formatDate(r.dateReceived)}</TableCell>
                    <TableCell>
                      {r.document ? (
                        <a
                          href={r.document}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary text-xs underline"
                        >
                          عرض
                        </a>
                      ) : (
                        <Badge variant="warning">بدون</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(r)}
                          aria-label="تعديل"
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove(r)}
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
            <DialogTitle>
              {editingId ? "تعديل إقرار" : "إقرار جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="الدفعة" required>
              <Select
                value={form.paymentId}
                onChange={(e) =>
                  setForm({ ...form, paymentId: e.target.value })
                }
                disabled={!!editingId}
              >
                <option value="">اختر دفعة</option>
                {paymentOptions.length === 0 && (
                  <option value="" disabled>
                    لا توجد دفعات بدون إقرار
                  </option>
                )}
                {paymentOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.childName} · {p.monthLabel} · {formatUSD(p.amountUsd)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="تاريخ الاستلام" required>
              <Input
                type="date"
                value={form.dateReceived}
                onChange={(e) =>
                  setForm({ ...form, dateReceived: e.target.value })
                }
              />
            </Field>
            <Field label="مستند الإقرار">
              <FileUpload
                value={form.document}
                onChange={(v) => setForm({ ...form, document: v })}
                label="رفع مستند"
              />
            </Field>
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
              {editingId ? "حفظ التغييرات" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
