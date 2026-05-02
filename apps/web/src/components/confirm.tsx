import * as React from "react";

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

const Ctx = React.createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = React.useState<(ConfirmOptions & { id: number }) | null>(null);
  const resolverRef = React.useRef<((v: boolean) => void) | null>(null);
  const idRef = React.useRef(0);

  const confirm = React.useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      idRef.current += 1;
      setOpts({ ...options, id: idRef.current });
    });
  }, []);

  function close(value: boolean) {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOpts(null);
  }

  return (
    <Ctx.Provider value={{ confirm }}>
      {children}
      {opts ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
          onClick={() => close(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">{opts.title}</h2>
            {opts.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{opts.description}</p>
            ) : null}
            <div className="mt-6 flex flex-row-reverse gap-2">
              <button
                type="button"
                onClick={() => close(true)}
                className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors ${
                  opts.variant === "destructive"
                    ? "bg-destructive text-white hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {opts.confirmLabel ?? "تأكيد"}
              </button>
              <button
                type="button"
                onClick={() => close(false)}
                className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted"
              >
                {opts.cancelLabel ?? "إلغاء"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

export function useConfirm() {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("useConfirm must be used inside ConfirmProvider");
  return c.confirm;
}
