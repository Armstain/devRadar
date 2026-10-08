import ReactMarkdown, { type Components } from "react-markdown"

// Typography for AI-generated markdown, styled with the Instrument tokens so it
// reads correctly in both themes.
const components: Components = {
  h1: ({ children }) => <h2 className="mb-3 mt-8 text-2xl font-semibold tracking-tight first:mt-0">{children}</h2>,
  h2: ({ children }) => <h2 className="mb-3 mt-8 text-xl font-semibold tracking-tight first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-7 text-lg font-semibold first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-2 mt-5 font-semibold">{children}</h4>,
  p: ({ children }) => <p className="my-3 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="my-3 flex list-disc flex-col gap-1.5 pl-5 marker:text-muted">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 flex list-decimal flex-col gap-1.5 pl-5 marker:font-semibold marker:text-brand">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="text-muted">{children}</em>,
  hr: () => <hr className="my-6 border-line" />,
  code: ({ children }) => <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>,
  pre: ({ children }) => <pre className="my-4 overflow-x-auto rounded-lg bg-raised p-4 font-mono text-sm">{children}</pre>,
  blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-brand pl-4 text-muted">{children}</blockquote>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand underline-offset-4 hover:underline">
      {children}
    </a>
  ),
}

export function Markdown({ children }: { children: string }) {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>
}
