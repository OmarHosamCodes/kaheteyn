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
    <div className="login-bg min-h-svh grid place-items-center px-4">
      <style>{`
        @keyframes flag-float {
          0%   { transform: scale(1.18) translate(0%, 0%); }
          30%  { transform: scale(1.22) translate(-1.5%, -0.8%); }
          60%  { transform: scale(1.2)  translate(1%, 0.6%); }
          100% { transform: scale(1.18) translate(0%, 0%); }
        }
        .login-bg {
          position: relative;
          overflow: hidden;
          background: oklch(0.97 0.004 145);
        }
        .login-bg::before {
          content: '';
          position: absolute;
          inset: -10%;
          background-image: url('/flag.png');
          background-size: cover;
          background-position: center;
          animation: flag-float 18s ease-in-out infinite;
          filter: brightness(0.92) saturate(1.1);
          z-index: 0;
        }
        .login-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 75% 65% at 50% 50%, oklch(0.97 0.004 145 / 0.2) 0%, oklch(0.97 0.004 145 / 0.55) 100%);
          z-index: 1;
        }
        .login-card {
          position: relative;
          z-index: 2;
        }
      `}</style>
      <div className="login-card w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h1 className="text-center text-xl font-bold mb-1">تسجيل دخول المدير</h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          نظام إدارة كفالة الأيتام
        </p>
        <p className="text-center text-xs text-muted-foreground mb-6 italic">
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
