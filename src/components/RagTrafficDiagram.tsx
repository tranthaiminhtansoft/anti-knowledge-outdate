import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import './rag-traffic.css';

type Stage = {
  id: string;
  title: string;
  copy: string;
  kind: 'source' | 'process' | 'store' | 'query' | 'retrieve' | 'answer';
};

const offlineStages: Stage[] = [
  { id: 'documents', title: 'PDF / raw docs', copy: 'nguồn được cấp quyền', kind: 'source' },
  { id: 'chunks', title: 'Chunk / split', copy: 'chia theo cấu trúc + metadata', kind: 'process' },
  { id: 'embeddings', title: 'Embedding', copy: 'văn bản → vector', kind: 'process' },
  { id: 'vector-db', title: 'Vector DB', copy: 'indexed chunks', kind: 'store' },
];

const onlineStages: Stage[] = [
  { id: 'question', title: 'Question', copy: 'user intent', kind: 'query' },
  { id: 'query-embedding', title: 'Query embedding', copy: 'cùng không gian vector', kind: 'process' },
  { id: 'search', title: 'Search + filter', copy: 'similarity / ACL', kind: 'retrieve' },
  { id: 'top-k', title: 'Top-K chunks', copy: 'rerank + context budget', kind: 'retrieve' },
  { id: 'prompt', title: 'Prompt assembly', copy: 'context + question', kind: 'process' },
  { id: 'llm', title: 'LLM reasoning', copy: 'generate with evidence', kind: 'process' },
  { id: 'answer', title: 'Grounded answer', copy: 'citation hoặc từ chối', kind: 'answer' },
];

const allStages = [...offlineStages, ...onlineStages];
const edgePaths = [
  ['offline-docs-chunks', 'M 126 177 C 188 177 208 177 270 177'],
  ['offline-chunks-embedding', 'M 342 177 C 404 177 424 177 486 177'],
  ['offline-embedding-db', 'M 558 177 C 620 177 640 177 702 177'],
  ['online-question-query', 'M 182 505 C 190 505 195 505 203 505'],
  ['online-query-search', 'M 353 505 C 361 505 366 505 374 505'],
  ['online-search-topk', 'M 524 505 C 532 505 537 505 545 505'],
  ['online-topk-prompt', 'M 695 505 C 703 505 708 505 716 505'],
  ['online-prompt-llm', 'M 866 505 C 874 505 879 505 887 505'],
  ['online-llm-answer', 'M 1037 505 C 1045 505 1050 505 1058 505'],
  ['offline-db-to-search', 'M 783 213 C 783 320 449 370 449 469'],
  ['topk-to-prompt', 'M 620 541 C 620 584 791 584 791 541'],
];

const phaseLabels = [
  'Nguồn vào', 'Chunking', 'Vector hoá', 'Index sẵn sàng',
  'Câu hỏi', 'Query vector', 'Retrieve', 'Top-K', 'Context', 'Reasoning', 'Grounding',
];

function StageCard({ stage, index, active }: { stage: Stage; index: number; active: boolean }) {
  const x = index < 4 ? 54 + index * 216 : 32 + (index - 4) * 171;
  const y = index < 4 ? 128 : 456;
  const copyLines = stage.id === 'chunks' ? ['chia theo cấu trúc', '+ metadata'] : [stage.copy];
  return (
    <g className={`rag-stage rag-stage-${stage.kind} ${active ? 'is-active' : ''}`} data-stage={stage.id}>
      <rect x={x} y={y} width={index < 4 ? 162 : 150} height="112" rx="18" />
      <circle className="rag-stage-index" cx={x + 24} cy={y + 26} r="13" />
      <text className="rag-stage-number" x={x + 24} y={y + 30} textAnchor="middle">{index + 1}</text>
      <text className="rag-stage-title" x={x + 24} y={y + 60}>{stage.title}</text>
      <text className="rag-stage-copy" x={x + 24} y={y + 84}>
        {copyLines.map((line, lineIndex) => <tspan key={line} x={x + 24} dy={lineIndex === 0 ? 0 : 13}>{line}</tspan>)}
      </text>
    </g>
  );
}

