"use client";

import { useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateApplication, useUpdateApplication } from "@/hooks/use-applications";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  applicationCreateSchema,
  type Application,
  type ApplicationInput,
  type ApplicationStatus,
} from "@/lib/applications";

// Validate with the same schema the API uses, so the rules match exactly.
const resolver: Resolver<ApplicationInput> = async (values) => {
  const result = applicationCreateSchema.safeParse(values);
  if (result.success) return { values: result.data, errors: {} };
  const errors: Record<string, { type: string; message: string }> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    errors[key] ??= { type: issue.code, message: issue.message };
  }
  return { values: {}, errors };
};

interface ApplicationDialogProps {
  application?: Application;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ApplicationDialog({ application, trigger, open: openProp, onOpenChange }: ApplicationDialogProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();

  const defaults: ApplicationInput = {
    company: application?.company ?? "",
    position: application?.position ?? "",
    status: application?.status ?? "applied",
    link: application?.link ?? "",
    notes: application?.notes ?? "",
  };

  const form = useForm<ApplicationInput>({ resolver, defaultValues: defaults });
  const { errors, isSubmitting } = form.formState;
  const status = useWatch({ control: form.control, name: "status" });

  const handleOpenChange = (next: boolean) => {
    if (next) form.reset(defaults);
    setOpen(next);
  };

  const onSubmit = async (data: ApplicationInput) => {
    try {
      if (application) {
        await updateApplication.mutateAsync({ id: application.id, update: data });
        toast.success("Application updated");
      } else {
        await createApplication.mutateAsync(data);
        toast.success(`Added ${data.company}`);
      }
      setOpen(false);
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Couldn’t save the application. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger !== null ? (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus aria-hidden="true" />
              Add application
            </Button>
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{application ? "Edit application" : "Add an application"}</DialogTitle>
          <DialogDescription>
            {application ? `${application.position} at ${application.company}` : "Track a role you’ve applied for or plan to."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" htmlFor="company" error={errors.company?.message}>
              <Input id="company" autoComplete="organization" placeholder="e.g. Lumen Labs" {...form.register("company")} />
            </Field>
            <Field label="Role" htmlFor="position" error={errors.position?.message}>
              <Input id="position" autoComplete="organization-title" placeholder="e.g. Full-stack Engineer" {...form.register("position")} />
            </Field>
          </div>
          <Field label="Stage" htmlFor="status">
            <Select value={status} onValueChange={(value) => form.setValue("status", value as ApplicationStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Job post link" htmlFor="link" error={errors.link?.message} hint="Optional">
            <Input id="link" type="url" inputMode="url" placeholder="https://" {...form.register("link")} />
          </Field>
          <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
            <Textarea id="notes" placeholder="Who you spoke to, what stood out, next steps…" {...form.register("notes")} />
          </Field>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : application ? "Save changes" : "Add application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
