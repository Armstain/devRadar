"use client";

import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDeleteApplication } from "@/hooks/use-applications";
import type { Application } from "@/lib/applications";

interface DeleteApplicationProps {
  application: Application | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteApplication({ application, onOpenChange, onDeleted }: DeleteApplicationProps) {
  const remove = useDeleteApplication();

  const confirm = async () => {
    if (!application) return;
    try {
      await remove.mutateAsync(application.id);
      toast.success(`Deleted ${application.company}`);
      onOpenChange(false);
      onDeleted?.();
    } catch {
      toast.error("Couldn’t delete the application. Please try again.");
    }
  };

  return (
    <Dialog open={Boolean(application)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this application?</DialogTitle>
          <DialogDescription>
            {application ? `${application.position} at ${application.company} and its notes will be removed. This can’t be undone.` : null}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Keep it
          </Button>
          <Button variant="danger" onClick={confirm} disabled={remove.isPending}>
            {remove.isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
