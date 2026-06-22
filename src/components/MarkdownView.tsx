import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

interface Props {
  source: string;
  className?: string;
}

marked.setOptions({ breaks: true, gfm: true });

export function MarkdownView({ source, className }: Props) {
  const html = useMemo(() => {
    const raw = marked.parse(source ?? '', { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [source]);
  return (
    <div
      className={`md-body ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
