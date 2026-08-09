import { describe, expect, it } from 'vitest';
import source from './main.tsx?raw';

function aiArticleIndex(id: string): number {
  return source.indexOf(`id: '${id}'`);
}

describe('AI learning path', () => {
  it('publishes six lessons in the intended runtime order', () => {
    const ids = [
      'ai-model-assistant-agent',
      'model-co-thuc-su-suy-nghi-khong',
      'rag-grounding-runtime',
      'agent',
      'model-context-protocol',
      'hermes-vs-copilot-chatgpt',
    ];

    expect(source).toContain('articleCount: 6');
    expect(source).toContain("bullets: ['AI', 'Model', 'RAG', 'Agent', 'MCP', 'Hermes Agent']");
    expect(ids.map(aiArticleIndex)).toEqual([...ids.map(aiArticleIndex)].sort((a, b) => a - b));
  });

  it('teaches RAG grounding and MCP permission boundaries', () => {
    expect(source).toContain('RAG không phải fine-tuning');
    expect(source).toContain('filter theo tenant/user');
    expect(source).toContain('Host/client/server là các vai trò chính.');
    expect(source).toContain('least privilege');
    expect(source).toContain('prompt injection');
  });
});
