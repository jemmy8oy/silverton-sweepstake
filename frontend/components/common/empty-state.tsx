import type { ReactNode } from "react";
import { FileQuestionIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export default function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div className={cn("brutal-surface grid place-items-center gap-3 px-6 py-16 text-center", className)}>
      <div className="grid h-14 w-14 place-items-center border-2 border-foreground bg-accent text-accent-foreground">
        {icon ?? <FileQuestionIcon className="size-6" />}
      </div>
      <strong className="font-display text-3xl font-black leading-none">{title}</strong>
      {description ? <div className="max-w-md text-sm leading-7 text-muted-foreground">{description}</div> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
