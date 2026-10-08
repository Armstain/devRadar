// A sample reading shown before anyone has scanned: a believable profile
// against a frontend role, with one gap. Used on the landing and auth pages.
export const SAMPLE_AXES = [
  { label: "Frontend", value: 0.67, target: 1 },
  { label: "Backend", value: 0.77, target: 0.65 },
  { label: "Data", value: 0.59, target: 0.08 },
  { label: "DevOps", value: 0.79, target: 0.08 },
  { label: "Quality", value: 0.68, target: 0.75 },
  { label: "AI / ML", value: 0.51, target: 0.08 },
].map((a) => ({ ...a, detail: String(Math.round(a.value * 100)) }))

export const SAMPLE_GAP = { axis: 1, label: "GraphQL" }

export const SAMPLE_LABEL = "A sample skill radar: strong in DevOps and Backend, with a GraphQL gap against a frontend role."
