import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  BrainCircuit,
  Boxes,
  Container,
  GitBranch,
  Layers,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import mermaid from 'mermaid';
import './styles.css';

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'strict' });

type ArticleStatus = 'draft' | 'review-needed' | 'ready';
type TopicStatus = 'available' | 'updating';
type View = { type: 'home' } | { type: 'topic'; topicId: string } | { type: 'article'; articleId: string };

type Article = {
  id: string;
  topic: 'AI';
  title: string;
  question: string;
  summary: string;
  lastVerified: string;
  status: ArticleStatus;
  diagram: string;
  points: string[];
  misconceptions: string[];
  nextQuestions: string[];
};

type Topic = {
  id: string;
  title: string;
  description: string;
  status: TopicStatus;
  articleCount: number;
  icon: React.ReactNode;
  bullets: string[];
};

type ModelType = {
  name: string;
  shortName: string;
  description: string;
  useCases: string[];
};

const modelTypes: ModelType[] = [
  {
    name: 'Reasoning model',
    shortName: 'Reasoning',
    description: 'Tối ưu cho bài toán nhiều bước: lập kế hoạch, debug, toán/logic, phân tích yêu cầu. Thường chậm hơn và tốn hơn vì dùng thêm token/tài nguyên cho quá trình suy luận.',
    useCases: ['Debug phức tạp', 'Thiết kế kiến trúc', 'Phân rã task nhiều bước'],
  },
  {
    name: 'Non-reasoning / chat model',
    shortName: 'Chat / general',
    description: 'Tối ưu phản hồi nhanh cho tác vụ trực tiếp: hỏi đáp, viết nội dung, tóm tắt, phân loại, giải thích đơn giản. Không có nghĩa là “không suy nghĩ”, chỉ là ít tập trung vào bài nhiều bước.',
    useCases: ['Tóm tắt', 'Viết/biên tập', 'Hỏi đáp rõ ngữ cảnh'],
  },
  {
    name: 'Embedding model',
    shortName: 'Embedding',
    description: 'Biến văn bản/hình ảnh thành vector để tìm kiếm ngữ nghĩa, RAG, gợi ý nội dung tương tự. Nó thường không dùng để chat trực tiếp.',
    useCases: ['Semantic search', 'RAG', 'Dedup/gợi ý tài liệu'],
  },
  {
    name: 'Multimodal / tool-capable model',
    shortName: 'Multimodal / tool',
    description: 'Có thể xử lý thêm ảnh/âm thanh/file hoặc gọi tool qua runtime. Khả năng này thường đến từ cả model lẫn hệ thống bao quanh, không chỉ từ model đơn lẻ.',
    useCases: ['Đọc ảnh/screenshot', 'Phân tích file', 'Agent gọi tool'],
  },
];

const topics: Topic[] = [
  {
    id: 'ai',
    title: 'AI căn bản',
    description: 'Model, agent, reasoning, Copilot, ChatGPT, Hermes — giải thích bằng tiếng Việt thực dụng.',
    status: 'available',
    articleCount: 4,
    icon: <BrainCircuit />,
    bullets: ['AI vs model vs agent', 'Model có “suy nghĩ” không?', 'Reasoning vs non-reasoning', 'Hermes vs Copilot vs ChatGPT'],
  },
  {
    id: 'k8s',
    title: 'Kubernetes',
    description: 'Pod, Deployment, Service, Ingress, rollout, autoscaling và cách debug cluster.',
    status: 'updating',
    articleCount: 0,
    icon: <Network />,
    bullets: ['Pod/Deployment/Service', 'Ingress vs Gateway API', 'Rolling update và rollback'],
  },
  {
    id: 'docker',
    title: 'Docker',
    description: 'Image, container, layer, volume, network, compose và best practices build image.',
    status: 'updating',
    articleCount: 0,
    icon: <Container />,
    bullets: ['Image vs container', 'Dockerfile layers', 'Volume/network/compose'],
  },
  {
    id: 'devops',
    title: 'DevOps thực chiến',
    description: 'CI/CD, GitHub Actions, IaC, observability, release strategy và security guardrails.',
    status: 'updating',
    articleCount: 0,
    icon: <Boxes />,
    bullets: ['CI/CD pipeline', 'IaC blueprint', 'Monitoring và incident review'],
  },
];

