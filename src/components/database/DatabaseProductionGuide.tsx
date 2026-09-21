import React from 'react';

export type DatabaseGuideSection = 'architecture' | 'design' | 'correctness' | 'operations';
type DatabaseGuideDeepTarget = 'sql' | 'nosql';

const articleIdBySection: Record<DatabaseGuideSection, string> = {
  architecture: 'database-architecture-scaling',
  design: 'database-design-performance',
  correctness: 'database-correctness-reliability',
  operations: 'database-production-operations',
};

function isDatabaseGuideSection(value: unknown): value is DatabaseGuideSection {
  return typeof value === 'string' && value in articleIdBySection;
}

function isDatabaseGuideDeepTarget(value: unknown): value is DatabaseGuideDeepTarget {
  return value === 'sql' || value === 'nosql';
}

const MINIMUM_FRAME_HEIGHT = 320;
const MAXIMUM_FRAME_HEIGHT = 1_000_000;

function readDocumentHeight(document: Document): number {
  const activePage = document.querySelector<HTMLElement>('.page.on:not([hidden])');
  if (!activePage) return 0;

  const layout = activePage.closest<HTMLElement>('.layout');
  const bottomPadding = layout ? Number.parseFloat(getComputedStyle(layout).paddingBottom) || 0 : 0;
  const contentHeight = activePage.offsetTop + activePage.scrollHeight + bottomPadding;
  return Math.ceil(layout ? Math.max(contentHeight, layout.scrollHeight) : contentHeight);
}

function isUsableFrameHeight(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= MINIMUM_FRAME_HEIGHT
    && value <= MAXIMUM_FRAME_HEIGHT;
}

export function getDatabaseGuideSrc(
  baseUrl: string = import.meta.env.BASE_URL,
  section: DatabaseGuideSection = 'correctness',
  deepTarget?: DatabaseGuideDeepTarget,
): string {
  const deepQuery = section === 'correctness' && deepTarget ? `&deep=${deepTarget}` : '';
  return `${baseUrl}database/database-production-guide.html?section=${section}${deepQuery}`;
}

export function DatabaseProductionGuide({ section, onOpenArticle }: { section: DatabaseGuideSection; onOpenArticle?: (articleId: string) => void }) {
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = React.useState(MINIMUM_FRAME_HEIGHT);
  const [deepTarget, setDeepTarget] = React.useState<DatabaseGuideDeepTarget>();
  const updateFrameHeight = React.useCallback((height: unknown) => {
    if (isUsableFrameHeight(height)) setFrameHeight(height);
  }, []);
  const measureSameOriginFrame = React.useCallback(() => {
    const frameDocument = frameRef.current?.contentDocument;
    if (frameDocument) updateFrameHeight(readDocumentHeight(frameDocument));
  }, [updateFrameHeight]);
  const sendHostTheme = React.useCallback(() => {
    const theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    frameRef.current?.contentWindow?.postMessage({ type: 'database-guide-theme', theme }, window.location.origin);
  }, []);
  const handleLoad = React.useCallback(() => {
    sendHostTheme();
    measureSameOriginFrame();
  }, [measureSameOriginFrame, sendHostTheme]);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data: unknown = event.data;
      if (typeof data !== 'object' || data === null) return;

      const message = data as { type?: unknown; section?: unknown; deep?: unknown; height?: unknown };
      if (
        event.origin !== window.location.origin
        || event.source !== frameRef.current?.contentWindow
      ) return;

      if (message.type === 'database-guide-height') {
        updateFrameHeight(message.height);
        return;
      }

      if (message.type === 'database-guide-navigate' && isDatabaseGuideSection(message.section)) {
        if (message.section === 'correctness' && isDatabaseGuideDeepTarget(message.deep)) {
          setDeepTarget(message.deep);
        }
        onOpenArticle?.(articleIdBySection[message.section]);
      }
    };

    window.addEventListener('message', onMessage);
    window.addEventListener('knowledge-theme-change', sendHostTheme);
    sendHostTheme();
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('knowledge-theme-change', sendHostTheme);
    };
  }, [onOpenArticle, sendHostTheme, updateFrameHeight]);

  React.useEffect(() => {
    if (section !== 'correctness') setDeepTarget(undefined);
  }, [section]);

  return (
    <iframe
      ref={frameRef}
      title="Database Production Essentials"
      src={getDatabaseGuideSrc(import.meta.env.BASE_URL, section, deepTarget)}
      onLoad={handleLoad}
      style={{ border: 0, display: 'block', height: `${frameHeight}px`, minHeight: `${MINIMUM_FRAME_HEIGHT}px`, width: '100%' }}
    />
  );
}
