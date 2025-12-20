'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={`prose prose-forest max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h2: ({ children }) => (
            <h2 className="font-display text-xl font-semibold text-forest mt-6 mb-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-display text-lg font-semibold text-forest mt-4 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-bark/80 font-body leading-relaxed mb-4 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-bark/80 font-body mb-4 space-y-1">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className="text-bark/80">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-forest">{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
