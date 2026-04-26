import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="h-20 w-20 rounded-full border border-border/60 flex items-center justify-center mb-6">
        <Icon className="h-7 w-7 text-muted-foreground" strokeWidth={1.25} />
      </div>
      <h3 className="font-serif text-2xl mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-md leading-relaxed mb-6 text-sm">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
