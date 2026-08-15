import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, CircularProgress, Typography } from '@mui/material';
import { cleanLearnerFacingExamMarkup } from './cleanLearnerFacingExamMarkup';

const borderMuted = '#e2e8f0';

function markdownNodeText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(markdownNodeText).join('');
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return markdownNodeText(props.children);
  }
  return '';
}

function isHiddenGridCell(text: string): boolean {
  const t = text.replace(/\u00a0/g, ' ').trim();
  return /^(·|⋅|∙|•|\.|HIDDEN)$/i.test(t);
}

function isTargetGridCell(text: string): boolean {
  const t = text.replace(/[*_]/g, '').replace(/\u00a0/g, ' ').trim();
  return t === '[?]' || t === '?' || t === '??';
}

const markdownTableCellSx = {
  border: `1px solid ${borderMuted}`,
  px: 1.5,
  py: 1.1,
  verticalAlign: 'middle',
  fontSize: '1.05rem',
  lineHeight: 1.45,
  whiteSpace: 'nowrap',
  bgcolor: '#fff',
} as const;

export function looksLikeExamMarkdown(s: string): boolean {
  return /!\[[^\]]*]\(|^#{1,6}\s|```|<svg\b|<img\b|^\|.+\|/m.test(s);
}

export function markdownFromStimulus(stimulus: unknown, stimulusType?: string | null): string {
  if (stimulus == null) return '';
  if (typeof stimulus === 'string' && looksLikeExamMarkdown(stimulus)) return stimulus.trim();
  if (typeof stimulus === 'object' && !Array.isArray(stimulus)) {
    const rec = stimulus as Record<string, unknown>;
    const type = typeof rec.type === 'string' ? rec.type : stimulusType;
    const body = rec.body_markdown;
    if ((type === 'markdown' || looksLikeExamMarkdown(String(body ?? ''))) && typeof body === 'string') {
      return body.trim();
    }
  }
  return '';
}

const MarkdownImage: React.FC<{ src?: string; alt?: string; compact?: boolean }> = ({
  src,
  alt,
  compact,
}) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(src ? 'loading' : 'error');
  return (
    <Box
      sx={{
        position: 'relative',
        my: compact ? 0.75 : 1.5,
        borderRadius: 1,
        border: `1px solid ${borderMuted}`,
        bgcolor: '#fff',
        overflow: 'hidden',
        minHeight: status === 'loading' ? 72 : undefined,
      }}
    >
      {status === 'loading' ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={22} sx={{ color: '#10408b' }} />
        </Box>
      ) : null}
      {status === 'error' ? (
        <Typography variant="caption" sx={{ display: 'block', color: '#64748b', p: 1.25 }}>
          {alt || 'Image failed to load'}
        </Typography>
      ) : (
        <Box
          component="img"
          src={src}
          alt={alt ?? ''}
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('error')}
          sx={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            visibility: status === 'ready' ? 'visible' : 'hidden',
          }}
        />
      )}
    </Box>
  );
};

export function shouldRenderStructuredStimulus(
  stimulus: unknown,
  stimulusType?: string | null
): boolean {
  if (stimulus == null) return false;
  if (stimulusType === 'markdown') return false;
  return !markdownFromStimulus(stimulus, stimulusType);
}

export const ExamRichPrompt: React.FC<{
  prompt: string;
  stimulus?: unknown;
  stimulusType?: string | null;
  emptyLabel?: string;
}> = ({ prompt, stimulus, stimulusType, emptyLabel = '(no prompt)' }) => {
  const stimMd = markdownFromStimulus(stimulus, stimulusType);
  const body = stimMd.length > prompt.length ? stimMd : prompt;
  if (looksLikeExamMarkdown(body)) {
    return <ExamMarkdown>{body || emptyLabel}</ExamMarkdown>;
  }
  return (
    <Typography
      sx={{
        color: '#0f172a',
        fontSize: 14,
        mb: 1,
        lineHeight: 1.45,
        whiteSpace: 'pre-wrap',
      }}
    >
      {prompt || emptyLabel}
    </Typography>
  );
};

export const ExamMarkdown: React.FC<{
  children: string;
  compact?: boolean;
}> = ({ children, compact = false }) => {
  const markdown = cleanLearnerFacingExamMarkup(children);
  if (!markdown.trim()) return null;

  return (
    <Box
      sx={{
        color: '#334155',
        fontSize: compact ? '0.88rem' : { xs: '0.95rem', sm: '1rem' },
        lineHeight: 1.65,
        '& p': { mb: compact ? 0.75 : 1.5, mt: 0 },
        '& p:last-child': { mb: 0 },
        '& h1, & h2, & h3, & h4': {
          fontSize: '1.05rem',
          fontWeight: 700,
          color: '#0f172a',
          mb: 1,
          mt: compact ? 1 : 2,
        },
        '& ul, & ol': { pl: 2.5, mb: 1.5 },
        '& li': { mb: 0.5 },
        '& code': { fontSize: '0.88em', bgcolor: '#f1f5f9', px: 0.5, borderRadius: 0.5 },
        '& pre': {
          overflowX: 'auto',
          my: 1.5,
          p: 1.5,
          borderRadius: 1,
          border: `1px solid ${borderMuted}`,
          bgcolor: '#f8fafc',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '0.88rem',
          lineHeight: 1.55,
          whiteSpace: 'pre',
          '& code': { bgcolor: 'transparent', px: 0, fontSize: 'inherit' },
        },
        '& svg': {
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          my: 1.5,
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }: { src?: string; alt?: string }) => (
            <MarkdownImage src={src} alt={alt} compact={compact} />
          ),
          table: ({ children }: { children?: React.ReactNode }) => (
            <Box sx={{ overflowX: 'auto', my: 2, maxWidth: '100%' }}>
              <Box
                component="table"
                sx={{
                  borderCollapse: 'collapse',
                  borderSpacing: 0,
                  width: 'max-content',
                  minWidth: 240,
                  border: `1px solid ${borderMuted}`,
                  bgcolor: '#fff',
                }}
              >
                {children}
              </Box>
            </Box>
          ),
          thead: ({ children }: { children?: React.ReactNode }) => {
            const text = markdownNodeText(children).replace(/\s/g, '');
            if (!text) return null;
            return <thead>{children}</thead>;
          },
          th: ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => (
            <Box
              component="th"
              style={style}
              sx={{
                ...markdownTableCellSx,
                bgcolor: '#f8fafc',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: '#475569',
                letterSpacing: 0.02,
                textTransform: 'none',
              }}
            >
              {children}
            </Box>
          ),
          td: ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => {
            const text = markdownNodeText(children);
            const hidden = isHiddenGridCell(text);
            const target = isTargetGridCell(text);
            return (
              <Box
                component="td"
                style={style}
                sx={{
                  ...markdownTableCellSx,
                  minWidth: hidden || target ? 88 : 56,
                  textAlign: hidden || target ? 'center' : style?.textAlign,
                  bgcolor: target ? '#eff6ff' : hidden ? '#f8fafc' : '#fff',
                  fontWeight: target ? 800 : 400,
                  color: hidden ? '#64748b' : '#0f172a',
                  fontSize: hidden ? '0.72rem' : markdownTableCellSx.fontSize,
                  letterSpacing: hidden ? 0.06 : undefined,
                  textTransform: hidden ? 'uppercase' : undefined,
                  fontFamily: hidden ? 'Inter, system-ui, sans-serif' : 'inherit',
                }}
              >
                {hidden ? 'HIDDEN' : children}
              </Box>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </Box>
  );
};
