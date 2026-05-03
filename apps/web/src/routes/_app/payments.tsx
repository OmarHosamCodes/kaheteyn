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
  CheckCircle2Icon,
  DownloadIcon,
  PencilIcon,
  PlusIcon,
  ReceiptIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm";
import { FileUpload } from "@/components/file-upload";
import { EmptyState, Field, PageHeader } from "@/components/page";
import { downloadCSV } from "@/lib/csv";
import {
  FINANCIAL_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  currentMonthKey,
  formatDate,
  formatUSD,
  monthLabelFromKey,
} from "@/lib/format";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_app/payments")({
  component: PaymentsPage,
});

type FormState = {
  childId: string;
  sponsorId: string;
  monthKey: string;
  amountUsd: string; // dollars in input, converted to cents
  dateSent: string; // YYYY-MM-DD
  paymentStatus: "paid" | "pending" | "late";
  financialStatus: "sent" | "confirmed" | "rejected";
  acknowledgmentReceipt: string; // URL
  transferReceipt: string; // URL
  notes: string;
};

function defaultForm(): FormState {
  return {
    childId: "",
    sponsorId: "",
    monthKey: currentMonthKey(),
    amountUsd: "",
    dateSent: new Date().toISOString().slice(0, 10),
    paymentStatus: "pending",
    financialStatus: "sent",
    acknowledgmentReceipt: "",
    transferReceipt: "",
    notes: "",
  };
}

function PaymentsPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const confirm = useConfirm();

  const [filter, setFilter] = useState<{
    monthKey: string;
    sponsorId: string;
    childId: string;
    paymentStatus: string;
    financialStatus: string;
  }>({
    monthKey: "",
    sponsorId: "",
    childId: "",
    paymentStatus: "",
    financialStatus: "",
  });

  const paymentsQ = useQuery(
    trpc.payments.list.queryOptions({
      monthKey: filter.monthKey || undefined,
      sponsorId: filter.sponsorId || undefined,
      childId: filter.childId || undefined,
      paymentStatus: filter.paymentStatus || undefined,
      financialStatus: filter.financialStatus || undefined,
    }),
  );
  const childrenQ = useQuery(trpc.children.list.queryOptions());
  const sponsorsQ = useQuery(trpc.sponsors.list.queryOptions());

  const payments = paymentsQ.data ?? [];
  const children = childrenQ.data ?? [];
  const sponsors = sponsorsQ.data ?? [];

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((p) => set.add(p.monthKey));
    set.add(currentMonthKey());
    return Array.from(set).sort().reverse();
  }, [payments]);

  const totals = useMemo(
    () => ({
      count: payments.length,
      confirmed: payments
        .filter((p) => p.financialStatus === "confirmed")
        .reduce((a, p) => a + p.amountUsd, 0),
      sent: payments
        .filter((p) => p.financialStatus === "sent")
        .reduce((a, p) => a + p.amountUsd, 0),
    }),
    [payments],
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: trpc.payments.list.queryKey() });
    qc.invalidateQueries({ queryKey: trpc.children.list.queryKey() });
    qc.invalidateQueries({ queryKey: trpc.sponsors.list.queryKey() });
    qc.invalidateQueries({ queryKey: trpc.dashboard.summary.queryKey() });
  };

  const createMut = useMutation(
    trpc.payments.create.mutationOptions({
      onSuccess: () => {
        toast.success("تمت إضافة الدفعة");
        setOpen(false);
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const updateMut = useMutation(
    trpc.payments.update.mutationOptions({
      onSuccess: () => {
        toast.success("تم تحديث الدفعة");
        setOpen(false);
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const setFinancialMut = useMutation(
    trpc.payments.setFinancial.mutationOptions({
      onSuccess: () => {
        toast.success("تم تحديث الحالة المالية");
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const removeMut = useMutation(
    trpc.payments.remove.mutationOptions({
      onSuccess: () => {
        toast.success("تم حذف الدفعة");
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

  const openEdit = (p: (typeof payments)[number]) => {
    setEditingId(p.id);
    setForm({
      childId: p.childId,
      sponsorId: p.sponsorId,
      monthKey: p.monthKey,
      amountUsd: (p.amountUsd / 100).toString(),
      dateSent: new Date(p.dateSent).toISOString().slice(0, 10),
      paymentStatus: p.paymentStatus as FormState["paymentStatus"],
      financialStatus: p.financialStatus as FormState["financialStatus"],
      acknowledgmentReceipt: p.acknowledgmentReceipt ?? "",
      transferReceipt: p.transferReceipt ?? "",
      notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.childId) return toast.error("اختر الطفل");
    if (!form.sponsorId) return toast.error("اختر الكفيل");
    const amountNum = Number(form.amountUsd);
    if (!Number.isFinite(amountNum) || amountNum <= 0)
      return toast.error("المبلغ غير صالح");
    if (!/^\d{4}-\d{2}$/.test(form.monthKey)) return toast.error("الشهر غير صالح");

    const payload = {
      childId: form.childId,
      sponsorId: form.sponsorId,
      monthKey: form.monthKey,
      monthLabel: monthLabelFromKey(form.monthKey),
      amountUsd: Math.round(amountNum * 100),
      dateSent: new Date(form.dateSent).getTime(),
      paymentStatus: form.paymentStatus,
      financialStatus: form.financialStatus,
      acknowledgmentReceipt: form.acknowledgmentReceipt.trim() || null,
      transferReceipt: form.transferReceipt.trim() || null,
      notes: form.notes.trim() || null,
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const remove = async (p: (typeof payments)[number]) => {
    const ok = await confirm({
      title: `حذف الدفعة ${p.id}؟`,
      description: `${p.childName} · ${p.monthLabel} · ${formatUSD(p.amountUsd)}`,
      variant: "destructive",
      confirmLabel: "حذف",
    });
    if (ok) removeMut.mutate({ id: p.id });
  };

  const exportCSV = () => {
    const rows = payments.map((p) => ({
      ID: p.id,
      Child: p.childName,
      ChildId: p.childId,
      Sponsor: p.sponsorName,
      SponsorId: p.sponsorId,
      Month: p.monthLabel,
      AmountUSD: (p.amountUsd / 100).toFixed(2),
      DateSent: formatDate(p.dateSent),
      PaymentStatus: PAYMENT_STATUS_LABEL[p.paymentStatus] ?? p.paymentStatus,
      FinancialStatus:
        FINANCIAL_STATUS_LABEL[p.financialStatus] ?? p.financialStatus,
      AcknowledgmentReceipt: p.acknowledgmentReceipt ? "نعم" : "لا",
      TransferReceipt: p.transferReceipt ? "نعم" : "لا",
    }));
    downloadCSV(`payments-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const childOptions = useMemo(
    () =>
      [...children].sort((a, b) => a.fullName.localeCompare(b.fullName, "ar")),
    [children],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="الدفعات"
        subtitle={`${totals.count} دفعة · مؤكَّد ${formatUSD(totals.confirmed)} · مرسلة ${formatUSD(totals.sent)}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <DownloadIcon className="size-4 ms-1" /> تصدير CSV
            </Button>
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-4 ms-1" /> دفعة جديدة
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="pt-6 grid gap-3 md:grid-cols-5">
          <Select
            value={filter.monthKey}
            onChange={(e) =>
              setFilter({ ...filter, monthKey: e.target.value })
            }
          >
            <option value="">كل الأشهر</option>
            {monthOptions.map((mk) => (
              <option key={mk} value={mk}>
                {monthLabelFromKey(mk)}
              </option>
            ))}
          </Select>
          <Select
            value={filter.sponsorId}
            onChange={(e) =>
              setFilter({ ...filter, sponsorId: e.target.value })
            }
          >
            <option value="">كل الكفلاء</option>
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select
            value={filter.childId}
            onChange={(e) =>
              setFilter({ ...filter, childId: e.target.value })
            }
          >
            <option value="">كل الأطفال</option>
            {childOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </Select>
          <Select
            value={filter.paymentStatus}
            onChange={(e) =>
              setFilter({ ...filter, paymentStatus: e.target.value })
            }
          >
            <option value="">كل حالات الدفع</option>
            <option value="paid">مدفوع</option>
            <option value="pending">انتظار</option>
            <option value="late">متأخر</option>
          </Select>
          <Select
            value={filter.financialStatus}
            onChange={(e) =>
              setFilter({ ...filter, financialStatus: e.target.value })
            }
          >
            <option value="">كل الحالات المالية</option>
            <option value="sent">مرسلة</option>
            <option value="confirmed">مؤكدة</option>
            <option value="rejected">مرفوضة</option>
          </Select>
        </CardContent>
      </Card>

      {paymentsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">جاري التحميل…</p>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon className="size-8" />}
          title="لا توجد دفعات"
          description="ابدأ بتسجيل أول دفعة."
          action={
            <Button onClick={openCreate} size="sm">
              <PlusIcon className="size-4 ms-1" /> دفعة جديدة
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المعرّف</TableHead>
                  <TableHead>الطفل</TableHead>
                  <TableHead>الكفيل</TableHead>
                  <TableHead>الشهر</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الحالة المالية</TableHead>
                  <TableHead>إقرار الاستلام</TableHead>
                  <TableHead>وصل التحويل</TableHead>
                  <TableHead className="text-end">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell>{p.childName}</TableCell>
                    <TableCell>{p.sponsorName}</TableCell>
                    <TableCell>{p.monthLabel}</TableCell>
                    <TableCell className="font-semibold">
                      {formatUSD(p.amountUsd)}
                    </TableCell>
                    <TableCell>{formatDate(p.dateSent)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.paymentStatus === "paid"
                            ? "success"
                            : p.paymentStatus === "late"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {PAYMENT_STATUS_LABEL[p.paymentStatus] ?? p.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.financialStatus === "confirmed"
                            ? "success"
                            : p.financialStatus === "rejected"
                              ? "destructive"
                              : "info"
                        }
                      >
                        {FINANCIAL_STATUS_LABEL[p.financialStatus] ??
                          p.financialStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.acknowledgmentReceipt ? (
                        <a
                          href={p.acknowledgmentReceipt}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="عرض إقرار الاستلام"
                        >
                          <img
                            src={p.acknowledgmentReceipt}
                            alt=""
                            className="h-10 w-10 rounded border object-cover"
                          />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.transferReceipt ? (
                        <a
                          href={p.transferReceipt}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="عرض وصل التحويل"
                        >
                          <img
                            src={p.transferReceipt}
                            alt=""
                            className="h-10 w-10 rounded border object-cover"
                          />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        {p.financialStatus !== "confirmed" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setFinancialMut.mutate({
                                id: p.id,
                                status: "confirmed",
                              })
                            }
                            aria-label="تأكيد"
                            className="text-green-600"
                          >
                            <CheckCircle2Icon className="size-4" />
                          </Button>
                        )}
                        {p.financialStatus !== "rejected" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setFinancialMut.mutate({
                                id: p.id,
                                status: "rejected",
                              })
                            }
                            aria-label="رفض"
                            className="text-destructive"
                          >
                            <XCircleIcon className="size-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(p)}
                          aria-label="تعديل"
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove(p)}
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "تعديل دفعة" : "دفعة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="الطفل" required>
                <Select
                  value={form.childId}
                  onChange={(e) => {
                    const v = e.target.value;
                    const c = children.find((x) => x.id === v);
                    setForm({
                      ...form,
                      childId: v,
                      sponsorId: c?.sponsorId ?? form.sponsorId,
                    });
                  }}
                >
                  <option value="">اختر طفلاً</option>
                  {childOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="الكفيل" required>
                <Select
                  value={form.sponsorId}
                  onChange={(e) =>
                    setForm({ ...form, sponsorId: e.target.value })
                  }
                >
                  <option value="">اختر كفيلاً</option>
                  {sponsors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="الشهر (YYYY-MM)" required>
                <Input
                  value={form.monthKey}
                  onChange={(e) =>
                    setForm({ ...form, monthKey: e.target.value })
                  }
                  placeholder="2026-05"
                />
              </Field>
              <Field label="المبلغ (USD)" required>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amountUsd}
                  onChange={(e) =>
                    setForm({ ...form, amountUsd: e.target.value })
                  }
                />
              </Field>
              <Field label="تاريخ الإرسال" required>
                <Input
                  type="date"
                  value={form.dateSent}
                  onChange={(e) =>
                    setForm({ ...form, dateSent: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="حالة الدفع">
                <Select
                  value={form.paymentStatus}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentStatus: e.target
                        .value as FormState["paymentStatus"],
                    })
                  }
                >
                  <option value="paid">مدفوع</option>
                  <option value="pending">انتظار</option>
                  <option value="late">متأخر</option>
                </Select>
              </Field>
              <Field label="الحالة المالية">
                <Select
                  value={form.financialStatus}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      financialStatus: e.target
                        .value as FormState["financialStatus"],
                    })
                  }
                >
                  <option value="sent">مرسلة</option>
                  <option value="confirmed">مؤكدة</option>
                  <option value="rejected">مرفوضة</option>
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
            <Field label="إقرار الاستلام (صورة)">
              <FileUpload
                value={form.acknowledgmentReceipt || null}
                onChange={(v) =>
                  setForm({ ...form, acknowledgmentReceipt: v ?? "" })
                }
                accept="image/*"
                label="رفع صورة الإقرار"
              />
            </Field>
            <Field label="وصل التحويل (صورة)">
              <FileUpload
                value={form.transferReceipt || null}
                onChange={(v) =>
                  setForm({ ...form, transferReceipt: v ?? "" })
                }
                accept="image/*"
                label="رفع صورة الوصل"
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
