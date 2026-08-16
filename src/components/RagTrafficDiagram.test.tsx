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
    expect(container.querySelectorAll('.rag-packet')).toHaveLength(11);
    expect(container.querySelector('[data-stage="vector-db"]')).toBeTruthy();
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
    act(() => { vi.advanceTimersByTime(5000); });
    expect(status.textContent).toContain('Chunking');

    fireEvent.click(replay);
    expect(status.textContent).toContain('Nguồn vào');
  });
});
