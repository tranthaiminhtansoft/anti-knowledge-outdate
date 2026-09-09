/// <reference types="node" />
// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const productionBaseUrl = '/anti-knowledge-outdate/';

async function renderGuideAtProductionBase(section: 'architecture' | 'design' | 'correctness' | 'operations') {
  vi.stubEnv('BASE_URL', productionBaseUrl);
  const { DatabaseProductionGuide } = await import('./DatabaseProductionGuide');
  return render(<DatabaseProductionGuide section={section} />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('DatabaseProductionGuide', () => {
  it.each([
    ['architecture', 'Architecture & Scaling'],
    ['design', 'Design & Performance'],
    ['correctness', 'Correctness & Reliability'],
    ['operations', 'Production Operations'],
  ] as const)('loads the %s iframe below the configured Vite base path', async (section, title) => {
    await renderGuideAtProductionBase(section);

    const frame = screen.getByTitle(`Database Production Essentials: ${title}`);
    expect(frame.getAttribute('src')).toBe(
      `${productionBaseUrl}database/database-production-guide.html?section=${section}`,
    );
    expect(frame.getAttribute('data-section')).toBe(section);
  });

  it('updates the iframe source when the outer lesson route changes', async () => {
    vi.stubEnv('BASE_URL', productionBaseUrl);
    const { DatabaseProductionGuide } = await import('./DatabaseProductionGuide');
    const { rerender } = render(<DatabaseProductionGuide section="design" />);

    expect(screen.getByTitle('Database Production Essentials: Design & Performance').getAttribute('src')).toBe(
      `${productionBaseUrl}database/database-production-guide.html?section=design`,
    );

    rerender(<DatabaseProductionGuide section="operations" />);
    expect(screen.getByTitle('Database Production Essentials: Production Operations').getAttribute('src')).toBe(
      `${productionBaseUrl}database/database-production-guide.html?section=operations`,
    );
  });

  it('keeps the Payment History query visible and documents the composite-index states', () => {
    const lesson = readFileSync('public/database/database-production-guide.html', 'utf8');

    expect(lesson).toContain('SELECT * FROM payment_history');
    expect(lesson).toContain("WHERE user_id = $1 AND status = 'PAID'");
    expect(lesson).toContain('CREATE INDEX idx_payment_history_user_status_created_at');
    expect(lesson).toContain('Chưa tạo index — Full scan');
    expect(lesson).toContain('Demo: planner có thể chọn index scan/seek');
    expect(lesson).toContain('EXPLAIN (ANALYZE, BUFFERS)');
    expect(lesson).toContain('LIMIT 12');
  });
});
