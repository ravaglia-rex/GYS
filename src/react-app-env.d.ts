/// <reference types="react-scripts" />

declare module 'react-markdown' {
  import type { ComponentType, ReactNode } from 'react';

  export type Components = {
    img?: ComponentType<{ src?: string; alt?: string }>;
    [tag: string]: ComponentType<Record<string, unknown>> | undefined;
  };

  const ReactMarkdown: ComponentType<{
    children?: ReactNode;
    remarkPlugins?: unknown[];
    components?: Components;
  }>;
  export default ReactMarkdown;
}

declare module 'remark-gfm' {
  const remarkGfm: () => unknown;
  export default remarkGfm;
}
