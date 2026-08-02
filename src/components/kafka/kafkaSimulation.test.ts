import { describe, expect, it } from 'vitest';
import { kafkaChapters } from './kafkaJourneyData';
import { nextKafkaStep, validateKafkaJourney } from './kafkaSimulation';

describe('Kafka learning journey contract', () => {
  it('ships ten ordered chapters with valid runtime references', () => {
    expect(kafkaChapters).toHaveLength(10);
    expect(kafkaChapters.map((chapter) => chapter.id)).toEqual([
      'overview',
      'api-flow',
      'components',
      'architecture',
      'partitioning',
      'producer',
      'consumer',
      'rebalance',
      'failure',
      'production',
    ]);
    expect(validateKafkaJourney(kafkaChapters)).toEqual([]);
  });

  it('teaches the HTTP boundary before Kafka internals', () => {
    const apiFlow = kafkaChapters.find((chapter) => chapter.id === 'api-flow');
    const components = kafkaChapters.find((chapter) => chapter.id === 'components');

    expect(apiFlow?.steps.map((step) => step.title)).toEqual([
      'Client gọi HTTP API',
      'Backend commit Order + Outbox',
      'API trả HTTP 201',
      'Relay publish event vào Kafka',
      'Broker lưu và ACK producer',
      'Consumer tự fetch và xử lý',
    ]);
    expect(components?.keyPoints.join(' ')).toContain('Kafka không nhận HTTP request');
    expect(components?.keyPoints.join(' ')).toContain('Producer là Kafka client');
    expect(apiFlow?.flowLanes?.map((lane) => lane.title)).toEqual(['Lane đồng bộ HTTP', 'Lane bất đồng bộ Kafka']);
    expect(components?.glossary).toHaveLength(10);
  });

  it('keeps ZooKeeper legacy and KRaft modern control planes separate', () => {
    const architecture = kafkaChapters.find((chapter) => chapter.id === 'architecture');
    expect(architecture).toBeDefined();

    const kraftSteps = architecture!.steps.filter((step) => step.mode === 'kraft');
    const zooKeeperSteps = architecture!.steps.filter((step) => step.mode === 'zookeeper');

    expect(kraftSteps.length).toBeGreaterThan(0);
    expect(zooKeeperSteps.length).toBeGreaterThan(0);
    expect(kraftSteps.every((step) => !step.activeNodes.includes('zookeeper'))).toBe(true);
    expect(zooKeeperSteps.every((step) => !step.activeNodes.includes('controller-quorum'))).toBe(true);
  });

  it('covers the production incidents selected for the localhost prototype', () => {
    const production = kafkaChapters.find((chapter) => chapter.id === 'production');
    expect(new Set(production?.painIds)).toEqual(new Set([
      'consumer-lag',
      'rebalance-storm',
      'hot-partition',
      'disk-pressure',
      'under-replicated',
      'controller-quorum',
    ]));
  });

  it('advances deterministically and clamps at the terminal step', () => {
    expect(nextKafkaStep(0, 4)).toBe(1);
    expect(nextKafkaStep(3, 4)).toBe(3);
    expect(nextKafkaStep(99, 4)).toBe(3);
  });
});
