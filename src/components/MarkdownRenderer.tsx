import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-body space-y-3 leading-relaxed text-[15px] break-words">
      {parseMarkdown(content)}
    </div>
  );
};

function parseMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    // Code Block ```lang
    if (line.trim().startsWith('```')) {
      const match = line.trim().match(/^```([a-zA-Z0-9_-]*)/);
      const language = match ? match[1] || 'plaintext' : 'plaintext';
      const codeLines: string[] = [];
      index++;

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index++;
      }
      index++; // skip closing ```

      const codeString = codeLines.join('\n');
      elements.push(
        <CodeBlock key={`code-${index}`} language={language} code={codeString} />
      );
      continue;
    }

    // Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      elements.push(
        <hr key={`hr-${index}`} className="my-4 border-t border-slate-200 dark:border-slate-700/80" />
      );
      index++;
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${index}`} className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800">
          {formatInline(line.slice(2))}
        </h1>
      );
      index++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${index}`} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1.5">
          {formatInline(line.slice(3))}
        </h2>
      );
      index++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mt-2 mb-1">
          {formatInline(line.slice(4))}
        </h3>
      );
      index++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [line.slice(2)];
      index++;
      while (index < lines.length && lines[index].startsWith('> ')) {
        quoteLines.push(lines[index].slice(2));
        index++;
      }
      elements.push(
        <blockquote key={`quote-${index}`} className="border-l-4 border-indigo-500 pl-4 py-1 italic bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-700 dark:text-slate-300 rounded-r">
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx}>{formatInline(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Unordered List (- or *)
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        listItems.push(lines[index].replace(/^\s*[-*]\s+/, ''));
        index++;
      }
      elements.push(
        <ul key={`ul-${index}`} className="list-disc list-outside pl-6 space-y-1 text-slate-800 dark:text-slate-200">
          {listItems.map((item, liIdx) => (
            <li key={liIdx}>{formatInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List (1. 2. etc)
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        listItems.push(lines[index].replace(/^\s*\d+\.\s+/, ''));
        index++;
      }
      elements.push(
        <ol key={`ol-${index}`} className="list-decimal list-outside pl-6 space-y-1 text-slate-800 dark:text-slate-200">
          {listItems.map((item, liIdx) => (
            <li key={liIdx}>{formatInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Table detection: line with | and next line with |--|
    if (line.trim().startsWith('|') && index + 1 < lines.length && lines[index + 1].includes('|-')) {
      const headerLine = line;
      const delimiterLine = lines[index + 1];
      const rows: string[] = [];
      index += 2;

      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(lines[index]);
        index++;
      }

      const headers = headerLine.split('|').map(s => s.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      
      elements.push(
        <div key={`table-wrapper-${index}`} className="overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/80">
              <tr>
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                    {formatInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950/40">
              {rows.map((row, rIdx) => {
                const cells = row.split('|').map(s => s.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
                return (
                  <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {formatInline(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      index++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${index}`} className="text-slate-800 dark:text-slate-200 leading-relaxed">
        {formatInline(line)}
      </p>
    );
    index++;
  }

  return elements;
}

function formatInline(text: string): React.ReactNode {
  // Split by inline code first: `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, pIdx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={`code-inline-${pIdx}`}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-[13px] border border-slate-200/60 dark:border-slate-700/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Handle Bold **text** and Italic *text*
    return formatBoldAndItalic(part, pIdx);
  });
}

function formatBoldAndItalic(text: string, parentKey: number): React.ReactNode {
  // Regex to match **bold** or *italic*
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, tIdx) => {
    const key = `${parentKey}-${tIdx}`;

    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={key} className="font-semibold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }

    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={key} className="italic text-slate-800 dark:text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    }

    return token;
  });
}

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Failed to copy code:', e);
    }
  };

  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-slate-800 bg-[#0f141c] text-slate-100 shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
        <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-indigo-400">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-[13px] font-mono leading-relaxed overflow-x-auto text-emerald-300">
        <code>{code}</code>
      </pre>
    </div>
  );
};
