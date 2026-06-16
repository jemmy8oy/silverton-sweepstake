import type { ReactNode } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
};

export default function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className
}: ErrorStateProps) {
  return (
    <Alert variant="destructive" className={cn("gap-3", className)}>
      <AlertTriangleIcon className="size-5" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      {action ? <div className="mt-2">{action}</div> : null}
    </Alert>
  );
}