const articles: Article[] = [
  {
    id: 'ai-model-assistant-agent',
    topic: 'AI',
    title: 'AI, model, assistant, agent khác nhau như thế nào?',
    question: 'Một “AI app” thật ra gồm những lớp nào?',
    summary: 'AI là khái niệm rộng; model là “động cơ dự đoán”; assistant là giao diện trò chuyện; agent là hệ thống biết lập bước, dùng công cụ và kiểm tra kết quả.',
    lastVerified: '2026-07-14',
    status: 'draft',
    diagram: `flowchart LR
AI["AI: lĩnh vực rộng"] --> Model["Model: học từ dữ liệu, sinh dự đoán"]
Model --> Assistant["Assistant: UX trò chuyện + hướng dẫn"]
Assistant --> Agent["Agent: mục tiêu + công cụ + vòng lặp kiểm chứng"]
Agent --> Tools["Tools: terminal, browser, GitHub, Sheets"]
Agent --> Memory["Memory và Context: nhớ quy ước, trạng thái"]`,
    points: [
      'Model không tự “đi làm việc” nếu không có hệ thống bao quanh.',
      'Assistant giúp con người hỏi/đáp dễ hơn nhưng thường vẫn cần người điều khiển nhiều bước.',
      'Agent nhận mục tiêu, chia bước, gọi tool, đọc kết quả thật và sửa hướng đi.',
      'Khác biệt lớn nhất không phải “thông minh hơn”, mà là mức độ tự động hóa và khả năng xác minh.',
    ],
    misconceptions: [
      '“Cứ có LLM là agent” — sai; agent cần vòng lặp hành động và quan sát.',
      '“Agent luôn đúng hơn” — sai; agent có thể sai nhanh hơn nếu tool/quyền/context sai.',
    ],
    nextQuestions: ['Khi nào chỉ cần ChatGPT?', 'Khi nào cần agent có quyền chạy tool?', 'Agent nên bị giới hạn quyền ra sao?'],
  },
  {
    id: 'model-co-thuc-su-suy-nghi-khong',
    topic: 'AI',
    title: 'Model có thực sự tự suy nghĩ không?',
    question: '“Suy nghĩ” của model là mode, là tính năng, hay là thứ gì khác?',
    summary: 'Model không suy nghĩ như con người. Nó nhận input, biến thành token/vector, rồi dự đoán token tiếp theo theo xác suất. Cái ta gọi là “reasoning/suy luận” là hành vi nổi lên từ dữ liệu huấn luyện, kiến trúc, fine-tuning, prompt, tool và cách runtime cấp thêm bước/tài nguyên để giải bài toán.',
    lastVerified: '2026-07-14',
    status: 'draft',
    diagram: `flowchart TD
Input["Câu hỏi của người dùng"] --> Tokens["Token hóa + context"]
Tokens --> Network["Mạng neural tính xác suất token tiếp theo"]
Network --> Decode["Decoding: chọn token phù hợp"]
Decode --> Output["Câu trả lời"]
Output --> Check{"Có cần kiểm chứng?"}
Check -- "Có" --> Tools["Tool, source, test, agent loop"]
Tools --> Input
Check -- "Không" --> User["Trả lời người dùng"]`,
    points: [
      'Ở mức kỹ thuật, model không có ý thức, mục tiêu cá nhân hay trải nghiệm chủ quan; nó tính toán xác suất dựa trên trọng số đã học và context hiện tại.',
      '“Reasoning model” thường là model được huấn luyện/post-train và vận hành để làm tốt bài nhiều bước hơn; runtime có thể cho nó thêm token, thêm vòng tự kiểm tra hoặc chiến lược giải quyết bài toán.',
      'Vì vậy “suy nghĩ” không chỉ là một nút bật/tắt. Nó là tổ hợp của model architecture, dữ liệu, fine-tuning/RL, prompt, decoding, tool use và agent loop.',
      'Khi thấy model giải từng bước, đó là dấu hiệu của quá trình suy luận được mô phỏng bằng ngôn ngữ; không nên hiểu là model có nhận thức giống người.',
      'Cách dùng an toàn: đừng hỏi “nó có nghĩ thật không?”, hãy hỏi “kết luận có đúng không, có nguồn/test/tool nào kiểm chứng không?”.',
    ],
    misconceptions: [
      '“Model biết mình đang làm gì như con người” — không nên kết luận vậy; hiện tại nó chủ yếu tối ưu sinh câu trả lời phù hợp.',
      '“Reasoning mode là linh hồn mới của model” — sai; đó là cách huấn luyện/vận hành để cải thiện bài toán nhiều bước.',
      '“Model nói tự tin thì chắc đúng” — sai; model có thể hallucinate nếu thiếu dữ kiện hoặc không kiểm chứng.',
    ],
    nextQuestions: ['Token là gì?', 'Tại sao model hallucinate?', 'Tool use giúp giảm sai như thế nào?'],
  },
  {
    id: 'reasoning-vs-non-reasoning',
    topic: 'AI',
    title: 'Reasoning model và non-reasoning model khác nhau ra sao?',
    question: 'Khi nào cần model reasoning, khi nào dùng model thường?',
    summary: 'Reasoning model thường dành thêm thời gian/tài nguyên để giải bài toán nhiều bước; non-reasoning model tối ưu phản hồi nhanh cho tác vụ trực tiếp.',
    lastVerified: '2026-07-14',
    status: 'draft',
    diagram: `flowchart TD
Task["Câu hỏi hoặc nhiệm vụ"] --> Simple{"Cần nhiều bước?"}
Simple -- "Không" --> Fast["Non-reasoning: nhanh, rẻ hơn, hợp tóm tắt, viết, hỏi đáp rõ"]
Simple -- "Có" --> Reason["Reasoning: chậm hơn, tốn hơn, hợp lập kế hoạch, debug, logic"]
Reason --> Verify["Kiểm chứng bằng tool, test, source"]
Fast --> Human["Người dùng kiểm tra nhanh"]`,
    points: [
      'Reasoning không đồng nghĩa luôn đúng; nó chỉ phù hợp hơn cho bài toán cần phân rã và kiểm tra.',
      'Non-reasoning vẫn rất hữu ích cho viết, tóm tắt, phân loại, giải thích đơn giản.',
      'Chi phí và độ trễ là trade-off quan trọng khi chọn model.',
      'Không nên yêu cầu hoặc công khai chain-of-thought nội bộ; nên yêu cầu kết luận, bằng chứng và bước kiểm chứng.',
    ],
    misconceptions: [
      '“Reasoning model luôn tốt hơn” — sai vì có thể chậm/tốn cho tác vụ đơn giản.',
      '“Không reasoning là không suy nghĩ” — sai; đó chỉ là cách sản phẩm/model được tối ưu.',
    ],
    nextQuestions: ['Nhiệm vụ DevOps nào nên dùng reasoning?', 'Làm sao đo chất lượng thay vì nghe quảng cáo model?'],
  },
  {
    id: 'hermes-vs-copilot-chatgpt',
    topic: 'AI',
    title: 'Hermes khác GitHub Copilot và ChatGPT ở đâu?',
    question: 'Nếu Copilot/ChatGPT cũng dùng được tool, vì sao còn cần Hermes?',
    summary: 'ChatGPT mạnh về hội thoại tri thức; GitHub Copilot mạnh trong IDE/code completion; Hermes là agent runtime có profile, tool, memory, skill và automation để thực thi workflow trên máy/dịch vụ của bạn.',
    lastVerified: '2026-07-14',
    status: 'review-needed',
    diagram: `flowchart LR
User["Minh Tân"] --> ChatGPT["ChatGPT: hỏi đáp, phân tích"]
User --> Copilot["GitHub Copilot: hỗ trợ code trong IDE và GitHub"]
User --> Hermes["Hermes: agent runtime"]
Hermes --> Profiles["Profiles: manager và specialist"]
Hermes --> Tools["Tools: terminal, browser, GitHub, Sheets, cron"]
Hermes --> Skills["Skills: quy trình tái dùng"]
Hermes --> Verify["Verify: chạy test, build, đọc output thật"]`,
    points: [
      'Các nền tảng có phần giao nhau: đều có thể chat, viết code, phân tích nội dung.',
      'Copilot thường gần editor/repo hơn; ChatGPT thường là app hội thoại tổng quát.',
      'Hermes khác ở chỗ bạn cấu hình agent có tool thật, profile chuyên môn, skill, cron và memory để chạy quy trình lặp lại.',
      'Hermes không thay thế hoàn toàn ChatGPT/Copilot; nó phù hợp khi bạn muốn orchestrate workflow và kiểm chứng bằng hành động thật.',
    ],
    misconceptions: [
      '“Hermes là model riêng” — không hẳn; Hermes có thể dùng nhiều provider/model phía sau.',
      '“Có Hermes thì không cần Copilot” — không đúng; Copilot vẫn rất tiện khi coding trong IDE.',
    ],
    nextQuestions: ['Workflow nào nên chạy bằng Hermes?', 'Khi nào dùng Copilot song song Hermes?', 'Rủi ro khi agent có quyền terminal là gì?'],
  },
];

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function viewFromHash(): View {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [kind, id] = hash.split('/');
  if (kind === 'topic' && id) return { type: 'topic', topicId: id };
  if (kind === 'article' && id) return { type: 'article', articleId: id };
  return { type: 'home' };
}

