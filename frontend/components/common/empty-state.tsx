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
    <div className={cn("grid place-items-center gap-2 px-4 py-8 text-center", className)}>
      <div className="grid h-10 w-10 place-items-center border-2 border-foreground bg-accent text-accent-foreground">
        {icon ?? <FileQuestionIcon className="size-4" />}
      </div>
      <strong className="font-display text-xl font-black leading-none">{title}</strong>
      {description ? <div className="max-w-md text-xs leading-5 text-muted-foreground">{description}</div> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
