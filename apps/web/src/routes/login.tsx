import { Button } from "@kaheteyn/ui/components/button";
import { Input } from "@kaheteyn/ui/components/input";
import { Label } from "@kaheteyn/ui/components/label";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/logo";
import { getUser } from "@/functions/get-user";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  beforeLoad: async () => {
    const session = await getUser();
    if (session) throw redirect({ to: "/dashboard" });
  },
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const signIn = useMutation({
    mutationFn: async () => {
      const result = await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) throw new Error(result.error.message ?? "تعذّر تسجيل الدخول");
      return result.data;
    },
    onSuccess: () => {
      toast.success("تم تسجيل الدخول");
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  return (
    <div className="min-h-svh grid place-items-center px-4 bg-gradient-to-br from-background to-accent/30">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h1 className="text-center text-xl font-bold mb-1">تسجيل دخول المدير</h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          نظام إدارة كفالة الأيتام
        </p>
        <p className="text-center text-xs text-muted-foreground italic mb-6 px-4">
          يَا قَوْمِ ادْخُلُوا الأَرْضَ المُقَدَّسَةَ الَّتِي كَتَبَ اللّهُ لَكُمْ وَلاَ تَرْتَدُّوا عَلَى أَدْبَارِكُمْ فَتَنقَلِبُوا خَاسِرِينَ
        </p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            signIn.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={signIn.isPending}>
            {signIn.isPending ? "جاري الدخول..." : "دخول"}
          </Button>
        </form>
      </div>
    </div>
  );
}