function hashForView(view: View) {
  if (view.type === 'topic') return `#/topic/${view.topicId}`;
  if (view.type === 'article') return `#/article/${view.articleId}`;
  return '#/';
}

function MermaidDiagram({ chart, id }: { chart: string; id: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    let cancelled = false;
    mermaid.render(`diagram-${id}`, chart).then(({ svg }) => {
      if (!cancelled && ref.current) ref.current.innerHTML = svg;
    }).catch((error: unknown) => {
      console.error('Mermaid render failed', id, error);
      if (!cancelled && ref.current) ref.current.textContent = 'Sơ đồ đang được chỉnh lại để hiển thị đúng.';
    });
    return () => { cancelled = true; };
  }, [chart, id]);
  return <div className="diagram" ref={ref} aria-label="Sơ đồ minh họa" />;
}

function PageActions({ onBack, onHome, backLabel }: { onBack?: () => void; onHome: () => void; backLabel?: string }) {
  return (
    <div className="pageActions">
      {onBack && <button className="backButton" onClick={onBack} type="button"><ArrowLeft size={18} /> {backLabel ?? 'Quay lại'}</button>}
      <button className="homeButton" onClick={onHome} type="button">Trang chính</button>
    </div>
  );
}

function FlowLane({ title, tone, steps }: { title: string; tone: 'fast' | 'reasoning'; steps: string[] }) {
  return (
    <div className={`flowLane ${tone}`}>
      <div className="laneHeader"><span className="pulseDot" />{title}</div>
      <div className="pipeline">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="flowNode" style={{ animationDelay: `${index * 0.55}s` }}>{step}</div>
            {index < steps.length - 1 && (
              <div className="flowEdge" aria-hidden="true">
                <span style={{ animationDelay: `${index * 0.55}s` }} />
                <span style={{ animationDelay: `${index * 0.55 + 0.22}s` }} />
                <span style={{ animationDelay: `${index * 0.55 + 0.44}s` }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function WeatherPipelineFlow() {
  return (
    <div className="animatedFlow" aria-label="Pipeline xử lý câu hỏi thời tiết">
      <div className="flowInput">
        <span className="badge">Input</span>
        <strong>“Thời tiết hôm nay thế nào?”</strong>
        <div className="tokenStream" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      </div>
      <FlowLane
        title="Non-reasoning: đi đường ngắn"
        tone="fast"
        steps={["Đọc câu hỏi", "Trả lời theo context", "Thiếu live data → hỏi địa điểm/cho phép tra cứu"]}
      />
      <div className="flowLane reasoning">
        <div className="laneHeader"><span className="pulseDot" />Reasoning model: một flow có nhánh đúng/sai</div>
        <div className="reasoningFlow">
          <div className="flowNode startNode">Nhận input</div>
          <div className="flowEdge" aria-hidden="true"><span /><span /><span /></div>
          <div className="flowNode decisionNode">Đủ địa điểm?</div>
          <div className="conditionBranch failBranch">
            <span>Không</span>
            <div className="flowNode warnNode">Hỏi lại: bạn muốn xem thời tiết ở đâu?</div>
            <div className="returnToDecision">
              <div className="loopRail integratedLoop" aria-hidden="true"><span /><span /><span /><span /></div>
              <small>↺ trỏ lại hình thoi “Đủ địa điểm?” sau khi người dùng bổ sung</small>
            </div>
          </div>
          <div className="conditionBranch passBranch">
            <span>Có</span>
            <div className="flowNode">Cần dữ liệu realtime</div>
          </div>
          <div className="flowEdge" aria-hidden="true"><span /><span /><span /></div>
          <div className="flowNode decisionNode">Có tool / nguồn live?</div>
          <div className="conditionBranch failBranch">
            <span>Không</span>
            <div className="flowNode warnNode">Xin quyền tra cứu hoặc yêu cầu nguồn dữ liệu</div>
            <div className="returnToDecision">
              <div className="loopRail integratedLoop" aria-hidden="true"><span /><span /><span /><span /></div>
              <small>↺ trỏ lại hình thoi “Có tool / nguồn live?” khi đã cấp quyền hoặc chọn nguồn khác</small>
            </div>
          </div>
          <div className="conditionBranch passBranch">
            <span>Có</span>
            <div className="flowNode">Gọi weather API / web</div>
          </div>
          <div className="flowEdge" aria-hidden="true"><span /><span /><span /></div>
          <div className="flowNode decisionNode">Tool trả kết quả?</div>
          <div className="conditionBranch failBranch">
            <span>Fail</span>
            <div className="flowNode warnNode">Thử nguồn khác hoặc hỏi người dùng</div>
            <div className="returnToDecision">
              <div className="loopRail integratedLoop" aria-hidden="true"><span /><span /><span /><span /></div>
              <small>↺ trỏ lại hình thoi “Tool trả kết quả?” sau khi thử nguồn khác</small>
            </div>
          </div>
          <div className="conditionBranch passBranch">
            <span>Đúng</span>
            <div className="flowNode checkNode">Kiểm tra kết quả</div>
          </div>
          <div className="flowEdge finalEdge" aria-hidden="true"><span /><span /><span /></div>
          <div className="flowNode outputNode">Tóm tắt đầu ra</div>
        </div>
      </div>
      <div className="flowOutput"><span>Output cuối</span> “Ở TP.HCM hiện khoảng …, khả năng mưa …; nên mang áo mưa.”</div>
    </div>
  );
}

function ModelTypesOverview() {
  return (
    <section className="card compact">
      <div className="sectionIntro">
        <span className="badge">Phân loại model</span>
        <h2>Có mấy loại model thường gặp?</h2>
        <p>Cách chia dưới đây là để dễ hiểu khi dùng sản phẩm AI. Thực tế một model có thể thuộc nhiều nhóm cùng lúc.</p>
      </div>
      <div className="modelTypeGrid">
        {modelTypes.map((modelType, index) => (
          <div className="modelTypeCard" key={modelType.name}>
            <span className="topicStatus">Loại {index + 1}: {modelType.shortName}</span>
            <h3>{modelType.name}</h3>
            <p>{modelType.description}</p>
            <div className="pillRow">{modelType.useCases.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
        ))}
      </div>
      <div className="exampleBox">
        <span className="badge">Ví dụ cùng một input</span>
        <h3>Input: “Thời tiết hôm nay thế nào?”</h3>
        <div className="exampleGrid">
          <div>
            <h4>Non-reasoning / chat model</h4>
            <p>Thường trả lời trực tiếp theo thông tin đang có trong context. Nếu không được nối tool thời tiết/live web, câu trả lời đúng nên là: “Mình không có dữ liệu thời tiết thời gian thực; hãy cho mình địa điểm hoặc cho phép tra cứu.”</p>
            <p><strong>Điểm chính:</strong> nhanh, ít bước, phù hợp nếu chỉ cần phản hồi đơn giản.</p>
          </div>
          <div>
            <h4>Reasoning model</h4>
            <p>Sẽ nhận ra câu hỏi thiếu địa điểm và cần dữ liệu thời gian thực. Nó có thể tự phân rã: cần biết vị trí → cần nguồn live weather → nếu có tool thì gọi tool → tóm tắt kết quả và cảnh báo độ tin cậy.</p>
            <p><strong>Điểm chính:</strong> xử lý có kế hoạch hơn, nhưng vẫn không tự biết thời tiết nếu không có dữ liệu/tool.</p>
          </div>
        </div>
        <WeatherPipelineFlow />
      </div>
    </section>
  );
}

function TopicCard({ topic, onOpen }: { topic: Topic; onOpen: () => void }) {
  const isAvailable = topic.status === 'available';
  return (
    <button className={`topicCard ${topic.status}`} onClick={onOpen} type="button">
      <div className="topicIcon">{topic.icon}</div>
      <div className="topicMeta">
        <span className="topicStatus">{isAvailable ? `${topic.articleCount} bài đang có` : 'Đang cập nhật'}</span>
        <h3>{topic.title}</h3>
        <p>{topic.description}</p>
        <span className="openHint">{isAvailable ? 'Mở section' : 'Xem trạng thái'}</span>
      </div>
    </button>
  );
}

function ArticleListItem({ article, index, onOpen }: { article: Article; index: number; onOpen: () => void }) {
  return (
    <button className="articleListItem" onClick={onOpen} type="button">
      <div>
        <span className="badge">AI · Bài {index + 1}</span>
        <h3>{article.title}</h3>
        <p className="question">{article.question}</p>
        <p>{article.summary}</p>
      </div>
      <span className={`status ${article.status}`}>{article.status}</span>
    </button>
  );
}

function UpdatingPage({ topic, onBack, onHome }: { topic: Topic; onBack: () => void; onHome: () => void }) {
  return (
    <main className="pageShell">
      <PageActions onBack={onBack} onHome={onHome} backLabel="Quay lại" />
      <section className="card emptyPage">
        <div className="placeholderIcon">{topic.icon}</div>
        <span className="badge">{topic.title}</span>
        <h1>Đang cập nhật nội dung</h1>
        <p className="lead">Section này đã được giữ chỗ. Khi Tân đưa câu hỏi về {topic.title}, mình sẽ bổ sung bài giải thích, sơ đồ và mô phỏng vào đây.</p>
        <div className="pillRow">{topic.bullets.map((item) => <span key={item}>{item}</span>)}</div>
      </section>
    </main>
  );
}

function TopicPage({ topic, onBack, onHome, onOpenArticle }: { topic: Topic; onBack: () => void; onHome: () => void; onOpenArticle: (articleId: string) => void }) {
  return (
    <main className="pageShell">
      <PageActions onBack={onBack} onHome={onHome} backLabel="Quay lại trang chính" />
      <section className="pageHeader">
        <span className="badge">{topic.title}</span>
        <h1>Các câu hỏi AI đầu tiên</h1>
        <p className="lead">Chọn từng bài để mở nội dung chi tiết. Trang này không show toàn bộ bài để tránh bị quá tải khi đọc.</p>
      </section>
      <ModelTypesOverview />
      <div className="articleList">
        {articles.map((article, index) => <ArticleListItem article={article} index={index} key={article.id} onOpen={() => onOpenArticle(article.id)} />)}
      </div>
    </main>
  );
}

function ArticlePage({ article, onBack, onHome }: { article: Article; onBack: () => void; onHome: () => void }) {
  return (
    <main className="pageShell">
      <PageActions onBack={onBack} onHome={onHome} backLabel="Quay lại danh sách AI" />
      <article className="card articleCard detailArticle">
        <div className="cardHeader">
          <span className="badge">AI</span>
          <span className={`status ${article.status}`}>{article.status}</span>
        </div>
        <p className="question">Câu hỏi: {article.question}</p>
        <h1>{article.title}</h1>
        <p className="summary">{article.summary}</p>
        <MermaidDiagram chart={article.diagram} id={article.id} />
        <div className="grid2">
          <section>
            <h4>Ý chính</h4>
            <ul>{article.points.map((p) => <li key={p}>{p}</li>)}</ul>
          </section>
          <section>
            <h4>Hiểu lầm thường gặp</h4>
            <ul>{article.misconceptions.map((p) => <li key={p}>{p}</li>)}</ul>
          </section>
        </div>
        <footer className="articleFooter">
          <span>Last verified: {article.lastVerified}</span>
          <span>Câu hỏi tiếp theo: {article.nextQuestions.join(' · ')}</span>
        </footer>
      </article>
    </main>
  );
}

function ComparisonTable() {
  return (
    <section className="card compact" id="compare">
      <div className="sectionIntro">
        <span className="badge">Bảng định vị</span>
        <h2>So sánh nhanh các công cụ AI</h2>
        <p>Không xếp hạng tuyệt đối; chọn theo việc cần làm, context và mức độ cần kiểm chứng.</p>
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th>Nền tảng</th><th>Mạnh nhất khi</th><th>Điểm cần nhớ</th></tr>
          </thead>
          <tbody>
            <tr><td>ChatGPT</td><td>Hỏi đáp, phân tích, viết, học khái niệm</td><td>Thường cần người copy/paste context và tự kiểm chứng</td></tr>
            <tr><td>GitHub Copilot</td><td>Code completion, chat trong IDE/GitHub, hỗ trợ PR/code</td><td>Rất tiện cho developer nhưng không phải runtime workflow tổng quát</td></tr>
            <tr><td>Hermes</td><td>Agent dùng tool thật, profile chuyên môn, automation, kiểm chứng output</td><td>Mạnh khi cấu hình đúng quyền/tool/skill; cần guardrail</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HomePage({ onOpenTopic }: { onOpenTopic: (topicId: string) => void }) {
  return (
    <main>
      <section className="hero compactHero">
        <div>
          <p className="eyebrow"><Sparkles size={16}/> Anti Knowledge Outdate</p>
          <h1>Kho kiến thức công nghệ bằng tiếng Việt, có sơ đồ và ví dụ dễ hiểu.</h1>
          <p className="lead">Chọn một mảng bên dưới để mở nội dung. Trang chính chỉ giữ vai trò bản đồ kiến thức, không đổ hết bài viết ra một lần.</p>
          <div className="heroActions">
            <button onClick={() => onOpenTopic('ai')} type="button">Mở AI căn bản</button>
          </div>
        </div>
        <div className="panel">
          <div className="metric"><BookOpen/> 4 bài AI đầu tiên</div>
          <div className="metric"><Layers/> K8s/Docker/DevOps đang cập nhật</div>
          <div className="metric"><GitBranch/> GitHub Pages ready khi public</div>
          <div className="metric"><Bot/> Cập nhật qua Issue → PR → Review</div>
        </div>
      </section>

      <section className="principles">
        <div><BrainCircuit/><h2>Giải thích từ gốc</h2><p>Không chỉ định nghĩa; mỗi bài trả lời câu hỏi “vậy bản chất là gì?”.</p></div>
        <div><Bot/><h2>Có sơ đồ dễ hiểu</h2><p>Dùng flowchart/mô phỏng để thấy luồng hoạt động thay vì chỉ đọc chữ.</p></div>
        <div><ShieldCheck/><h2>Có ngày kiểm chứng</h2><p>Kiến thức AI/DevOps đổi nhanh, mỗi bài cần nguồn và thời điểm review.</p></div>
      </section>

      <section className="topicSection">
        <div className="sectionIntro">
          <span className="badge">Knowledge map</span>
          <h2>Chọn mảng kiến thức</h2>
          <p>AI đang có nội dung đầu tiên. Kubernetes, Docker và DevOps được để sẵn khung “đang cập nhật”.</p>
        </div>
        <div className="topicGrid">{topics.map((topic) => <TopicCard key={topic.id} topic={topic} onOpen={() => onOpenTopic(topic.id)} />)}</div>
      </section>

      <ComparisonTable />

    </main>
  );
}

function App() {
  const [view, setView] = React.useState<View>(() => viewFromHash());

  React.useEffect(() => {
    const syncFromHash = () => {
      setView(viewFromHash());
      scrollTop();
    };
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const navigate = (nextView: View) => {
    const nextHash = hashForView(nextView);
    if (window.location.hash === nextHash) {
      setView(nextView);
      scrollTop();
      return;
    }
    window.location.hash = nextHash;
  };

  const openTopic = (topicId: string) => navigate({ type: 'topic', topicId });
  const openArticle = (articleId: string) => navigate({ type: 'article', articleId });
  const openHome = () => navigate({ type: 'home' });

  if (view.type === 'topic') {
    const topic = topics.find((item) => item.id === view.topicId) ?? topics[0];
    if (topic.status === 'updating') return <UpdatingPage topic={topic} onBack={openHome} onHome={openHome} />;
    return <TopicPage topic={topic} onBack={openHome} onHome={openHome} onOpenArticle={openArticle} />;
  }

  if (view.type === 'article') {
    const article = articles.find((item) => item.id === view.articleId) ?? articles[0];
    return <ArticlePage article={article} onBack={() => openTopic('ai')} onHome={openHome} />;
  }

  return <HomePage onOpenTopic={openTopic} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
