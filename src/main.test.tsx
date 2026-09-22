// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

beforeAll(async () => {
  window.history.replaceState(null, '', '#/article/kafka-overview');
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
  await act(async () => {
    await import('./main');
  });
});

afterAll(() => {
  window.history.replaceState(null, '', '/');
  document.body.innerHTML = '';
});

describe('sidebar lesson navigation', () => {
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

  it('preserves accordion controls and nested lessons for non-Kafka topics', () => {
    const sidebar = screen.getByLabelText('Danh sách bài học');
    const kubernetesTopic = Array.from(sidebar.querySelectorAll<HTMLElement>('.sidebarTopic'))
      .find((topic) => topic.querySelector('.sidebarTopicButton')?.textContent?.includes('Kubernetes'))!;
    const expandButton = within(kubernetesTopic).getByRole('button', { name: 'Mở rộng mục Kubernetes' });

    fireEvent.click(expandButton);

    expect(within(kubernetesTopic).getByRole('button', { name: 'Thu gọn mục Kubernetes' })).toBeTruthy();
    expect(kubernetesTopic.querySelector('.sidebarArticleList')).toBeTruthy();
  });
});
