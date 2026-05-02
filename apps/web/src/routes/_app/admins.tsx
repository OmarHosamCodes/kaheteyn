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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaheteyn/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, KeyRoundIcon, PlusIcon, ShieldCheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, Field, PageHeader } from "@/components/page";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_app/admins")({
  component: AdminsPage,
});

type Admin = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  createdAt: Date | string;
};

const emptyCreateForm = {
  name: "",
  username: "",
  email: "",
  password: "",
};

const emptyPasswordForm = {
  newPassword: "",
};

function AdminsPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const adminsQ = useQuery(trpc.admins.list.queryOptions());
  const admins = adminsQ.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: trpc.admins.list.queryKey() });

  // Add Admin dialog
  const [addOpen, setAddOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [showCreatePw, setShowCreatePw] = useState(false);

  // Set Password dialog
  const [pwTarget, setPwTarget] = useState<Admin | null>(null);
  const [pwForm, setPwForm] = useState(emptyPasswordForm);
  const [showSetPw, setShowSetPw] = useState(false);

  const createMut = useMutation(
    trpc.admins.create.mutationOptions({
      onSuccess: () => {
        toast.success("تمت إضافة المشرف");
        setAddOpen(false);
        setCreateForm(emptyCreateForm);
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const setPasswordMut = useMutation(
    trpc.admins.setPassword.mutationOptions({
      onSuccess: () => {
        toast.success("تم تغيير كلمة المرور");
        setPwTarget(null);
        setPwForm(emptyPasswordForm);
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const submitCreate = () => {
    if (!createForm.name.trim()) return toast.error("الاسم مطلوب");
    if (createForm.username.trim().length < 3) return toast.error("اسم المستخدم يجب أن يكون 3 أحرف على الأقل");
    if (!createForm.email.trim()) return toast.error("البريد الإلكتروني مطلوب");
    if (createForm.password.length < 6) return toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    createMut.mutate({
      name: createForm.name.trim(),
      username: createForm.username.trim(),
      email: createForm.email.trim(),
      password: createForm.password,
    });
  };

  const submitPassword = () => {
    if (!pwTarget) return;
    if (pwForm.newPassword.length < 6) return toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    setPasswordMut.mutate({ userId: pwTarget.id, newPassword: pwForm.newPassword });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="المشرفون"
        subtitle={`${admins.length} مشرف`}
        actions={
          <Button size="sm" onClick={() => { setCreateForm(emptyCreateForm); setAddOpen(true); }}>
            <PlusIcon className="size-4 ms-1" /> إضافة مشرف
          </Button>
        }
      />

      {adminsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">جاري التحميل…</p>
      ) : admins.length === 0 ? (
        <EmptyState
          icon={<ShieldCheckIcon className="size-8" />}
          title="لا يوجد مشرفون"
          description="ابدأ بإضافة أول مشرف."
          action={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <PlusIcon className="size-4 ms-1" /> إضافة مشرف
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead className="text-end">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell className="font-mono text-xs">{admin.username ?? "—"}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(admin.createdAt).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPwTarget(admin);
                          setPwForm(emptyPasswordForm);
                        }}
                      >
                        <KeyRoundIcon className="size-4 ms-1" /> تغيير كلمة المرور
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Admin Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setShowCreatePw(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة مشرف جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="الاسم الكامل" required>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="مثال: محمد أحمد"
              />
            </Field>
            <Field label="اسم المستخدم" required>
              <Input
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                placeholder="مثال: m.ahmed"
                dir="ltr"
              />
            </Field>
            <Field label="البريد الإلكتروني" required>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="example@domain.com"
                dir="ltr"
              />
            </Field>
            <Field label="كلمة المرور" required>
              <div className="relative">
                <Input
                  type={showCreatePw ? "text" : "password"}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="6 أحرف على الأقل"
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePw((v) => !v)}
                  className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showCreatePw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showCreatePw ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={submitCreate} disabled={createMut.isPending}>
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog open={!!pwTarget} onOpenChange={(open) => { if (!open) { setPwTarget(null); setShowSetPw(false); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تغيير كلمة مرور: {pwTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="كلمة المرور الجديدة" required>
              <div className="relative">
                <Input
                  type={showSetPw ? "text" : "password"}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ newPassword: e.target.value })}
                  placeholder="6 أحرف على الأقل"
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSetPw((v) => !v)}
                  className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showSetPw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showSetPw ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwTarget(null)}>
              إلغاء
            </Button>
            <Button onClick={submitPassword} disabled={setPasswordMut.isPending}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
