// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { KafkaLearningJourney } from './KafkaLearningJourney';

afterEach(cleanup);

describe('KafkaLearningJourney guided reading', () => {
  it('exposes the production pain lab declared by the final chapter', async () => {
    const user = userEvent.setup();
    render(<KafkaLearningJourney chapterId="production" />);

    const openLab = screen.getByRole('button', { name: 'Mở mô phỏng luồng' });
    await user.click(openLab);

    expect(screen.getByRole('region', { name: 'Topology stage' })).toBeTruthy();
  });

  it('starts with two accessible static flowcharts while keeping the optional topology closed', () => {
    const { container } = render(<KafkaLearningJourney chapterId="overview" />);

    expect(screen.queryByRole('heading', { name: 'Bắt đầu tại đây' })).toBeNull();
    expect(screen.queryByText('1. Dự án ShopNow')).toBeNull();
    expect(screen.getByRole('button', { name: '← Bài trước' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Bài tiếp theo →' }).hasAttribute('disabled')).toBe(false);
    expect(screen.getByRole('heading', { name: 'ShopNow · Dự án thương mại điện tử giả lập' })).toBeTruthy();
    expect(screen.getByText('publish order.created')).toBeTruthy();
    const withKafkaDiagram = screen.getByLabelText('Luồng ShopNow có sử dụng Kafka');
    expect(within(withKafkaDiagram).getByText('Orders DB')).toBeTruthy();
    expect(within(withKafkaDiagram).getByText('Outbox Relay')).toBeTruthy();
    expect(within(withKafkaDiagram).queryByText(/trả sau Produce ACK/)).toBeNull();
    expect(screen.getByRole('heading', { name: 'Vấn đề trong flash sale' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Quyết định dùng Kafka' })).toBeTruthy();
    expect(screen.getByRole('figure', { name: 'Luồng ShopNow không sử dụng Kafka' })).toBeTruthy();
    expect(screen.getByRole('figure', { name: 'Luồng ShopNow có sử dụng Kafka' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Không Kafka: một Notification timeout làm Checkout trả lỗi cho Client' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Có Kafka và Outbox: Checkout trả HTTP 201 sau khi commit Order + Outbox' })).toBeTruthy();
    expect(container.querySelector('.kafkaFlowLogo')).toBeTruthy();
    expect(screen.getByText(/Order Database tồn tại ở cả hai kiến trúc/)).toBeTruthy();
    expect(screen.getByText(/Transactional Outbox như một lựa chọn chống dual-write/)).toBeTruthy();
    expect(screen.queryByText('DB + Outbox')).toBeNull();
    expect(screen.getByText('3 HTTP requests đồng thời')).toBeTruthy();
    expect(screen.getByText('Checkout vẫn chờ cả ba')).toBeTruthy();
    expect(screen.getAllByText('HTTP 500').length).toBeGreaterThan(0);
    expect(screen.getByText('HTTP 201 Created')).toBeTruthy();
    expect(screen.getByText('Produce ACK')).toBeTruthy();
    expect(screen.getAllByText(/offset chưa commit/).length).toBeGreaterThan(0);
    const failedNotification = screen.getAllByText('Notification')
      .map((title) => title.closest('g')!)
      .find((node) => node.querySelectorAll('.kafkaFlowNodeSubtitle tspan').length === 2)!;
    expect([...failedNotification.querySelectorAll('.kafkaFlowNodeSubtitle tspan')].map((line) => line.textContent)).toEqual(['FAIL', 'offset chưa commit']);
    expect(screen.getByText('seek / restart / rebalance')).toBeTruthy();
    expect(screen.queryByText(/Checkout gọi tuần tự 3 service/)).toBeNull();
    expect(screen.queryByRole('region', { name: 'Topology stage' })).toBeNull();
    expect(screen.queryByText('Xem lộ trình 10 bài')).toBeNull();
  });

  it('loops traffic on directed connectors and fans one Kafka publish into three consumer dots without controls', () => {
    const { container } = render(<KafkaLearningJourney chapterId="overview" />);
    const projectCase = container.querySelector('.kafkaProjectCase');
    const fanOutDots = projectCase?.querySelectorAll(
      '[data-traffic="consume-inventory"], [data-traffic="consume-notification"], [data-traffic="consume-analytics"]',
    );

    expect(projectCase?.querySelector('button')).toBeNull();
    expect(projectCase?.querySelector('[data-traffic="publish"] mpath[href="#with-kafka-publish"]')).toBeTruthy();
    expect(projectCase?.querySelector('[data-traffic="produce-ack"] mpath[href="#with-kafka-ack"]')).toBeTruthy();
    expect(projectCase?.querySelector('[data-traffic="client-success"] mpath[href="#with-kafka-client-success"]')).toBeTruthy();
    expect(projectCase?.querySelector('[data-traffic="without-notification-timeout"] mpath[href="#without-kafka-notification-timeout"]')).toBeTruthy();
    expect(projectCase?.querySelector('[data-traffic="without-client-error"] mpath[href="#without-kafka-client-error"]')).toBeTruthy();
    expect(projectCase?.querySelector('[data-traffic="without-request-bundle"] mpath[href="#without-kafka-request-bundle"]')).toBeTruthy();
    expect(projectCase?.querySelector('[data-traffic="without-inventory-request"] mpath[href="#without-kafka-inventory-request"]')).toBeTruthy();
    expect(projectCase?.querySelector('[data-traffic="without-notification-request"] mpath[href="#without-kafka-notification-request"]')).toBeTruthy();
    expect(projectCase?.querySelector('[data-traffic="without-analytics-request"] mpath[href="#without-kafka-analytics-request"]')).toBeTruthy();
    expect(projectCase?.querySelector('[data-traffic="consumer-retry"] mpath[href="#with-kafka-retry"]')).toBeTruthy();
    expect(projectCase?.querySelector('[data-traffic="consume-lead"] mpath[href="#with-kafka-consume-lead"]')).toBeTruthy();
    expect(fanOutDots).toHaveLength(3);
    expect(projectCase?.querySelector('[data-traffic="consume-inventory"] mpath[href="#with-kafka-inventory"]')).toBeTruthy();
    expect(projectCase?.querySelector('[data-traffic="consume-notification"] mpath[href="#with-kafka-notification"]')).toBeTruthy();
    expect(projectCase?.querySelector('[data-traffic="consume-analytics"] mpath[href="#with-kafka-analytics"]')).toBeTruthy();
    expect(projectCase?.querySelectorAll('.kafkaFlowTrafficDot[aria-hidden="true"]')).toHaveLength(18);
  });

  it('opens a deterministic diagram only when the learner asks for it', async () => {
    const user = userEvent.setup();
    render(<KafkaLearningJourney chapterId="api-flow" />);

    expect(screen.queryByRole('region', { name: 'Topology stage' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Mở mô phỏng luồng' }));
    expect(screen.getByRole('region', { name: 'Topology stage' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Client gọi HTTP API' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Bước tiếp theo' }));
    expect(screen.getByRole('heading', { name: 'Backend commit Order + Outbox' })).toBeTruthy();
  });

  it('separates bidirectional connector labels so they do not overlap', async () => {
    const user = userEvent.setup();
    const { container } = render(<KafkaLearningJourney chapterId="api-flow" />);

    await user.click(screen.getByRole('button', { name: 'Mở mô phỏng luồng' }));
    const labels = [...container.querySelectorAll<SVGTextElement>('.kafkaEdge text')];
    const request = labels.find((label) => label.textContent === 'HTTP request');
    const response = labels.find((label) => label.textContent === 'HTTP 201');
    const produce = labels.find((label) => label.textContent === 'ProduceRequest');
    const ack = labels.find((label) => label.textContent === 'ACK');
    const fetchRequest = labels.find((label) => label.textContent === 'FetchRequest');
    const fetchResponse = labels.find((label) => label.textContent === 'FetchResponse');

    expect(request?.getAttribute('y')).not.toBe(response?.getAttribute('y'));
    expect(Number(request?.getAttribute('y'))).toBeLessThan(205);
    expect(Number(response?.getAttribute('y'))).toBeGreaterThan(287);
    expect(produce?.parentElement?.getAttribute('transform')).not.toBe(ack?.parentElement?.getAttribute('transform'));
    expect(produce?.parentElement?.querySelector('rect')).toBeTruthy();
    expect(ack?.parentElement?.querySelector('rect')).toBeTruthy();
    expect(fetchRequest?.parentElement?.querySelector('rect')).toBeTruthy();
    expect(fetchResponse?.parentElement?.querySelector('rect')).toBeTruthy();
    expect(fetchRequest?.parentElement?.getAttribute('transform')).not.toBe(fetchResponse?.parentElement?.getAttribute('transform'));
    const relayBrokerPaths = [...container.querySelectorAll<SVGPathElement>('.kafkaEdge--relay-broker > path')];
    expect(relayBrokerPaths).toHaveLength(2);
    expect(relayBrokerPaths[0].getAttribute('d')).not.toBe(relayBrokerPaths[1].getAttribute('d'));
  });

  it('keeps the checkpoint answer hidden until the learner reveals it', async () => {
    const user = userEvent.setup();
    render(<KafkaLearningJourney chapterId="api-flow" />);

    expect(screen.queryByText(/ACK chỉ xác nhận broker/)).toBeNull();
    const reveal = screen.getByRole('button', { name: 'Xem đáp án' });
    expect(reveal.getAttribute('aria-expanded')).toBe('false');

    await user.click(reveal);
    expect(screen.getByText(/ACK chỉ xác nhận broker/)).toBeTruthy();
    const hide = screen.getByRole('button', { name: 'Ẩn đáp án' });
    expect(hide.getAttribute('aria-expanded')).toBe('true');

    await user.click(hide);
    expect(screen.queryByText(/ACK chỉ xác nhận broker/)).toBeNull();
  });

  it('renders the why, HTTP lanes, and component glossary before internals', () => {
    const { rerender } = render(<KafkaLearningJourney chapterId="overview" />);
    expect(screen.getByRole('heading', { name: 'Không Kafka' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Không nên dùng' })).toBeTruthy();

    rerender(<KafkaLearningJourney chapterId="api-flow" />);
    expect(screen.getByRole('heading', { name: 'Lane đồng bộ HTTP' })).toBeTruthy();
    expect(screen.getByText('Trả HTTP 201')).toBeTruthy();

    rerender(<KafkaLearningJourney chapterId="components" />);
    expect(screen.getByRole('heading', { name: '10 thành phần cốt lõi' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'KRaft Controller' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mở mô phỏng luồng' })).toBeNull();
  });

  it('switches architecture control-plane mode inside the optional lab', async () => {
    const user = userEvent.setup();
    render(<KafkaLearningJourney chapterId="architecture" />);

    await user.click(screen.getByRole('button', { name: 'Mở mô phỏng luồng' }));
    expect(screen.getByRole('button', { name: 'KRaft hiện đại' }).getAttribute('aria-pressed')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Xem ZooKeeper legacy' }));

    expect(screen.getByRole('heading', { name: 'ZooKeeper: kiến trúc legacy' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Xem ZooKeeper legacy' }).getAttribute('aria-pressed')).toBe('true');
  });
});