export function RagTrafficDiagram() {
  const [activeStage, setActiveStage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(() => setActiveStage((value) => (value + 1) % allStages.length), 1050);
    return () => window.clearInterval(timer);
  }, [paused, replayKey]);

  const activeLabel = useMemo(() => phaseLabels[activeStage] ?? phaseLabels[0], [activeStage]);

  return (
    <section className="rag-traffic" aria-labelledby="rag-traffic-title">
      <header className="rag-traffic-header">
        <div>
          <span className="badge"><Sparkles size={14} /> Live pipeline</span>
          <h2 id="rag-traffic-title">RAG traffic: từ tài liệu đến câu trả lời có bằng chứng</h2>
          <p>Đường chấm là artifact lineage. Chấm sáng là traffic đang chạy; index được chuẩn bị offline, còn query đi qua runtime online.</p>
        </div>
        <div className="rag-traffic-actions" aria-label="Điều khiển mô phỏng">
          <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Chạy mô phỏng' : 'Tạm dừng mô phỏng'}>
            {paused ? <Play size={16} /> : <Pause size={16} />} {paused ? 'Chạy' : 'Tạm dừng'}
          </button>
          <button type="button" onClick={() => { setActiveStage(0); setReplayKey((value) => value + 1); setPaused(false); }} aria-label="Chạy lại mô phỏng">
            <RotateCcw size={16} /> Chạy lại
          </button>
        </div>
      </header>

      <div className="rag-traffic-status" role="status" aria-live="polite">
        <span className="rag-live-dot" /> <strong>Traffic đang ở:</strong> {activeLabel}
        <span className="rag-status-separator" />
        <ShieldCheck size={16} /> <span>ACL + citation gate</span>
      </div>

      <div className="rag-traffic-canvas" role="img" aria-label="Diagram RAG động gồm nhánh indexing offline và query online">
        <svg viewBox="0 0 1240 660" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="ragOffline" x1="0" x2="1"><stop stopColor="#173b65" /><stop offset="1" stopColor="#102943" /></linearGradient>
            <linearGradient id="ragOnline" x1="0" x2="1"><stop stopColor="#123e46" /><stop offset="1" stopColor="#102943" /></linearGradient>
            <filter id="ragGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            {edgePaths.map(([id, path]) => <path key={id} id={id} d={path} />)}
          </defs>
          <rect className="rag-lane rag-lane-offline" x="18" y="42" width="1204" height="268" rx="26" />
          <rect className="rag-lane rag-lane-online" x="18" y="352" width="1204" height="268" rx="26" />
          <line className="rag-boundary" x1="28" y1="330" x2="1212" y2="330" />
          <text className="rag-lane-label" x="48" y="82">OFFLINE / INDEXING</text>
          <text className="rag-lane-note" x="48" y="105">Chuẩn bị artifact một lần, phục vụ nhiều query</text>
          <text className="rag-lane-label online" x="48" y="392">ONLINE / QUERY</text>
          <text className="rag-lane-note" x="48" y="415">Mỗi câu hỏi tạo một vòng traffic có kiểm soát</text>
          <text className="rag-boundary-label" x="620" y="338" textAnchor="middle">INDEX READY · RUNTIME RETRIEVAL</text>

          {edgePaths.map(([id]) => <use key={`${id}-base`} className="rag-edge" href={`#${id}`} />)}
          <use className="rag-edge rag-edge-cross" href="#offline-db-to-search" />
          <use className="rag-edge rag-edge-cross" href="#topk-to-prompt" />
          {edgePaths.map(([id], index) => (
            <circle key={`${id}-packet`} className={`rag-packet packet-${index % 4}`} r="6" filter="url(#ragGlow)">
              <animateMotion dur={`${2.2 + (index % 3) * 0.45}s`} begin={`${(index % 4) * -0.5}s`} repeatCount="indefinite"><mpath href={`#${id}`} /></animateMotion>
            </circle>
          ))}
          {offlineStages.map((stage, index) => <StageCard key={stage.id} stage={stage} index={index} active={activeStage === index} />)}
          {onlineStages.map((stage, index) => <StageCard key={stage.id} stage={stage} index={index + 4} active={activeStage === index + 4} />)}
        </svg>
      </div>

      <footer className="rag-traffic-footer">
        <span><i className="rag-legend-dot blue" /> artifact / vector</span>
        <span><i className="rag-legend-dot cyan" /> query / context</span>
        <span><i className="rag-legend-dot green" /> grounded output</span>
        <span className="rag-traffic-footnote">Reduced motion sẽ giữ diagram tĩnh nhưng vẫn đọc được toàn bộ lineage.</span>
      </footer>
    </section>
  );
}
