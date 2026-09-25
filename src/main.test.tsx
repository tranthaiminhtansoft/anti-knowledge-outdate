// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

beforeAll(async () => {
  window.history.replaceState(null, '', '#/article/k8s-workload-configuration');
  document.body.innerHTML = '<div id="root"></div>';
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: { getItem: () => null, setItem: () => undefined },
  });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ addEventListener: () => undefined, matches: true, removeEventListener: () => undefined }),
  });
  HTMLElement.prototype.scrollIntoView = () => undefined;
  window.scrollTo = () => undefined;
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });
  await act(async () => {
    await import('./main');
  });
});

afterAll(() => {
  window.history.replaceState(null, '', '/');
  document.body.innerHTML = '';
});

afterEach(() => {
  window.history.replaceState(null, '', '#/article/k8s-workload-configuration');
  fireEvent(window, new HashChangeEvent('hashchange'));
});

describe('sidebar lesson navigation', () => {
  it('resolves the legacy Kafka topic route to its canonical article route', () => {
    window.history.replaceState(null, '', '#/topic/kafka');
    fireEvent(window, new HashChangeEvent('hashchange'));

    expect(window.location.hash).toBe('#/article/kafka-overview');
    expect(screen.getByRole('heading', { name: 'Kafka tham gia vào Project' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Bài học Kafka' })).toBeNull();
  });

  it('returns from the canonical Kafka article to the home page', async () => {
    window.history.replaceState(null, '', '#/article/kafka-overview');
    fireEvent(window, new HashChangeEvent('hashchange'));

    const backButton = screen.getByRole('button', { name: 'Quay lại trang chính' });
    await act(async () => {
      fireEvent.click(backButton);
    });

    expect(window.location.hash).toBe('#/');
    expect(screen.getByRole('heading', { name: 'Anti Knowledge Outdate' })).toBeTruthy();
  });

  it('opens the canonical Kafka article from the home topic card', async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Anti Knowledge Outdate' }));
    fireEvent(window, new HashChangeEvent('hashchange'));

    const kafkaCard = Array.from(document.querySelectorAll<HTMLButtonElement>('.topicCard'))
      .find((card) => card.textContent?.includes('Kafka'))!;
    await act(async () => {
      fireEvent.click(kafkaCard);
    });

    expect(window.location.hash).toBe('#/article/kafka-overview');
    expect(screen.getByRole('heading', { name: 'Kafka tham gia vào Project' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Bài học Kafka' })).toBeNull();
  });

  it('reports Kafka as one outer lesson on the home topic card', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Anti Knowledge Outdate' }));
    fireEvent(window, new HashChangeEvent('hashchange'));

    const kafkaCard = Array.from(document.querySelectorAll<HTMLButtonElement>('.topicCard'))
      .find((card) => card.textContent?.includes('Kafka'));
    expect(kafkaCard?.textContent).toContain('1 bài đang có');
  });

  it('renders Kafka as one lesson item that opens the canonical Kafka page without a nested lesson list', () => {
    const sidebar = screen.getByLabelText('Danh sách bài học');
    const kafkaTopic = Array.from(sidebar.querySelectorAll<HTMLElement>('.sidebarTopic'))
      .find((topic) => topic.querySelector('.sidebarTopicButton')?.textContent?.includes('Kafka'))!;

    const kafkaButton = kafkaTopic.querySelector<HTMLButtonElement>('.sidebarTopicButton')!;
    expect(kafkaButton).toBeTruthy();
    expect(within(kafkaTopic).queryByRole('button', { name: /mục Kafka/i })).toBeNull();
    expect(kafkaTopic.querySelector('.sidebarArticleList')).toBeNull();

    fireEvent.click(kafkaButton);

    expect(window.location.hash).toBe('#/article/kafka-overview');
  });

  it('preserves accordion controls and nested lessons for non-Kafka topics', async () => {
    const sidebar = screen.getByLabelText('Danh sách bài học');
    const kubernetesTopic = Array.from(sidebar.querySelectorAll<HTMLElement>('.sidebarTopic'))
      .find((topic) => topic.querySelector('.sidebarTopicButton')?.textContent?.includes('Kubernetes'))!;
    const currentToggle = within(kubernetesTopic).getByRole('button', { name: /mục Kubernetes/ });
    if (currentToggle.getAttribute('aria-expanded') === 'true') fireEvent.click(currentToggle);

    const expandButton = within(kubernetesTopic).getByRole('button', { name: 'Mở rộng mục Kubernetes' });
    fireEvent.click(expandButton);

    expect(within(kubernetesTopic).getByRole('button', { name: 'Thu gọn mục Kubernetes' })).toBeTruthy();
    const nestedLessons = within(kubernetesTopic).getAllByRole('button').filter(
      (button): button is HTMLButtonElement => button.classList.contains('sidebarArticle'),
    );
    expect(nestedLessons).toHaveLength(4);
    expect(nestedLessons.map((button) => button.textContent)).toEqual([
      'Kubernetes cốt lõi',
      'Multi-container Pod',
      'Configuration',
      'Observability',
    ]);

    await act(async () => {
      fireEvent.click(nestedLessons[0]);
    });
    expect(window.location.hash).toBe('#/article/master-kubernetes');
    expect(screen.getByRole('heading', { name: 'Kubernetes cốt lõi' })).toBeTruthy();

    const collapsedTopic = screen.getByLabelText('Danh sách bài học').querySelector<HTMLElement>('.sidebarTopic.active')!;
    fireEvent.click(within(collapsedTopic).getByRole('button', { name: 'Thu gọn mục Kubernetes' }));
    expect(collapsedTopic.querySelector('.sidebarArticleList')).toBeNull();
  });
});
