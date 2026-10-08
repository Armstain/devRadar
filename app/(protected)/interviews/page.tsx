"use client";

import { useState } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Sparkles } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const DIFFICULTIES = [
  { value: "beginner", label: "Junior" },
  { value: "intermediate", label: "Mid-level" },
  { value: "advanced", label: "Senior" },
] as const;

const SUGGESTIONS = ["React performance", "System design", "PostgreSQL indexing", "Node.js streams", "Testing strategy"];

export default function InterviewPrepPage() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<string>("intermediate");
  const [count, setCount] = useState(5);
  const [result, setResult] = useState<{ topic: string; text: string } | null>(null);

  const generate = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post<string>("/api/interview-questions/generate", { topic, difficulty, count });
      return data;
    },
    onSuccess: (text) => setResult({ topic: topic.trim(), text }),
    onError: (error) => {
      const response = axios.isAxiosError(error) ? error.response : undefined;
      if (response?.status === 400) {
        toast.error("Enter a topic (2–100 characters) and 1–10 questions");
      } else {
        const message = (response?.data as { error?: string } | undefined)?.error;
        toast.error(message ?? "Couldn’t generate questions. Please try again.");
      }
    },
  });

  const canSubmit = topic.trim().length >= 2 && !generate.isPending;

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-[-0.025em]">Interview prep</h1>
        <p className="max-w-2xl text-ink-soft">
          Practice questions for any topic, with what the interviewer is listening for and the points a strong answer covers.
        </p>
      </header>

      <Panel>
        <form
          className="flex flex-col gap-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) generate.mutate();
          }}
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_120px]">
            <Field label="Topic" htmlFor="topic">
              <Input
                id="topic"
                value={topic}
                maxLength={100}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. React hooks, system design, SQL joins"
              />
            </Field>
            <Field label="Level" htmlFor="difficulty">
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Questions" htmlFor="count">
              <Input
                id="count"
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                className="tabular"
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2" aria-label="Suggested topics">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTopic(s)}
                  className="min-h-8 rounded-full border border-line px-3 text-[13px] text-muted transition-colors hover:border-muted/50 hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
            <Button type="submit" disabled={!canSubmit}>
              <Sparkles aria-hidden="true" />
              {generate.isPending ? "Generating…" : "Generate questions"}
            </Button>
          </div>
        </form>
      </Panel>

      <div aria-live="polite" aria-busy={generate.isPending}>
        {generate.isPending ? (
          <Panel className="flex flex-col gap-3 p-8">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="mt-4 h-6 w-2/5" />
            <Skeleton className="h-4 w-full" />
          </Panel>
        ) : result ? (
          <Panel>
            <article className="mx-auto max-w-3xl p-8">
              <span className="label-quiet">{result.topic}</span>
              <div className="mt-4">
                <Markdown>{result.text}</Markdown>
              </div>
            </article>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
