import { useEffect, useMemo, useState } from 'react';
import { kafkaChapterById, kafkaChapters, type KafkaMode, type KafkaNode } from './kafkaJourneyData';
import { nextKafkaStep } from './kafkaSimulation';
import './kafka-journey.css';

type Props = {
  chapterId: string;
  onOpenChapter?: (chapterId: string) => void;
};

const interactiveChapterIds = new Set(['api-flow', 'partitioning', 'architecture', 'rebalance', 'failure', 'production']);

function nodeCenter(node: KafkaNode) {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 };
}

type FlowNodeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle?: string | string[];
  tone?: 'bad' | 'good' | 'kafka';
  kafkaLogo?: boolean;
};

function FlowNode({ x, y, width, height, title, subtitle, tone = 'good', kafkaLogo = false }: FlowNodeProps) {
  const textX = kafkaLogo ? x + 132 : x + width / 2;
  const subtitleLines = typeof subtitle === 'string' ? [subtitle] : subtitle ?? [];
  const hasMultipleSubtitleLines = subtitleLines.length > 1;
  return (
    <g className={`kafkaFlowNode ${tone}`} transform={`translate(${x} ${y})`}>
      <rect height={height} rx="12" width={width} />
      {kafkaLogo && (
        <g aria-hidden="true" className="kafkaFlowLogo" transform="translate(28 19)">
          <path d="M12 4v27M12 10L2 17m10 5L3 29m9-12l11-8m-11 8l12 10" />
          <circle cx="12" cy="4" r="3" /><circle cx="12" cy="17" r="4" /><circle cx="12" cy="31" r="3" />
          <circle cx="2" cy="17" r="3" /><circle cx="3" cy="29" r="3" /><circle cx="23" cy="9" r="3" /><circle cx="24" cy="27" r="3" />
        </g>
      )}
      <text className="kafkaFlowNodeTitle" x={textX - x} y={subtitle ? height / 2 - (hasMultipleSubtitleLines ? 13 : 5) : height / 2 + 5}>{title}</text>
      {subtitleLines.length > 0 && (
        <text className="kafkaFlowNodeSubtitle" x={textX - x} y={height / 2 + (hasMultipleSubtitleLines ? 6 : 15)}>
          {subtitleLines.map((line, index) => <tspan dy={index === 0 ? 0 : 14} key={line} x={textX - x}>{line}</tspan>)}
        </text>
      )}
    </g>
  );
}

type TrafficPhase =
  | 'without-client-request'
  | 'without-request-bundle'
  | 'without-service-request'
  | 'without-service-response'
  | 'without-client-error'
  | 'with-core-transaction'
  | 'with-publish'
  | 'with-ack'
  | 'with-client-success'
  | 'with-consume-lead'
  | 'with-consume'
  | 'with-retry';

type TrafficDotProps = {
  pathId: string;
  traffic: string;
  phase: TrafficPhase;
  tone: 'bad' | 'good';
};

const trafficMotion: Record<TrafficPhase, { points: string; times: string; opacity: string; opacityTimes: string }> = {
  'without-client-request': { points: '0;1;1', times: '0;0.12;1', opacity: '1;1;0;0', opacityTimes: '0;0.115;0.12;1' },
  'without-request-bundle': { points: '0;0;1;1', times: '0;0.12;0.22;1', opacity: '0;0;1;1;0;0', opacityTimes: '0;0.115;0.12;0.215;0.22;1' },
  'without-service-request': { points: '0;0;1;1', times: '0;0.22;0.42;1', opacity: '0;0;1;1;0;0', opacityTimes: '0;0.215;0.22;0.415;0.42;1' },
  'without-service-response': { points: '0;0;1;1', times: '0;0.42;0.68;1', opacity: '0;0;1;1;0;0', opacityTimes: '0;0.415;0.42;0.675;0.68;1' },
  'without-client-error': { points: '0;0;1;1', times: '0;0.68;0.90;1', opacity: '0;0;1;1;0;0', opacityTimes: '0;0.675;0.68;0.895;0.90;1' },
  'with-core-transaction': { points: '0;1;1', times: '0;0.18;1', opacity: '1;1;0;0', opacityTimes: '0;0.175;0.18;1' },
  'with-client-success': { points: '0;0;1;1', times: '0;0.18;0.30;1', opacity: '0;0;1;1;0;0', opacityTimes: '0;0.175;0.18;0.295;0.30;1' },
  'with-publish': { points: '0;0;1;1', times: '0;0.30;0.52;1', opacity: '0;0;1;1;0;0', opacityTimes: '0;0.295;0.30;0.515;0.52;1' },
  'with-ack': { points: '0;0;1;1', times: '0;0.52;0.62;1', opacity: '0;0;1;1;0;0', opacityTimes: '0;0.515;0.52;0.615;0.62;1' },
  'with-consume-lead': { points: '0;0;1;1', times: '0;0.62;0.70;1', opacity: '0;0;1;1;0;0', opacityTimes: '0;0.615;0.62;0.695;0.70;1' },
  'with-consume': { points: '0;0;1;1', times: '0;0.70;0.87;1', opacity: '0;0;1;1;0;0', opacityTimes: '0;0.695;0.70;0.865;0.87;1' },
  'with-retry': { points: '0;0;1', times: '0;0.87;1', opacity: '0;0;1;1', opacityTimes: '0;0.865;0.87;1' },
};

