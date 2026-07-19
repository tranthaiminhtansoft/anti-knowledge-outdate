import React from 'react';
import { redisChapterById, redisChapters, type RedisChapter, type RedisEdge, type RedisNode } from './redisJourneyData';
import './redis-journey.css';

const STORAGE_KEY = 'redis-journey:v1:completed';

type PendingStep = number | 'last' | null;

function loadCompleted(): Set<string> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return new Set();
    const validIds = new Set(redisChapters.map((chapter) => chapter.id));
    return new Set(parsed.filter((id): id is string => typeof id === 'string' && validIds.has(id)));
  } catch {
    return new Set();
  }
}

function center(node: RedisNode) {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 };
}

function edgePath(from: RedisNode, to: RedisNode) {
  const a = center(from);
  const b = center(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const ax = a.x + Math.sign(dx || 1) * from.w / 2;
  const ay = a.y + (Math.abs(dx) > Math.abs(dy) ? 0 : Math.sign(dy || 1) * from.h / 2);
  const bx = b.x - Math.sign(dx || 1) * to.w / 2;
  const by = b.y - (Math.abs(dx) > Math.abs(dy) ? 0 : Math.sign(dy || 1) * to.h / 2);
  if (Math.abs(dx) > Math.abs(dy)) {
    const middleX = (ax + bx) / 2;
    return `M ${ax} ${ay} C ${middleX} ${ay}, ${middleX} ${by}, ${bx} ${by}`;
  }
  const middleY = (ay + by) / 2;
  return `M ${ax} ${ay} C ${ax} ${middleY}, ${bx} ${middleY}, ${bx} ${by}`;
}

function chapterHash(chapterId: string) {
  return `#/article/redis-${chapterId}`;
}

function RedisJourneyGraph({ chapter, stepIndex, speed }: { chapter: RedisChapter; stepIndex: number; speed: number }) {
  const reactId = React.useId().replaceAll(':', '');
  const markerId = `redis-arrow-${reactId}`;
  const step = chapter.steps[stepIndex];
  const nodeById = React.useMemo(() => new Map(chapter.nodes.map((node) => [node.id, node])), [chapter]);
  const edgeById = React.useMemo(() => new Map(chapter.edges.map((edge) => [edge.id, edge])), [chapter]);
  const activeEdgeId = step.activeEdges?.[0];
  const activeEdge = activeEdgeId ? edgeById.get(activeEdgeId) : undefined;
  const pulsePath = activeEdge
    ? edgePath(nodeById.get(activeEdge.from)!, nodeById.get(activeEdge.to)!)
    : undefined;

  const pathFor = (edge: RedisEdge) => edgePath(nodeById.get(edge.from)!, nodeById.get(edge.to)!);

  return (
    <div className="redisStage" aria-label={`Sơ đồ ${chapter.title}: ${step.title}`}>
      <svg viewBox="0 0 920 520" role="img">
        <title>{`${chapter.title} — ${step.title}`}</title>
        <defs>
          <marker id={markerId} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" className="redisArrowHead" />
          </marker>
        </defs>
        <g className="redisEdges">
          {chapter.edges.map((edge) => {
            const active = step.activeEdges?.includes(edge.id);
            return <path key={edge.id} d={pathFor(edge)} className={`redisEdge${active ? ' active' : ''}`} markerEnd={`url(#${markerId})`} />;
          })}
        </g>
        <g className="redisNodes">
          {chapter.nodes.map((node) => {
            const active = step.activeNodes.includes(node.id);
            const tone = step.tones?.[node.id];
            return (
              <g key={node.id} className={`redisNode${active ? ' active' : ''}${tone ? ` ${tone}` : ''}`}>
                <title>{`${node.title}: ${node.sub}`}</title>
                <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="14" />
                <text x={node.x + node.w / 2} y={node.y + node.h / 2 - 4}>{node.title}</text>
                <text className="redisNodeSub" x={node.x + node.w / 2} y={node.y + node.h / 2 + 19}>{node.sub}</text>
              </g>
            );
          })}
        </g>
        {pulsePath && (
          <circle key={`${chapter.id}-${stepIndex}`} className="redisPulse" r="8">
            <animateMotion path={pulsePath} dur={`${Math.min(900, speed * 0.65)}ms`} fill="freeze" />
          </circle>
        )}
      </svg>
    </div>
  );
}

export function RedisLearningJourney({ chapterId }: { chapterId: string }) {
  const chapter = redisChapterById.get(chapterId) ?? redisChapters[0];
  const chapterIndex = redisChapters.findIndex((candidate) => candidate.id === chapter.id);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1400);
  const [completed, setCompleted] = React.useState<Set<string>>(() => loadCompleted());
  const pendingStep = React.useRef<PendingStep>(null);

  const persistCompleted = React.useCallback((next: Set<string>) => {
    setCompleted(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // Storage can be unavailable in privacy mode; the lesson remains usable in-memory.
    }
  }, []);

  const markCompleted = React.useCallback((id: string) => {
    const next = new Set(completed);
    next.add(id);
    persistCompleted(next);
  }, [completed, persistCompleted]);

  const openChapter = React.useCallback((id: string, target: PendingStep = 0, stopPlayback = true) => {
    pendingStep.current = target;
    if (stopPlayback) setPlaying(false);
    window.location.hash = chapterHash(id);
  }, []);

  React.useEffect(() => {
    const target = pendingStep.current;
    pendingStep.current = null;
    setStepIndex(target === 'last' ? chapter.steps.length - 1 : typeof target === 'number' ? target : 0);
  }, [chapter]);

  const nextStep = React.useCallback((automatic = false) => {
    if (stepIndex < chapter.steps.length - 1) {
      setStepIndex((current) => current + 1);
      return true;
    }
    markCompleted(chapter.id);
    const nextChapter = redisChapters[chapterIndex + 1];
    if (!nextChapter) {
      setPlaying(false);
      return false;
    }
    openChapter(nextChapter.id, 0, !automatic);
    return true;
  }, [chapter, chapterIndex, markCompleted, openChapter, stepIndex]);

  React.useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => nextStep(true), speed);
    return () => window.clearTimeout(timer);
  }, [nextStep, playing, speed]);

  const previousStep = () => {
    setPlaying(false);
    if (stepIndex > 0) {
      setStepIndex((current) => current - 1);
      return;
    }
    const previousChapter = redisChapters[chapterIndex - 1];
    if (previousChapter) openChapter(previousChapter.id, 'last');
  };

  const resetJourney = () => {
    setPlaying(false);
    persistCompleted(new Set());
    if (chapter.id === redisChapters[0].id) setStepIndex(0);
    else openChapter(redisChapters[0].id, 0);
  };

  const renderedStepIndex = Math.min(stepIndex, chapter.steps.length - 1);
  const currentStep = chapter.steps[renderedStepIndex];
  const totalSteps = React.useMemo(() => redisChapters.reduce((sum, item) => sum + item.steps.length, 0), []);
  const stepsBefore = redisChapters.slice(0, chapterIndex).reduce((sum, item) => sum + item.steps.length, 0);
  const overallStep = stepsBefore + renderedStepIndex + 1;
  const overallProgress = overallStep / totalSteps * 100;
  const chapterProgress = (renderedStepIndex + 1) / chapter.steps.length * 100;
  const previousChapter = redisChapters[chapterIndex - 1];
  const nextChapter = redisChapters[chapterIndex + 1];
  const isFirst = chapterIndex === 0 && renderedStepIndex === 0;
  const isLast = chapterIndex === redisChapters.length - 1 && renderedStepIndex === chapter.steps.length - 1;
  const currentChapterCompleted = completed.has(chapter.id);

  return (
    <section className="redisJourney" aria-label="Redis từ Newbie đến Senior DevOps">
      <header className="redisJourneyHeader">
        <span className="badge">Redis Senior DevOps</span>
        <h2>ShopNow Learning Journey</h2>
        <p>Đi từ cache đơn giản đến HA, sharding, multi-region và incident response. Mỗi bước nối requirement với data path, failure mode, metric và runbook.</p>
      </header>

      <nav className="redisChapterRail" aria-label="Các chương Redis">
        {redisChapters.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={item.id === chapter.id ? 'active' : ''}
            aria-current={item.id === chapter.id ? 'page' : undefined}
            onClick={() => openChapter(item.id)}
          >
            <span>{index}</span>{item.navLabel}{completed.has(item.id) && <b aria-label="Đã hoàn thành">✓</b>}
          </button>
        ))}
      </nav>

      <div className="redisJourneyGuide">
        <div className="redisJourneyTop">
          <div><span>{chapter.phase}</span><h3>Trang {chapterIndex} · {chapter.title}</h3></div>
          <strong>{chapterIndex + 1}/{redisChapters.length} bài</strong>
        </div>
        <p className="redisJourneyStory">{chapter.story}</p>
        <div className="redisJourneyContext">
          <article><b>Kế thừa từ bài trước</b><span>{chapter.from}</span></article>
          <article><b>Bài này trả lời</b><span>{chapter.goal}</span></article>
          <article><b>Vì sao học bài kế tiếp?</b><span>{chapter.next}</span></article>
        </div>
        <div className="redisOverallProgress"><div style={{ width: `${overallProgress}%` }} /></div>
        <small>Toàn lộ trình: {overallStep}/{totalSteps} bước</small>
      </div>

      <div className="redisControls" aria-label="Điều khiển hành trình Redis">
        <button type="button" onClick={() => setPlaying((value) => !value)} aria-pressed={playing}>{playing ? '⏸ Tạm dừng' : '▶ Chạy'}</button>
        <button type="button" onClick={previousStep} disabled={isFirst}>← Bước trước</button>
        <button type="button" onClick={() => { setPlaying(false); nextStep(); }} disabled={isLast && currentChapterCompleted}>{renderedStepIndex === chapter.steps.length - 1 && nextChapter ? `Qua trang ${chapterIndex + 1} →` : isLast ? currentChapterCompleted ? '✓ Đã hoàn tất' : '✓ Hoàn tất' : 'Bước tiếp →'}</button>
        <button type="button" onClick={resetJourney}>↺ Reset hành trình</button>
        <label>Tốc độ
          <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
            <option value={2200}>Chậm</option><option value={1400}>Vừa</option><option value={800}>Nhanh</option>
          </select>
        </label>
        <span>Bước {renderedStepIndex + 1}/{chapter.steps.length}</span>
      </div>

      <RedisJourneyGraph chapter={chapter} stepIndex={renderedStepIndex} speed={speed} />

      <div className="redisStepCaption" aria-live="polite">
        <strong>{currentStep.title}</strong>
        <p>{currentStep.text}</p>
        <div><span style={{ width: `${chapterProgress}%` }} /></div>
      </div>

      <div className="redisOpsGrid">
        <article className="redisOutcome"><h3>Kết quả cần đạt</h3><p>{chapter.outcome}</p></article>
        <article className="redisCheckpoint"><h3>Tự kiểm tra</h3><p>{chapter.checkpoint}</p></article>
        <article><h3>Senior DevOps cần hỏi</h3><ul>{chapter.questions.map((question) => <li key={question}>{question}</li>)}</ul></article>
        <article><h3>Metric / tín hiệu</h3><dl>{Object.entries(currentStep.metrics).map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{value}</dd></div>)}</dl></article>
        <article className="redisLogCard"><h3>Log mô phỏng</h3><pre><code>{currentStep.log}</code></pre></article>
      </div>

      <div className="redisChapterNav">
        <button type="button" disabled={!previousChapter} onClick={() => previousChapter && openChapter(previousChapter.id, 'last')}><small>Bài trước</small><span>{previousChapter ? `Trang ${chapterIndex - 1} · ${previousChapter.title}` : 'Đây là bài đầu tiên'}</span></button>
        <button type="button" disabled={!nextChapter} onClick={() => { markCompleted(chapter.id); if (nextChapter) openChapter(nextChapter.id); }}><small>Bài tiếp theo</small><span>{nextChapter ? `Trang ${chapterIndex + 1} · ${nextChapter.title}` : 'Đã hoàn tất lộ trình'}</span></button>
      </div>
    </section>
  );
}
