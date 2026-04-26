import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function DataTableEmpty({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="border border-dashed border-border bg-muted/20 py-20 px-6 flex flex-col items-center text-center">
      <div className="h-14 w-14 rounded-full border border-border bg-background flex items-center justify-center mb-5">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="font-serif text-xl mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}
