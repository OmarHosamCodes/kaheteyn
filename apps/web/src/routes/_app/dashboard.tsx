import { Badge } from "@kaheteyn/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@kaheteyn/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  BabyIcon,
  CheckCircle2Icon,
  HandCoinsIcon,
  InfoIcon,
  ReceiptIcon,
  UsersIcon,
} from "lucide-react";

import { formatDate, formatUSD, monthLabelFromKey } from "@/lib/format";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const trpc = useTRPC();
  const summary = useQuery(trpc.dashboard.summary.queryOptions());
  const latestPayments = useQuery(trpc.dashboard.latestPayments.queryOptions());
  const latestReceipts = useQuery(trpc.dashboard.latestReceipts.queryOptions());
  const ready = useQuery(trpc.dashboard.readyToDisburse.queryOptions());
  const alerts = useQuery(trpc.dashboard.alerts.queryOptions());
  const trend = useQuery(trpc.payments.monthlyTrend.queryOptions());

  const s = summary.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الرئيسية</h1>
        <p className="text-sm text-muted-foreground italic">
          يَا قَوْمِ ادْخُلُوا الأَرْضَ المُقَدَّسَةَ الَّتِي كَتَبَ اللّهُ لَكُمْ وَلاَ تَرْتَدُّوا عَلَى أَدْبَارِكُمْ فَتَنقَلِبُوا خَاسِرِينَ
        </p>
        <span className="text-sm text-muted-foreground">
          {s ? `شهر ${monthLabelFromKey(s.monthKey)}` : "—"}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Kpi
          icon={<BabyIcon className="size-5" />}
          label="إجمالي الأطفال"
          value={s?.totalChildren ?? "—"}
        />
        <Kpi
          icon={<CheckCircle2Icon className="size-5 text-emerald-500" />}
          label="المكفولين"
          value={s?.sponsored ?? "—"}
        />
        <Kpi
          icon={<AlertTriangleIcon className="size-5 text-amber-500" />}
          label="غير المكفولين"
          value={s?.unsponsored ?? "—"}
        />
        <Kpi
          icon={<UsersIcon className="size-5" />}
          label="الكفلاء النشطين"
          value={s?.sponsorsCount ?? "—"}
        />
        <Kpi
          icon={<HandCoinsIcon className="size-5 text-primary" />}
          label="إجمالي الشهر"
          value={s ? formatUSD(s.monthTotalCents) : "—"}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>مركز التنبيهات</CardTitle>
          </CardHeader>
          <CardContent>
            {!alerts.data || alerts.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد تنبيهات حالياً.</p>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {alerts.data.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-md border p-3 bg-card"
                  >
                    <AlertIcon severity={a.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{a.title}</span>
                        <SeverityBadge severity={a.severity} />
                      </div>
                      {a.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.detail}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>جاهز للصرف هذا الشهر</CardTitle>
          </CardHeader>
          <CardContent>
            {!ready.data || ready.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                جميع المكفولين تم صرف دفعاتهم لهذا الشهر.
              </p>
            ) : (
              <ul className="space-y-1 max-h-72 overflow-y-auto">
                {ready.data.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-card"
                  >
                    <Link
                      to="/children/$id"
                      params={{ id: c.id }}
                      className="hover:underline"
                    >
                      {c.fullName}
                    </Link>
                    <span className="text-muted-foreground text-xs">{c.id}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>أحدث الدفعات</CardTitle>
          </CardHeader>
          <CardContent>
            {!latestPayments.data || latestPayments.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد دفعات بعد.</p>
            ) : (
              <ul className="space-y-1">
                {latestPayments.data.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-card"
                  >
                    <span className="truncate">{p.childName}</span>
                    <span className="text-muted-foreground text-xs">
                      {p.monthLabel}
                    </span>
                    <span className="font-medium">{formatUSD(p.amountUsd)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <ReceiptIcon className="inline size-4 ms-1" /> أحدث الإقرارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!latestReceipts.data || latestReceipts.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                لا توجد إقرارات استلام بعد.
              </p>
            ) : (
              <ul className="space-y-1">
                {latestReceipts.data.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-card"
                  >
                    <span className="truncate">{r.childName}</span>
                    <span className="text-muted-foreground text-xs">
                      {r.monthLabel} — {formatDate(r.dateSent)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المنحنى الشهري للصرف</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={trend.data ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertIcon({ severity }: { severity: "critical" | "warning" | "info" }) {
  if (severity === "critical")
    return <AlertTriangleIcon className="size-4 text-red-500 mt-0.5" />;
  if (severity === "warning")
    return <AlertTriangleIcon className="size-4 text-amber-500 mt-0.5" />;
  return <InfoIcon className="size-4 text-sky-500 mt-0.5" />;
}

function SeverityBadge({ severity }: { severity: "critical" | "warning" | "info" }) {
  if (severity === "critical") return <Badge variant="destructive">خطر</Badge>;
  if (severity === "warning") return <Badge variant="warning">متوسط</Badge>;
  return <Badge variant="info">طبيعي</Badge>;
}

function TrendChart({ data }: { data: { monthKey: string; total: number; count: number }[] }) {
  if (data.length === 0)
    return <p className="text-sm text-muted-foreground">لا توجد بيانات للعرض.</p>;
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex items-end gap-2 h-40 overflow-x-auto py-2">
      {data.map((d) => {
        const h = Math.max(4, Math.round((d.total / max) * 140));
        return (
          <div
            key={d.monthKey}
            className="flex flex-col items-center gap-1 min-w-12"
            title={`${monthLabelFromKey(d.monthKey)}: ${formatUSD(d.total)}`}
          >
            <div
              className="w-8 rounded-t bg-primary/80"
              style={{ height: `${h}px` }}
            />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {monthLabelFromKey(d.monthKey)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
