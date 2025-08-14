import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export default function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  const markdownComponents: Components = {
    code({className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match;
      return isInline ? (
        <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200" {...props}>
          {children}
        </code>
      ) : (
        <div className="relative group">
          <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-200 hover:bg-slate-700"
              onClick={() => navigator.clipboard.writeText(String(children))}
            >
              Copy
            </button>
          </div>
          <SyntaxHighlighter
            language={match[1]}
            style={vscDarkPlus as any}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              padding: '1.5rem',
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    },
    table({children, ...props}) {
      return (
        <div className="my-6 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700" {...props}>
            {children}
          </table>
        </div>
      );
    },
    thead({children, ...props}) {
      return (
        <thead className="bg-slate-50 dark:bg-slate-800/50" {...props}>
          {children}
        </thead>
      );
    },
    th({children, ...props}) {
      return (
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
          {...props}
        >
          {children}
        </th>
      );
    },
    td({children, ...props}) {
      return (
        <td 
          className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200"
          {...props}
        >
          {children}
        </td>
      );
    },
    blockquote({children, ...props}) {
      return (
        <blockquote 
          className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 my-4 italic text-slate-700 dark:text-slate-300"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    a({children, href, ...props}) {
      return (
        <a 
          href={href}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      <div className="p-6">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
} 