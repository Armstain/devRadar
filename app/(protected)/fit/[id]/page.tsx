"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FitReport } from "@/components/fit/fit-report";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobPost } from "@/hooks/use-job-posts";

export default function FitReportPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useJobPost(id);

  return (
    <div className="flex flex-col gap-5">
      {isLoading ? (
        <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading the fit report">
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : isError || !data ? (
        <Panel className="flex flex-col items-start gap-3 p-8">
          <p className="font-medium">This fit report doesn’t exist, or it isn’t yours.</p>
          <Button asChild variant="secondary">
            <Link href="/fit">Analyse a job post</Link>
          </Button>
        </Panel>
      ) : (
        <FitReport view={data} />
      )}
    </div>
  );
}
