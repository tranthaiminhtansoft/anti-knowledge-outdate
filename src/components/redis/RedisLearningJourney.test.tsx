// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RedisLearningJourney } from './RedisLearningJourney';
import { redisChapters } from './redisJourneyData';

describe('Redis persistent database lesson', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('registers Redis Map and the persistent database lesson as independent deep-link chapters', () => {
    expect(redisChapters.map((chapter) => chapter.id)).toEqual(['persistent-database', 'redis-map']);

    render(<RedisLearningJourney chapterId="persistent-database" />);

    expect(screen.getByRole('heading', { name: 'Redis phối hợp với persistent database', level: 2 })).toBeTruthy();
    expect(screen.getByText(/Các dữ liệu “nóng” như giỏ hàng/)).toBeTruthy();
    expect(screen.getByText(/MongoDB là một ví dụ cho Persistent Database/)).toBeTruthy();
    expect(screen.queryByText('ShopNow Learning Journey')).toBeNull();
    expect(screen.queryByText('Bản đồ hành trình Redis')).toBeNull();
    expect(screen.queryByRole('button', { name: /Bài trước|Bài tiếp theo/ })).toBeNull();
  });

  it('keeps the diagram, controls, and activity log in one responsive workspace', () => {
    render(<RedisLearningJourney chapterId="persistent-database" />);

    const viewport = screen.getByLabelText(/Chỉ cuộn ngang khi khu vực hiển thị quá hẹp/);
    const workspace = viewport.querySelector('.redisPersistenceWorkspace');
    const sidePanel = viewport.querySelector('.redisPersistenceSidePanel');

    expect(workspace).toBeTruthy();
    expect(sidePanel).toBeTruthy();
    expect(sidePanel?.querySelectorAll('.redisPersistenceControls button')).toHaveLength(3);
    expect(sidePanel?.querySelector('[role="log"]')).toBeTruthy();
    expect(viewport.querySelectorAll('[data-connection="client-redis"], [data-connection="redis-worker"], [data-connection="worker-mongo"]')).toHaveLength(3);
  });

  it('writes hot state to Redis first and batch-persists the dirty snapshot after five seconds', async () => {
    render(<RedisLearningJourney chapterId="persistent-database" />);

    fireEvent.click(screen.getByRole('button', { name: '👆 Bấm Thêm Vào Giỏ' }));
    await act(async () => vi.advanceTimersByTimeAsync(300));

    expect(screen.getByTestId('cart-state').textContent).toContain('Cart: 1');
    expect(screen.getByTestId('redis-state').textContent).toContain('Cart: 1 · Dirty');
    expect(screen.getByTestId('persistent-state').textContent).toContain('Cart: 0 items');

    await act(async () => vi.advanceTimersByTimeAsync(4700));
    expect(screen.getByTestId('worker-status').textContent).toContain('Đang batch flush');

    await act(async () => vi.advanceTimersByTimeAsync(3_000));
    expect(screen.getByTestId('persistent-state').textContent).toContain('Cart: 1 items');
    expect(screen.getByTestId('redis-state').textContent).toContain('Cart: 1 · Clean');
    expect(screen.getByText(/Batch upsert hoàn tất v1/)).toBeTruthy();
  });

  it('restores cold data from MongoDB and warms Redis before returning to the app', async () => {
    render(<RedisLearningJourney chapterId="persistent-database" />);

    const coldButton = screen.getByRole('button', { name: '💤 Test Khôi Phục Dữ Liệu' }) as HTMLButtonElement;
    fireEvent.click(coldButton);
    expect(coldButton.disabled).toBe(true);

    await act(async () => vi.advanceTimersByTimeAsync(6_600));
    expect(screen.getByTestId('redis-state').textContent).toContain('Cart: NULL');
    expect(screen.getByTestId('persistent-state').textContent).toContain('Cart: 15 items');

    await act(async () => vi.advanceTimersByTimeAsync(6400));
    expect(screen.getByTestId('redis-state').textContent).toContain('Cart: 15 · Clean');
    expect(screen.getByTestId('cart-state').textContent).toContain('Cart: 15');
    expect(screen.getByText(/Nạp thành công vào RAM/)).toBeTruthy();
    expect(coldButton.disabled).toBe(false);
  });

  it('resets active work and releases every owned timer on unmount', async () => {
    const baseline = vi.getTimerCount();
    const view = render(<RedisLearningJourney chapterId="persistent-database" />);

    fireEvent.click(screen.getByRole('button', { name: '💤 Test Khôi Phục Dữ Liệu' }));
    fireEvent.click(screen.getByRole('button', { name: '🔄 Đặt lại từ đầu' }));

    expect(screen.getByTestId('cart-state').textContent).toContain('Cart: 0');
    expect(screen.getByTestId('redis-state').textContent).toContain('Cart: 0 · Clean');
    expect(screen.getByText(/Đã Reset toàn bộ hệ thống/)).toBeTruthy();

    view.unmount();
    await act(async () => vi.runOnlyPendingTimersAsync());
    expect(vi.getTimerCount()).toBe(baseline);
  });

  it('renders Redis Map tabs and keeps its five reinforcement answers closed by default', () => {
    render(<RedisLearningJourney chapterId="redis-map" />);

    expect(screen.getByRole('heading', { name: 'Redis Map', level: 2 })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Deploy Strategy/ }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('group', { name: 'Chọn chiến lược triển khai' })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: '② Components' }));
    expect(screen.getByRole('group', { name: 'Chọn topology cho Components' })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: '③ Data Types' }));
    expect(screen.getByRole('group', { name: 'Chọn kiểu dữ liệu' })).toBeTruthy();
    expect(screen.queryByText('Đáp án')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Xem đáp án' })[0]);
    expect(screen.getByText(/Không\. VM và Kubernetes là nơi chạy Redis process/)).toBeTruthy();
  });

  it('gives independent MCQ feedback and marks wrong selection plus correct answer semantically', () => {
    render(<RedisLearningJourney chapterId="persistent-database" />);
    const question = screen.getByLabelText(/Redis giữ loại state nào/);
    fireEvent.click(screen.getByRole('button', { name: /A\. Toàn bộ lịch sử/ }));
    expect(question.querySelector('.wrong')?.textContent).toContain('Bạn đã chọn — chưa đúng');
    expect(question.querySelector('.correct')?.textContent).toContain('Đáp án đúng');
    expect(screen.getByRole('status').textContent).toContain('Chưa chính xác');
  });
});
