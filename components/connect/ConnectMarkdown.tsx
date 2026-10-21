import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function ConnectMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="connect-markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
