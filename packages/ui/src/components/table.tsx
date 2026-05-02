import { cn } from "@kaheteyn/ui/lib/utils";
import * as React from "react";

const Table = React.forwardRef<HTMLTableElement, React.ComponentProps<"table">>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = ({ className, ...props }: React.ComponentProps<"thead">) => (
  <thead className={cn("[&_tr]:border-b bg-muted/40", className)} {...props} />
);
const TableBody = ({ className, ...props }: React.ComponentProps<"tbody">) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);
const TableRow = ({ className, ...props }: React.ComponentProps<"tr">) => (
  <tr
    className={cn("border-b transition-colors hover:bg-muted/50", className)}
    {...props}
  />
);
const TableHead = ({ className, ...props }: React.ComponentProps<"th">) => (
  <th
    className={cn(
      "h-10 px-3 text-start align-middle font-medium text-muted-foreground",
      className,
    )}
    {...props}
  />
);
const TableCell = ({ className, ...props }: React.ComponentProps<"td">) => (
  <td className={cn("p-3 align-middle", className)} {...props} />
);

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