function TrafficDot({ pathId, traffic, phase, tone }: TrafficDotProps) {
  const motion = trafficMotion[phase];
  return (
    <circle aria-hidden="true" className={`kafkaFlowTrafficDot ${tone}`} data-traffic={traffic} r="6">
      <animate attributeName="opacity" dur="9.6s" keyTimes={motion.opacityTimes} repeatCount="indefinite" values={motion.opacity} />
      <animateMotion calcMode="linear" dur="9.6s" keyPoints={motion.points} keyTimes={motion.times} repeatCount="indefinite">
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </circle>
  );
}

export function KafkaLearningJourney({ chapterId, onOpenChapter }: Props) {
  const chapter = kafkaChapterById.get(chapterId) ?? kafkaChapters[0];
  const [mode, setMode] = useState<KafkaMode>('kraft');
  const [stepIndex, setStepIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  const [answerOpen, setAnswerOpen] = useState(false);

  const chapterIndex = kafkaChapters.findIndex((item) => item.id === chapter.id);
  const hasInteractiveLab = interactiveChapterIds.has(chapter.id);
  const projectCase = chapter.projectCase;

  const steps = useMemo(
    () => chapter.id === 'architecture' ? chapter.steps.filter((step) => step.mode === mode) : chapter.steps,
    [chapter, mode],
  );
  const step = steps[Math.min(stepIndex, steps.length - 1)];

  useEffect(() => {
    setStepIndex(0);
    setRunning(false);
    setMode('kraft');
    setLabOpen(false);
    setAnswerOpen(false);
  }, [chapter.id]);

  useEffect(() => {
    if (!running) return;
    if (stepIndex >= steps.length - 1) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setStepIndex((current) => nextKafkaStep(current, steps.length)), 1400);
    return () => window.clearTimeout(timer);
  }, [running, stepIndex, steps.length]);

  const nodeMap = useMemo(() => new Map(chapter.nodes.map((node) => [node.id, node])), [chapter.nodes]);
  const visibleNode = (id: string) => chapter.id !== 'architecture'
    || (mode === 'kraft' ? id !== 'zookeeper' : id !== 'controller-quorum');
  const openChapter = (id: string) => {
    if (onOpenChapter) onOpenChapter(id);
    else window.location.hash = `#/article/kafka-${id}`;
  };
  const switchMode = (nextMode: KafkaMode) => {
    setMode(nextMode);
    setStepIndex(0);
    setRunning(false);
  };

  return (
    <section className="kafkaJourney" aria-label={`Kafka Learning Journey: ${chapter.title}`}>
      <header className="kafkaJourneyHeader">
        <div>
          <span>Kafka Learning Journey · Đọc từ cơ bản đến vận hành</span>
          <p>{chapter.question}</p>
        </div>
        <nav className="kafkaLessonNav" aria-label="Chuyển bài Kafka">
          <button disabled={chapterIndex === 0} onClick={() => openChapter(kafkaChapters[chapterIndex - 1].id)} type="button">← Bài trước</button>
          <button disabled={chapterIndex === kafkaChapters.length - 1} onClick={() => openChapter(kafkaChapters[chapterIndex + 1].id)} type="button">Bài tiếp theo →</button>
        </nav>
      </header>

      {projectCase && (
        <section className="kafkaProjectCase" aria-label="Dự án mẫu sử dụng Kafka">
          <header>
            <span>Case thực hành xuyên suốt</span>
            <h3>{projectCase.name}</h3>
            <p>{projectCase.context}</p>
          </header>
          <aside className="kafkaCaseScopeNote">
            <strong>Phạm vi so sánh:</strong> Order Database tồn tại ở cả hai kiến trúc. Flow có Kafka dùng Transactional Outbox như một lựa chọn chống dual-write; Outbox không phải thành phần của Kafka.
          </aside>
          <div className="kafkaProjectCaseDiagrams">
            <figure aria-label="Luồng ShopNow không sử dụng Kafka" className="bad">
              <figcaption>
                <span>Diagram 1 · Không Kafka</span>
                <h3>Vấn đề trong flash sale</h3>
                <p>{projectCase.problem}</p>
              </figcaption>
              <svg aria-describedby="without-kafka-desc" aria-labelledby="without-kafka-title" className="kafkaCaseFlowchart" preserveAspectRatio="xMidYMid meet" role="img" viewBox="0 0 460 720">
                <title id="without-kafka-title">Không Kafka: một Notification timeout làm Checkout trả lỗi cho Client</title>
                <desc id="without-kafka-desc">Client gọi Checkout API. Checkout commit Order rồi gọi đồng thời Inventory, Notification và Analytics. Inventory và Analytics trả 200 OK, Notification timeout. Vì Checkout phải chờ cả ba dependency, lỗi lan ngược và Client nhận HTTP 500 dù Order cốt lõi đã được lưu.</desc>
                <defs>
                  <marker className="kafkaFlowMarker error" id="without-kafka-arrow" markerHeight="10" markerUnits="userSpaceOnUse" markerWidth="10" orient="auto" refX="8.5" refY="5"><path d="M2 1.5L8.5 5L2 8.5" /></marker>
                  <marker className="kafkaFlowMarker success" id="without-kafka-success-arrow" markerHeight="10" markerUnits="userSpaceOnUse" markerWidth="10" orient="auto" refX="8.5" refY="5"><path d="M2 1.5L8.5 5L2 8.5" /></marker>
                </defs>
                <g className="kafkaFlowConnectors bad">
                  <path d="M230 85V145" id="without-kafka-request" markerEnd="url(#without-kafka-arrow)" />
                  <path d="M230 215V255" markerEnd="url(#without-kafka-arrow)" />
                  <path d="M230 320V360" />
                  <path d="M230 360H90Q78 360 78 372V595" markerEnd="url(#without-kafka-arrow)" />
                  <path d="M230 360V595" markerEnd="url(#without-kafka-arrow)" />
                  <path d="M230 360H370Q382 360 382 372V595" markerEnd="url(#without-kafka-arrow)" />
                  <path className="kafkaFlowMotionPath" d="M230 215V360" id="without-kafka-request-bundle" />
                  <path className="kafkaFlowMotionPath" d="M230 360H90Q78 360 78 372V595" id="without-kafka-inventory-request" />
                  <path className="kafkaFlowMotionPath" d="M230 360V595" id="without-kafka-notification-request" />
                  <path className="kafkaFlowMotionPath" d="M230 360H370Q382 360 382 372V595" id="without-kafka-analytics-request" />
                  <path className="success" d="M68 595V300Q68 288 80 288H105Q117 288 117 276V180Q117 168 129 168H135" id="without-kafka-inventory-response" markerEnd="url(#without-kafka-success-arrow)" />
                  <path className="timeout" d="M220 595V215" id="without-kafka-notification-timeout" markerEnd="url(#without-kafka-arrow)" />
                  <path className="success" d="M392 595V300Q392 288 380 288H355Q343 288 343 276V180Q343 168 331 168H325" id="without-kafka-analytics-response" markerEnd="url(#without-kafka-success-arrow)" />
                  <path className="clientResponse error" d="M210 145V85" id="without-kafka-client-error" markerEnd="url(#without-kafka-arrow)" />
                </g>
                <circle className="kafkaFlowJunction bad" cx="230" cy="360" r="4" aria-hidden="true" />
                <text className="kafkaFlowEdgeLabel bad" x="242" y="120">POST /orders</text>
                <text className="kafkaFlowEdgeLabel bad" x="102" y="112">HTTP 500</text>
                <text className="kafkaFlowEdgeLabel" x="242" y="243">commit Order</text>
                <text className="kafkaFlowEdgeLabel bad" x="242" y="330">
                  <tspan x="242">3 HTTP requests đồng thời</tspan>
                  <tspan x="242" dy="15">Checkout vẫn chờ cả ba</tspan>
                </text>
                <text className="kafkaFlowEdgeLabel good" x="30" y="430">200 OK</text>
                <text className="kafkaFlowEdgeLabel bad" x="226" y="465">TIMEOUT</text>
                <text className="kafkaFlowEdgeLabel good" x="347" y="430">200 OK</text>
                <TrafficDot pathId="without-kafka-request" phase="without-client-request" tone="bad" traffic="without-request" />
                <TrafficDot pathId="without-kafka-request-bundle" phase="without-request-bundle" tone="bad" traffic="without-request-bundle" />
                <TrafficDot pathId="without-kafka-inventory-request" phase="without-service-request" tone="bad" traffic="without-inventory-request" />
                <TrafficDot pathId="without-kafka-notification-request" phase="without-service-request" tone="bad" traffic="without-notification-request" />
                <TrafficDot pathId="without-kafka-analytics-request" phase="without-service-request" tone="bad" traffic="without-analytics-request" />
                <TrafficDot pathId="without-kafka-inventory-response" phase="without-service-response" tone="good" traffic="without-inventory-response" />
                <TrafficDot pathId="without-kafka-notification-timeout" phase="without-service-response" tone="bad" traffic="without-notification-timeout" />
                <TrafficDot pathId="without-kafka-analytics-response" phase="without-service-response" tone="good" traffic="without-analytics-response" />
                <TrafficDot pathId="without-kafka-client-error" phase="without-client-error" tone="bad" traffic="without-client-error" />
                <FlowNode height={60} title="Client" width={140} x={160} y={25} />
                <FlowNode height={70} subtitle="giữ request mở" title="Checkout API" tone="bad" width={190} x={135} y={145} />
                <FlowNode height={65} subtitle="Order committed" title="Orders DB" width={190} x={135} y={255} />
                <FlowNode height={84} subtitle="200 OK" title="Inventory" width={130} x={13} y={595} />
                <FlowNode height={84} subtitle="TIMEOUT · no response" title="Notification" tone="bad" width={130} x={165} y={595} />
                <FlowNode height={84} subtitle="200 OK" title="Analytics" width={130} x={317} y={595} />
              </svg>
              <footer><strong>Failure propagation:</strong> Order đã commit, nhưng Notification <code>TIMEOUT</code> vẫn làm Checkout trả <code>HTTP 500</code>; retry từ Client có thể tạo thêm rủi ro trùng lặp.</footer>
            </figure>
            <figure aria-label="Luồng ShopNow có sử dụng Kafka" className="good">
              <figcaption>
                <span>Diagram 2 · Có Kafka</span>
                <h3>Quyết định dùng Kafka</h3>
                <p>{projectCase.decision}</p>
              </figcaption>
              <svg aria-describedby="with-kafka-desc" aria-labelledby="with-kafka-title" className="kafkaCaseFlowchart" preserveAspectRatio="xMidYMid meet" role="img" viewBox="0 0 460 720">
                <title id="with-kafka-title">Có Kafka và Outbox: Checkout trả HTTP 201 sau khi commit Order + Outbox</title>
                <desc id="with-kafka-desc">Client gọi Checkout API. Checkout commit Order và Outbox trong cùng transaction rồi trả HTTP 201. Sau đó Outbox Relay publish order.created và nhận Produce ACK từ Kafka. Kafka phục vụ event cho ba consumer. Notification Consumer xử lý lỗi và không commit offset nên record vẫn sẵn sàng để đọc lại; lỗi này không quay lại Checkout hoặc Client.</desc>
                <defs>
                  <marker className="kafkaFlowMarker success" id="with-kafka-arrow" markerHeight="10" markerUnits="userSpaceOnUse" markerWidth="10" orient="auto" refX="8.5" refY="5"><path d="M2 1.5L8.5 5L2 8.5" /></marker>
                  <marker className="kafkaFlowMarker error" id="with-kafka-error-arrow" markerHeight="10" markerUnits="userSpaceOnUse" markerWidth="10" orient="auto" refX="8.5" refY="5"><path d="M2 1.5L8.5 5L2 8.5" /></marker>
                </defs>
                <g className="kafkaFlowConnectors good">
                  <path d="M230 70V105" markerEnd="url(#with-kafka-arrow)" />
                  <path d="M230 163V200" markerEnd="url(#with-kafka-arrow)" />
                  <path d="M230 258V295" markerEnd="url(#with-kafka-arrow)" />
                  <path d="M230 353V390" markerEnd="url(#with-kafka-arrow)" />
                  <path d="M230 460V510" />
                  <path d="M230 510H90Q78 510 78 522V595" markerEnd="url(#with-kafka-arrow)" />
                  <path d="M230 510V595" markerEnd="url(#with-kafka-arrow)" />
                  <path d="M230 510H370Q382 510 382 522V595" markerEnd="url(#with-kafka-arrow)" />
                  <path className="ack" d="M330 425H368Q380 425 380 413V324Q380 324 368 324H335" id="with-kafka-ack" markerEnd="url(#with-kafka-arrow)" />
                  <path className="clientResponse success" d="M135 134H102Q90 134 90 122V45Q90 45 102 45H160" id="with-kafka-client-success" markerEnd="url(#with-kafka-arrow)" />
                  <path className="retry" d="M260 460H318Q330 460 330 472V548Q330 560 318 560H262Q250 560 250 572V595" id="with-kafka-retry" markerEnd="url(#with-kafka-error-arrow)" />
                  <path className="kafkaFlowMotionPath" d="M230 45V134V229" id="with-kafka-core-transaction" />
                  <path className="kafkaFlowMotionPath" d="M230 229V324V425" id="with-kafka-publish" />
                  <path className="kafkaFlowMotionPath" d="M230 460V510" id="with-kafka-consume-lead" />
                  <path className="kafkaFlowMotionPath" d="M230 510H90Q78 510 78 522V595" id="with-kafka-inventory" />
                  <path className="kafkaFlowMotionPath" d="M230 510V595" id="with-kafka-notification" />
                  <path className="kafkaFlowMotionPath" d="M230 510H370Q382 510 382 522V595" id="with-kafka-analytics" />
                </g>
                <circle className="kafkaFlowJunction good" cx="230" cy="510" r="4" aria-hidden="true" />
                <text className="kafkaFlowEdgeLabel" x="242" y="91">POST /orders</text>
                <text className="kafkaFlowEdgeLabel good" x="12" y="86">
                  <tspan x="12">HTTP 201 Created</tspan>
                  <tspan x="12" dy="15">không chờ consumers</tspan>
                </text>
                <text className="kafkaFlowEdgeLabel" x="242" y="185">commit Order + Outbox</text>
                <text className="kafkaFlowEdgeLabel" x="242" y="280">relay đọc Outbox</text>
                <text className="kafkaFlowEdgeLabel" x="242" y="376">publish order.created</text>
                <text className="kafkaFlowEdgeLabel good" x="338" y="303">
                  <tspan x="338">Produce ACK</tspan>
                  <tspan x="338" dy="15">event persisted</tspan>
                </text>
                <text className="kafkaFlowEdgeLabel good" x="242" y="500">fan-out độc lập</text>
                <text className="kafkaFlowEdgeLabel bad" x="100" y="542">
                  <tspan x="100">offset chưa commit</tspan>
                  <tspan x="100" dy="15">event vẫn ở Kafka</tspan>
                  <tspan x="100" dy="15">seek / restart / rebalance</tspan>
                </text>
                <TrafficDot pathId="with-kafka-core-transaction" phase="with-core-transaction" tone="good" traffic="core-transaction" />
                <TrafficDot pathId="with-kafka-publish" phase="with-publish" tone="good" traffic="publish" />
                <TrafficDot pathId="with-kafka-ack" phase="with-ack" tone="good" traffic="produce-ack" />
                <TrafficDot pathId="with-kafka-client-success" phase="with-client-success" tone="good" traffic="client-success" />
                <TrafficDot pathId="with-kafka-consume-lead" phase="with-consume-lead" tone="good" traffic="consume-lead" />
                <TrafficDot pathId="with-kafka-inventory" phase="with-consume" tone="good" traffic="consume-inventory" />
                <TrafficDot pathId="with-kafka-notification" phase="with-consume" tone="bad" traffic="consume-notification" />
                <TrafficDot pathId="with-kafka-analytics" phase="with-consume" tone="good" traffic="consume-analytics" />
                <TrafficDot pathId="with-kafka-retry" phase="with-retry" tone="bad" traffic="consumer-retry" />
                <FlowNode height={50} title="Client" width={140} x={160} y={20} />
                <FlowNode height={58} subtitle="business logic" title="Checkout API" width={190} x={135} y={105} />
                <FlowNode height={58} subtitle="Order + Outbox TX" title="Orders DB" width={190} x={135} y={200} />
                <FlowNode height={58} subtitle="Kafka producer client" title="Outbox Relay" width={200} x={130} y={295} />
                <FlowNode height={70} kafkaLogo subtitle="event broker" title="Apache Kafka" tone="kafka" width={200} x={130} y={390} />
                <FlowNode height={84} subtitle="processed" title="Inventory" width={130} x={13} y={595} />
                <FlowNode height={84} subtitle={['FAIL', 'offset chưa commit']} title="Notification" tone="bad" width={130} x={165} y={595} />
                <FlowNode height={84} subtitle="processed" title="Analytics" width={130} x={317} y={595} />
              </svg>
              <footer><strong>Failure isolation:</strong> Client nhận <code>HTTP 201</code> sau khi commit Order + Outbox. Produce ACK và consumer processing xảy ra sau; Notification fail không trả lỗi ngược về Checkout.</footer>
            </figure>
          </div>
        </section>
      )}

      <section className="kafkaBrief">
        <div>
          <span>{chapter.phase}</span>
          <p>{chapter.story}</p>
        </div>
        <aside><strong>Outcome</strong>{chapter.outcome}</aside>
      </section>

      {chapter.callouts && (
        <section className="kafkaCallouts" aria-label="Quyết định có cần Kafka">
          {chapter.callouts.map((item) => (
            <article className={item.tone ?? ''} key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </section>
      )}

      {chapter.flowLanes && (
        <section className="kafkaFlowLanes" aria-label="Hai lane HTTP và Kafka">
          {chapter.flowLanes.map((lane) => (
            <article key={lane.title}>
              <h3>{lane.title}</h3>
              <ol>{lane.steps.map((item) => <li key={item}>{item}</li>)}</ol>
            </article>
          ))}
        </section>
      )}

      {chapter.glossary && (
        <section className="kafkaGlossary" aria-label="Bản đồ thành phần Kafka">
          <header><span>Component map</span><h3>{chapter.glossary.length} thành phần cốt lõi</h3></header>
          <div>{chapter.glossary.map((item) => (
            <article key={item.term}>
              <h4>{item.term}</h4>
              <span>{item.location}</span>
              <p>{item.role}</p>
            </article>
          ))}</div>
        </section>
      )}

      {hasInteractiveLab && !labOpen && (
        <section className="kafkaLabInvite" aria-label="Mô phỏng tùy chọn">
          <div><span>Tùy chọn</span><h3>Chỉ mở khi bạn muốn nhìn luồng chạy</h3><p>Nội dung phía trên đã đủ để hiểu bài. Mô phỏng không phải điểm bắt đầu.</p></div>
          <button onClick={() => setLabOpen(true)} type="button">Mở mô phỏng luồng</button>
        </section>
      )}

      {hasInteractiveLab && labOpen ? (
      <div className="kafkaLab">
      {chapter.id === 'architecture' && (
        <div className="kafkaModeSwitch" role="group" aria-label="Chọn kiến trúc control plane">
          <button aria-pressed={mode === 'kraft'} className={mode === 'kraft' ? 'active' : ''} onClick={() => switchMode('kraft')} type="button">KRaft hiện đại</button>
          <button aria-label="Xem ZooKeeper legacy" aria-pressed={mode === 'zookeeper'} className={mode === 'zookeeper' ? 'active' : ''} onClick={() => switchMode('zookeeper')} type="button">ZooKeeper legacy</button>
        </div>
      )}

      <div className="kafkaControls">
        <button onClick={() => { setStepIndex(0); setRunning(true); }} type="button">Start</button>
        <button disabled={!running} onClick={() => setRunning(false)} type="button">Pause</button>
        <button disabled={running || stepIndex >= steps.length - 1} onClick={() => setStepIndex((current) => nextKafkaStep(current, steps.length))} type="button">Bước tiếp theo</button>
        <button onClick={() => { setRunning(false); setStepIndex(0); }} type="button">Replay / Reset</button>
        <span aria-live="polite">Bước {stepIndex + 1}/{steps.length} · {running ? 'Đang chạy' : 'Đang dừng'}</span>
      </div>

      <div className="kafkaWorkspace">
        <section className="kafkaStage" aria-label="Topology stage">
          <div className="kafkaStageTitle"><span>Topology stage</span><strong>{mode === 'kraft' ? 'KRaft hiện đại' : 'ZooKeeper legacy'}</strong></div>
          <svg role="img" viewBox="0 0 920 470" aria-labelledby="kafka-svg-title kafka-svg-desc">
            <title id="kafka-svg-title">{chapter.title}</title>
            <desc id="kafka-svg-desc">{step.text}</desc>
            <defs>
              <marker id="kafka-arrow" markerHeight="7" markerWidth="8" orient="auto" refX="7" refY="3.5"><path d="M0,0 L8,3.5 L0,7 Z" /></marker>
            </defs>
            {chapter.edges.map((edge) => {
              const from = nodeMap.get(edge.from);
              const to = nodeMap.get(edge.to);
              if (!from || !to || !visibleNode(edge.from) || !visibleNode(edge.to)) return null;
              const a = nodeCenter(from); const b = nodeCenter(to);
              const active = step.activeEdge === edge.id;
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const horizontalish = Math.abs(dx) >= Math.abs(dy);
              const nearlyHorizontal = Math.abs(dy) < 40;
              const relayBrokerEdge = chapter.id === 'api-flow' && new Set([edge.from, edge.to]).has('relay') && new Set([edge.from, edge.to]).has('broker');
              const consumerBrokerEdge = chapter.id === 'api-flow' && new Set([edge.from, edge.to]).has('consumers') && new Set([edge.from, edge.to]).has('broker');
              const curvedBidirectionalEdge = relayBrokerEdge || consumerBrokerEdge;
              const labelX = consumerBrokerEdge
                ? 835
                : relayBrokerEdge
                ? (edge.id === 'produce' ? 700 : 780)
                : (horizontalish ? (a.x + b.x) / 2 : (a.x > 760 ? a.x - 64 : (a.x + b.x) / 2 + 18));
              const labelY = consumerBrokerEdge
                ? (edge.id === 'fetch-request' ? 325 : 245)
                : relayBrokerEdge
                ? (edge.id === 'produce' ? 142 : 194)
                : (nearlyHorizontal
                    ? (dx >= 0 ? Math.min(from.y, to.y) - 14 : Math.max(from.y + from.h, to.y + to.h) + 18)
                    : (a.y + b.y) / 2 + (horizontalish ? (dx >= 0 ? -16 : 20) : -10));
              const length = Math.hypot(dx, dy) || 1;
              const curve = consumerBrokerEdge ? -90 : edge.id === 'produce' ? -34 : 34;
              const controlX = (a.x + b.x) / 2 + (-dy / length) * curve;
              const controlY = (a.y + b.y) / 2 + (dx / length) * curve;
              const curvedPath = consumerBrokerEdge
                ? (edge.id === 'fetch-request'
                    ? 'M 852.5 331 Q 762.5 251 852.5 171'
                    : 'M 852.5 171 Q 902.5 251 852.5 331')
                : `M ${a.x} ${a.y} Q ${controlX} ${controlY} ${b.x} ${b.y}`;
              const labelWidth = Math.max(58, (edge.label?.length ?? 0) * 8 + 22);
              return (
                <g className={`kafkaEdge ${relayBrokerEdge ? 'kafkaEdge--relay-broker' : ''} ${consumerBrokerEdge ? 'kafkaEdge--consumer-broker' : ''} ${active ? 'active' : ''}`} data-edge-id={edge.id} key={edge.id}>
                  {curvedBidirectionalEdge
                    ? <path d={curvedPath} markerEnd="url(#kafka-arrow)" />
                    : <line markerEnd="url(#kafka-arrow)" x1={a.x} x2={b.x} y1={a.y} y2={b.y} />}
                  {edge.label && (curvedBidirectionalEdge
                    ? <g className="kafkaEdgeLabel" transform={`translate(${labelX} ${labelY})`}><rect height="28" rx="8" width={labelWidth} x={-labelWidth / 2} y="-19" /><text y="1">{edge.label}</text></g>
                    : <text x={labelX} y={labelY}>{edge.label}</text>)}
                </g>
              );
            })}
            {chapter.nodes.map((node) => {
              if (!visibleNode(node.id)) return null;
              const active = step.activeNodes.includes(node.id);
              const tone = step.tones?.[node.id] ?? '';
              return (
                <g className={`kafkaNode ${active ? 'active' : ''} ${tone}`} key={node.id} transform={`translate(${node.x} ${node.y})`}>
                  <rect height={node.h} rx="14" width={node.w} />
                  <text x={node.w / 2} y={node.h / 2 - 5}>{node.title}</text>
                  <text className="kafkaNodeSub" x={node.w / 2} y={node.h / 2 + 17}>{node.sub}</text>
                </g>
              );
            })}
          </svg>
          <div className="kafkaTopologyList" aria-label="Topology trên màn hình nhỏ">
            {chapter.nodes.filter((node) => visibleNode(node.id)).map((node) => (
              <article className={`${step.activeNodes.includes(node.id) ? 'active' : ''} ${step.tones?.[node.id] ?? ''}`} key={node.id}>
                <strong>{node.title}</strong><span>{node.sub}</span>
              </article>
            ))}
          </div>
          <div className="kafkaStepCaption">
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            <div><span style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} /></div>
          </div>
        </section>

        <aside className="kafkaEvidence" aria-label="Evidence và trạng thái">
          <header><span>Evidence / State</span><b>Deterministic lab data</b></header>
          <dl>{Object.entries(step.metrics).map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{value}</dd></div>)}</dl>
          <section><h3>Log evidence</h3><pre><code>{step.log}</code></pre></section>
          <section><h3>Runbook</h3><ol>{chapter.runbook.map((item) => <li key={item}>{item}</li>)}</ol></section>
          <section className="kafkaCheckpoint"><h3>Checkpoint</h3><p>{chapter.checkpoint}</p></section>
          <a href={chapter.sourceUrl} rel="noreferrer" target="_blank">Apache Kafka 4.3 docs ↗</a>
        </aside>
      </div>
      </div>) : null}

      <footer className="kafkaKnowledge">
        <article><h3>Mental model</h3><ul>{chapter.keyPoints.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article><h3>Hiểu lầm cần tránh</h3><ul>{chapter.misconceptions.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </footer>

      <section className="kafkaLessonClose" aria-label="Chốt bài">
        <div className="kafkaCheckpointBody">
          <span>Chốt bài</span>
          <h3>Trả lời được câu này rồi mới qua bài tiếp</h3>
          <p>{chapter.checkpoint}</p>
          <button
            aria-controls={`kafka-checkpoint-answer-${chapter.id}`}
            aria-expanded={answerOpen}
            onClick={() => setAnswerOpen((current) => !current)}
            type="button"
          >
            {answerOpen ? 'Ẩn đáp án' : 'Xem đáp án'}
          </button>
          {answerOpen && (
            <div className="kafkaCheckpointAnswer" id={`kafka-checkpoint-answer-${chapter.id}`}>
              <strong>Đáp án</strong>
              <p>{chapter.checkpointAnswer}</p>
            </div>
          )}
        </div>
        <a href={chapter.sourceUrl} rel="noreferrer" target="_blank">Đối chiếu Apache Kafka 4.3 docs ↗</a>
      </section>

      <nav className="kafkaBottomNav" aria-label="Tiếp tục lộ trình Kafka">
        {chapterIndex < kafkaChapters.length - 1
          ? <button onClick={() => openChapter(kafkaChapters[chapterIndex + 1].id)} type="button">Bài tiếp theo: {kafkaChapters[chapterIndex + 1].navLabel} →</button>
          : <span>Bạn đã hoàn thành lộ trình Kafka.</span>}
      </nav>
    </section>
  );
}
