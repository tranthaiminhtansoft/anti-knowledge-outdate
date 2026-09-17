// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KafkaLearningJourney } from './KafkaLearningJourney';
import { kafkaChapters } from './kafkaJourneyData';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('canonical Kafka lesson native React parity', () => {
  it.each(kafkaChapters.map((chapter) => chapter.id))('renders legacy chapter deep-link %s', (chapterId) => {
    render(<KafkaLearningJourney chapterId={chapterId} />);
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(0);
  });

  it('renders the canonical diagrams without embedding a document or extra diagram controls', () => {
    const { container } = render(<KafkaLearningJourney chapterId="overview" />);
    for (const id of ['project', 'architecture', 'flow', 'failure', 'operations']) expect(container.querySelector(`#${id}`)).toBeTruthy();
    expect(container.querySelectorAll('iframe')).toHaveLength(0);
    expect(container.querySelector('[srcdoc]')).toBeNull();
    expect(container.innerHTML).not.toContain('<!DOCTYPE html>');
    expect(screen.getByRole('heading', { name: 'Kafka tham gia vào Project' })).toBeTruthy();
    expect(screen.queryByText('KAFKA LEARNING JOURNEY · OVERVIEW')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Kafka giúp gì trong luồng thanh toán?' })).toBeNull();
    expect(screen.getByRole('img', { name: 'AS-IS không Kafka' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'TO-BE có Kafka' })).toBeTruthy();
    for (const id of ['as1', 'as2', 'as3', 'as4', 'as5', 'to1', 'to2', 'to3', 'to4', 'to5a', 'to5b', 'to5c', 'to6', 'toAck']) {
      expect(container.querySelector(`path#${id}`)).toBeTruthy();
    }
    expect(container.querySelector('marker#aBlue')).toBeTruthy();
    expect(container.querySelector('marker#tGreen')).toBeTruthy();
    expect(container.querySelector('path[d="M250 285V318Q250 330 238 330H130Q118 330 118 342V390"]')).toBeTruthy();
    expect(screen.getByText('⑧ no commit → đọc lại')).toBeTruthy();
    expect(screen.getAllByText('payment.succeeded').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Pause diagram' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reset diagram' })).toBeNull();
    expect(container.querySelectorAll('iframe, [srcdoc]')).toHaveLength(0);
  });

  it('ports the standalone architecture hierarchy and keeps its live controls native', () => {
    const { container } = render(<KafkaLearningJourney chapterId="overview" />);
    const architecture = container.querySelector('#architecture')!;
    expect(architecture.querySelector(':scope > .section-head > .eyebrow')?.textContent).toBe('02 / OPEN THE BLACK BOX');
    const box = architecture.querySelector(':scope > .box')!;
    expect(box.querySelector(':scope > .bar.spread a[href="#flow"]')?.textContent).toContain('Gửi order trong simulator');
    expect(box.querySelector(':scope > .live-lab > div > .live-map')).toBeTruthy();
    expect(box.querySelector(':scope > .live-lab > .live-controls h3')?.textContent).toBe('Live cluster · bộ điều khiển duy nhất');
    expect(box.querySelector('.three.brokers')).toBeTruthy();
    expect(box.querySelectorAll('.component-glossary > div')).toHaveLength(12);
    expect(box.querySelectorAll('.architecture-downstream > .service')).toHaveLength(2);
  });

  it('supports canonical cluster controls, key routing, ACK, reset, slow worker and traffic spike', async () => {
    const user = userEvent.setup();
    render(<KafkaLearningJourney chapterId="overview" />);
    const key = screen.getByLabelText('Key');
    await user.clear(key); await user.type(key, 'customer-42');
    await user.selectOptions(screen.getByLabelText('ACK'), '1');
    await user.click(screen.getByRole('button', { name: '+ Send order' }));
    await user.click(screen.getByRole('button', { name: 'Step →' }));
    expect(screen.getAllByText(/customer-42/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/route P[0-2]/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Slow consumer: OFF' }));
    expect(screen.getByRole('button', { name: 'Slow consumer: ON' }).getAttribute('aria-pressed')).toBe('true');
    await user.click(screen.getByRole('button', { name: '⚡ +30 orders' }));
    await user.click(screen.getByRole('button', { name: 'Reset lab' }));
    expect(screen.getByDisplayValue('order-123')).toBeTruthy();
  });

  it('keeps Start running after an event reaches downstream consumers', async () => {
    vi.useFakeTimers();
    render(<KafkaLearningJourney chapterId="overview" />);
    const send = screen.getByRole('button', { name: '+ Send order' });
    const start = screen.getByRole('button', { name: 'Start' });
    fireEvent.click(send);
    fireEvent.click(start);
    vi.advanceTimersByTime(6000);
    expect(screen.getByRole('heading', { name: 'Kafka Cluster Architecture' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
  });
  it('provides broker recovery, rebalance, commit/replay, and independent downstream modes', async () => {
    const user = userEvent.setup();
    render(<KafkaLearningJourney chapterId="overview" />);
    await user.click(screen.getByRole('button', { name: 'Kill Broker 1' }));
    expect(screen.getByText(/P0 offline → electing leader/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '+ Add worker' }));
    expect(screen.getByRole('button', { name: 'Rebalancing…' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Commit now' }));
    await user.click(screen.getByRole('button', { name: 'Restart / replay' }));
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[2], 'failed');
    expect(screen.getByDisplayValue('failed')).toBeTruthy();
  });
});
