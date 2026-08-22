/* @vitest-environment jsdom */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RagTrafficDiagram } from './RagTrafficDiagram';

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('RagTrafficDiagram', () => {
  it('renders both offline indexing and online query lanes with the full artifact path', () => {
    const { container } = render(<RagTrafficDiagram />);

    expect(screen.getByText('OFFLINE / INDEXING')).toBeTruthy();
    expect(screen.getByText('ONLINE / QUERY')).toBeTruthy();
    expect(screen.getByText('PDF / raw docs')).toBeTruthy();
    expect(screen.getByText('Grounded answer')).toBeTruthy();
    expect(container.querySelectorAll('.rag-packet')).toHaveLength(10);
    expect(container.querySelector('[data-stage="vector-db"]')).toBeTruthy();
  });

  it('reflows online stages 9–11 onto a lower row to keep the query lane readable', () => {
    const { container } = render(<RagTrafficDiagram />);
    const stage = (id: string) => container.querySelector<SVGGElement>(`[data-stage="${id}"]`);
    const rect = (id: string) => stage(id)?.querySelector<SVGRectElement>('rect');

    expect(container.querySelector('.rag-traffic-canvas svg')?.getAttribute('viewBox')).toBe('0 0 1240 800');
    expect(rect('question')?.getAttribute('y')).toBe('456');
    expect(rect('top-k')?.getAttribute('y')).toBe('456');
    expect(rect('question')?.getAttribute('x')).toBe('130');
    expect(rect('query-embedding')?.getAttribute('x')).toBe('432');
    expect(rect('search')?.getAttribute('x')).toBe('734');
    expect(rect('top-k')?.getAttribute('x')).toBe('1036');
    expect(rect('prompt')?.getAttribute('x')).toBe('432');
    expect(rect('prompt')?.getAttribute('y')).toBe('594');
    expect(rect('llm')?.getAttribute('x')).toBe('734');
    expect(rect('llm')?.getAttribute('y')).toBe('594');
    expect(rect('answer')?.getAttribute('x')).toBe('1036');
    expect(rect('answer')?.getAttribute('y')).toBe('594');
  });

  it('advances traffic, pauses it, and can replay from the first stage', () => {
    render(<RagTrafficDiagram />);
    const status = screen.getByRole('status');
    const pause = screen.getByRole('button', { name: 'Tạm dừng mô phỏng' });
    const replay = screen.getByRole('button', { name: 'Chạy lại mô phỏng' });

    expect(status.textContent).toContain('Nguồn vào');
    act(() => { vi.advanceTimersByTime(1050); });
    expect(status.textContent).toContain('Chunking');

    fireEvent.click(pause);
    expect(screen.getByRole('button', { name: 'Chạy mô phỏng' })).toBeTruthy();
    expect(document.querySelectorAll('.rag-packet animateMotion')).toHaveLength(0);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(status.textContent).toContain('Chunking');

    fireEvent.click(replay);
    expect(status.textContent).toContain('Nguồn vào');
    expect(document.querySelectorAll('.rag-packet animateMotion')).toHaveLength(10);
  });
});
