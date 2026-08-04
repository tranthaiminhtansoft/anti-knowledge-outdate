import type { KafkaChapter } from './kafkaJourneyData';

export function nextKafkaStep(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(current, 0) + 1, total - 1);
}

export function validateKafkaJourney(chapters: KafkaChapter[]): string[] {
  const errors: string[] = [];
  const chapterIds = new Set<string>();

  for (const chapter of chapters) {
    if (chapterIds.has(chapter.id)) errors.push(`Duplicate chapter id: ${chapter.id}`);
    chapterIds.add(chapter.id);

    const nodeIds = new Set(chapter.nodes.map((node) => node.id));
    const edgeIds = new Set<string>();

    for (const edge of chapter.edges) {
      if (edgeIds.has(edge.id)) errors.push(`${chapter.id}: duplicate edge ${edge.id}`);
      edgeIds.add(edge.id);
      if (!nodeIds.has(edge.from)) errors.push(`${chapter.id}: edge ${edge.id} has missing source ${edge.from}`);
      if (!nodeIds.has(edge.to)) errors.push(`${chapter.id}: edge ${edge.id} has missing target ${edge.to}`);
    }

    chapter.steps.forEach((step, index) => {
      for (const nodeId of step.activeNodes) {
        if (!nodeIds.has(nodeId)) errors.push(`${chapter.id}[${index}]: missing active node ${nodeId}`);
      }
      if (step.activeEdge && !edgeIds.has(step.activeEdge)) {
        errors.push(`${chapter.id}[${index}]: missing active edge ${step.activeEdge}`);
      }
      if (step.mode === 'kraft' && step.activeNodes.includes('zookeeper')) {
        errors.push(`${chapter.id}[${index}]: ZooKeeper cannot be active in KRaft mode`);
      }
      if (step.mode === 'zookeeper' && step.activeNodes.includes('controller-quorum')) {
        errors.push(`${chapter.id}[${index}]: KRaft controller cannot be active in ZooKeeper mode`);
      }
    });
  }

  return errors;
}
