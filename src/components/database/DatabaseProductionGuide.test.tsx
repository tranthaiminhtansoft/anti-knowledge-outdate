// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import guideHtml from '../../../public/database/database-production-guide.html?raw';
import { DatabaseProductionGuide, getDatabaseGuideSrc } from './DatabaseProductionGuide';

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
});

const sections = [
  ['architecture', 'database-architecture-scaling'],
  ['design', 'database-design-performance'],
  ['correctness', 'database-correctness-reliability'],
  ['operations', 'database-production-operations'],
] as const;

describe('DatabaseProductionGuide', () => {
  it.each(sections)('embeds the preserved standalone guide for %s using its section query contract', (section) => {
    render(<DatabaseProductionGuide section={section} />);

    expect(screen.getByTitle('Database Production Essentials').getAttribute('src')).toBe(
      `/database/database-production-guide.html?section=${section}`,
    );
  });

  it('builds the iframe source from the configured Vite base path without a root-relative asset URL', () => {
    expect(getDatabaseGuideSrc('/anti-knowledge-outdate/')).toBe(
      '/anti-knowledge-outdate/database/database-production-guide.html?section=correctness',
    );
    expect(getDatabaseGuideSrc('/')).toBe('/database/database-production-guide.html?section=correctness');
    expect(getDatabaseGuideSrc('/anti-knowledge-outdate/', 'correctness', 'nosql')).toBe(
      '/anti-knowledge-outdate/database/database-production-guide.html?section=correctness&deep=nosql',
    );
  });

  it('keeps standalone deep links and posts the database navigation contract to the same origin', () => {
    expect(guideHtml).toContain('data-deep="sql"');
    expect(guideHtml).toContain('data-deep="nosql"');
    expect(guideHtml).toContain("window.parent.postMessage({ type: 'database-guide-navigate', section: 'correctness', deep: btn.dataset.deep }, window.location.origin)");
    expect(guideHtml).toContain('deep: btn.dataset.deep');
    expect(guideHtml).toContain("initialDeep==='sql'||initialDeep==='nosql'");
    expect(guideHtml).toContain("show('correctness');selectCorrect(btn.dataset.deep)");
    expect(guideHtml).toContain("event.source === window.parent && event.data?.type === 'database-guide-theme'");
  });

  it('keeps the index example readable in the standalone light theme', () => {
    expect(guideHtml).toContain(':root[data-host-theme="light"] body.database-outer-route .index-example{');
    expect(guideHtml).toContain(':root[data-host-theme="light"] body.database-outer-route .index-example pre{');
    expect(guideHtml).toContain(':root[data-host-theme="light"] body.database-outer-route .index-example .index-status{');
  });

  it('uses explicit light-theme contrast for Design labels and muted supporting Load Balancer context', () => {
    expect(guideHtml).toContain(':root[data-host-theme="light"] body.database-outer-route .must article b{');
    expect(guideHtml).toContain(':root[data-host-theme="light"] body.database-outer-route .query-path span{');
    expect(guideHtml).toContain(':root[data-host-theme="light"] body.database-outer-route .deep-link{');
    expect(guideHtml).toContain(':root[data-host-theme="light"] body.database-outer-route .nosql-board.v2 .lb-supporting{');
  });

  it('keeps only in-lesson controls after Sections 2, 3, and 4', () => {
    const standalone = new DOMParser().parseFromString(guideHtml, 'text/html');

    ['design', 'correctness', 'operations'].forEach((sectionId) => {
      const section = standalone.getElementById(sectionId);
      expect(section?.querySelector('.next')).toBeNull();
      expect(section?.querySelector('[data-to]')).toBeNull();
    });
  });

  it('marks the Load Balancer as supporting context and measures only visible guide content', () => {
    expect(guideHtml).toContain('class="lb lb-supporting"');
    expect(guideHtml).toContain('.lb-supporting{');
    expect(guideHtml).toContain('const activePage = document.querySelector(\'.page.on:not([hidden])\');');
    expect(guideHtml).toContain('activePage.offsetTop + activePage.scrollHeight');
    expect(guideHtml).not.toContain('Math.max(root.scrollHeight, root.offsetHeight, body?.scrollHeight ?? 0, body?.offsetHeight ?? 0)');
  });

  it.each(sections)('maps standalone navigation messages for %s back to its canonical article', (section, articleId) => {
    const onOpenArticle = vi.fn();
    render(<DatabaseProductionGuide section="architecture" onOpenArticle={onOpenArticle} />);
    const frame = screen.getByTitle('Database Production Essentials') as HTMLIFrameElement;

    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'database-guide-navigate', section },
      origin: window.location.origin,
      source: frame.contentWindow,
    }));

    expect(onOpenArticle).toHaveBeenCalledWith(articleId);
  });

  it('ignores malformed, cross-origin, and non-frame navigation messages', () => {
    const onOpenArticle = vi.fn();
    render(<DatabaseProductionGuide section="architecture" onOpenArticle={onOpenArticle} />);

    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'database-guide-navigate', section: 'invalid' },
      origin: window.location.origin,
    }));
    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'database-guide-navigate', section: 'design' },
      origin: 'https://untrusted.example',
    }));

    expect(onOpenArticle).not.toHaveBeenCalled();
  });

  it('sizes the frame from a validated same-origin height message', () => {
    render(<DatabaseProductionGuide section="architecture" />);
    const frame = screen.getByTitle('Database Production Essentials') as HTMLIFrameElement;

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'database-guide-height', height: 1080 },
        origin: window.location.origin,
        source: frame.contentWindow,
      }));
    });

    expect(frame.style.height).toBe('1080px');

    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'database-guide-height', height: -1 },
      origin: window.location.origin,
      source: frame.contentWindow,
    }));
    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'database-guide-height', height: 99999999 },
      origin: window.location.origin,
      source: frame.contentWindow,
    }));
    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'database-guide-height', height: 1440 },
      origin: 'https://untrusted.example',
      source: frame.contentWindow,
    }));

    expect(frame.style.height).toBe('1080px');
  });

  it('sends the current host theme to the iframe on load and when the host theme changes', () => {
    document.documentElement.dataset.theme = 'light';
    render(<DatabaseProductionGuide section="architecture" />);
    const frame = screen.getByTitle('Database Production Essentials') as HTMLIFrameElement;
    const postMessage = vi.spyOn(frame.contentWindow!, 'postMessage');
    const message = { type: 'database-guide-theme', theme: 'light' };

    fireEvent.load(frame);
    expect(postMessage).toHaveBeenCalledWith(message, window.location.origin);

    postMessage.mockClear();
    window.dispatchEvent(new CustomEvent('knowledge-theme-change', { detail: 'light' }));
    expect(postMessage).toHaveBeenCalledWith(message, window.location.origin);
  });
});
