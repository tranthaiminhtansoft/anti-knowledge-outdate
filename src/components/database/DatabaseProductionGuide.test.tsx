// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DatabaseProductionGuide } from './DatabaseProductionGuide';

afterEach(cleanup);

describe('DatabaseProductionGuide', () => {
  it.each([
    ['architecture', 'Architecture & Scaling'], ['design', 'Data Design & Query Performance'], ['correctness', 'Data Correctness & Reliability'], ['operations', 'Production Operations & Observability'],
  ] as const)('renders the native %s lesson without an iframe', (section, title) => {
    const { container } = render(<DatabaseProductionGuide section={section} />);
    expect(screen.getByRole('heading', { name: title })).toBeTruthy();
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('navigates every original database section from the native guide navigation', () => {
    render(<DatabaseProductionGuide section="architecture" />);
    fireEvent.click(screen.getByRole('button', { name: '02 · Data design' }));
    expect(screen.getByText('SQL vs NoSQL: bắt đầu từ access pattern')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '03 · Correctness' }));
    expect(screen.getByText('Cơ chế bảo vệ dữ liệu')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '04 · Operations' }));
    expect(screen.getByText('Hai sự cố đặc trưng')).toBeTruthy();
  });

  it('runs all ACID scenarios and the traffic scale-out simulation', () => {
    render(<DatabaseProductionGuide section="architecture" />);
    for (const name of ['Success / COMMIT', 'Crash / ROLLBACK', 'Concurrent requests', 'Overload']) {
      fireEvent.click(screen.getByRole('button', { name }));
      expect(screen.getByRole('status').textContent).not.toBe('Sẵn sàng: A=500.000đ · B=200.000đ · WAL READY');
    }
    fireEvent.click(screen.getByRole('tab', { name: 'NoSQL · Flash Sale Cart' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bão 1.500.000' }));
    expect(screen.getByRole('status').textContent).toContain('Cluster scale-out: 3 nodes');
  });

  it('changes the composite-index query plan without changing its query', () => {
    render(<DatabaseProductionGuide section="design" />);
    expect(screen.getByText(/Chưa tạo index — Full scan/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Thêm composite index' }));
    expect(screen.getByText(/Composite index sẵn sàng/)).toBeTruthy();
    expect(screen.getByText(/CREATE INDEX idx_payment_history_user_status_created_at/)).toBeTruthy();
  });

  it('demonstrates SQL locking, NoSQL consistency, and both runnable incident runbooks', () => {
    const { rerender } = render(<DatabaseProductionGuide section="correctness" />);
    fireEvent.click(screen.getByRole('button', { name: 'Chạy không lock' }));
    expect(screen.getByRole('status').textContent).toContain('Oversell');
    fireEvent.click(screen.getByRole('tab', { name: 'NoSQL · Conditional write + Replica' }));
    fireEvent.click(screen.getByRole('button', { name: 'Quorum write' }));
    expect(screen.getByRole('status').textContent).toContain('Quorum');
    rerender(<DatabaseProductionGuide section="operations" />);
    fireEvent.click(screen.getByRole('button', { name: /breakSql/ }));
    fireEvent.click(screen.getByRole('button', { name: /runSqlBook/ }));
    expect(screen.getByRole('status').textContent).toContain('SQL runbook');
    fireEvent.click(screen.getByRole('button', { name: /breakNosql/ }));
    fireEvent.click(screen.getByRole('button', { name: /runNosqlBook/ }));
    expect(screen.getByRole('status').textContent).toContain('Permanent fix');
  });
});
