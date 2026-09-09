/// <reference types="node" />
// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DatabaseProductionGuide } from './DatabaseProductionGuide';

describe('DatabaseProductionGuide', () => {
  it('loads exactly one selected Database section without the source navigation', () => {
    render(<DatabaseProductionGuide section="architecture" />);

    const frame = screen.getByTitle('Database Production Essentials: Architecture & Scaling');
    expect(frame.getAttribute('src')).toBe('/database/database-production-guide.html?section=architecture');
    expect(frame.getAttribute('data-section')).toBe('architecture');
  });

  it('uses a separate iframe instance for every outer lesson route', () => {
    const { rerender } = render(<DatabaseProductionGuide section="design" />);
    expect(screen.getByTitle('Database Production Essentials: Design & Performance').getAttribute('src')).toBe('/database/database-production-guide.html?section=design');

    rerender(<DatabaseProductionGuide section="operations" />);
    expect(screen.getByTitle('Database Production Essentials: Production Operations').getAttribute('src')).toBe('/database/database-production-guide.html?section=operations');
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
