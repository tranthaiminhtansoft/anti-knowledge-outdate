import React from 'react';
import ReactDOM from 'react-dom/client';
import {
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
AI[AI: lĩnh vực rộng] --> Model[Model: học từ dữ liệu, sinh dự đoán]
Model --> Assistant[Assistant: UX trò chuyện + hướng dẫn]
Assistant --> Agent[Agent: mục tiêu + công cụ + vòng lặp kiểm chứng]
Agent --> Tools[Tools: terminal, browser, GitHub, Sheets]
Agent --> Memory[Memory/Context: nhớ quy ước, trạng thái]`,
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
Input[Câu hỏi của người dùng] --> Tokens[Token hóa + context]
Tokens --> Network[Mạng neural tính xác suất token tiếp theo]
Network --> Decode[Decoding: chọn token phù hợp]
Decode --> Output[Câu trả lời]
Output --> Check{Có cần kiểm chứng?}
Check -- Có --> Tools[Tool/test/source/agent loop]
Tools --> Input
Check -- Không --> User[Trả lời người dùng]`,
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
Task[Câu hỏi / nhiệm vụ] --> Simple{Cần nhiều bước?}
Simple -- Không --> Fast[Non-reasoning: nhanh, rẻ hơn, hợp tóm tắt/viết/câu hỏi rõ]
Simple -- Có --> Reason[Reasoning: chậm hơn, tốn hơn, hợp lập kế hoạch/debug/toán/logic]
Reason --> Verify[Kiểm chứng bằng tool/test/source]
Fast --> Human[Người dùng kiểm tra nhanh]`,
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
User[Minh Tân] --> ChatGPT[ChatGPT: hỏi đáp / phân tích]
User --> Copilot[GitHub Copilot: hỗ trợ code trong IDE/GitHub]
User --> Hermes[Hermes: agent runtime]
Hermes --> Profiles[Profiles: manager/specialist]
Hermes --> Tools[Tools: terminal, browser, GitHub, Sheets, cron]
Hermes --> Skills[Skills: quy trình tái dùng]
Hermes --> Verify[Verify: chạy test/build/đọc output thật]`,
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

function MermaidDiagram({ chart, id }: { chart: string; id: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    let cancelled = false;
    mermaid.render(`diagram-${id}`, chart).then(({ svg }) => {
      if (!cancelled && ref.current) ref.current.innerHTML = svg;
    });
    return () => { cancelled = true; };
  }, [chart, id]);
  return <div className="diagram" ref={ref} aria-label="Sơ đồ minh họa" />;
}

function TopicCard({ topic }: { topic: Topic }) {
  const isAvailable = topic.status === 'available';
  return (
    <a className={`topicCard ${topic.status}`} href={isAvailable ? `#${topic.id}` : `#${topic.id}-updating`}>
      <div className="topicIcon">{topic.icon}</div>
      <div className="topicMeta">
        <span className="topicStatus">{isAvailable ? `${topic.articleCount} bài đang có` : 'Đang cập nhật'}</span>
        <h3>{topic.title}</h3>
        <p>{topic.description}</p>
        <ul>{topic.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </a>
  );
}

function UpdatingSection({ topic }: { topic: Topic }) {
  return (
    <section className="card placeholder" id={`${topic.id}-updating`}>
      <div className="placeholderIcon">{topic.icon}</div>
      <div>
        <span className="badge">{topic.title}</span>
        <h3>Đang cập nhật nội dung</h3>
        <p className="summary">Section này đã được giữ chỗ để sau này thêm bài/sơ đồ/mô phỏng. Khi Tân đưa câu hỏi về {topic.title}, nội dung sẽ được bổ sung vào đây.</p>
        <div className="pillRow">{topic.bullets.map((item) => <span key={item}>{item}</span>)}</div>
      </div>
    </section>
  );
}

function ArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <article className="card articleCard" id={article.id}>
      <div className="cardHeader">
        <span className="badge">AI · Bài {index + 1}</span>
        <span className={`status ${article.status}`}>{article.status}</span>
      </div>
      <p className="question">Câu hỏi: {article.question}</p>
      <h3>{article.title}</h3>
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

function App() {
  const availableTopics = topics.filter((topic) => topic.status === 'available');
  const updatingTopics = topics.filter((topic) => topic.status === 'updating');

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow"><Sparkles size={16}/> Anti Knowledge Outdate</p>
          <h1>Bấm vào từng mảng để hiểu kiến thức công nghệ mà không bị lỗi thời.</h1>
          <p className="lead">Trang này chia kiến thức theo section: AI, Kubernetes, Docker, DevOps. Section nào chưa có bài sẽ hiển thị “đang cập nhật”, để repo có khung mở rộng rõ ràng ngay từ đầu.</p>
          <div className="heroActions">
            <a href="#topics">Xem các section</a>
            <a href="#ai" className="secondary">Đọc AI căn bản</a>
            <a href="#readiness" className="secondary">Checklist trước public</a>
          </div>
        </div>
        <div className="panel">
          <div className="metric"><BookOpen/> 4 bài AI đầu tiên</div>
          <div className="metric"><Layers/> Section K8s/Docker/DevOps đã giữ chỗ</div>
          <div className="metric"><GitBranch/> GitHub Pages ready khi public</div>
          <div className="metric"><Bot/> Cập nhật qua Issue → PR → Review</div>
        </div>
      </section>

      <section className="principles">
        <div><BrainCircuit/><h2>Giải thích từ gốc</h2><p>Không chỉ định nghĩa; mỗi bài trả lời câu hỏi “vậy bản chất là gì?”.</p></div>
        <div><Bot/><h2>Có sơ đồ dễ hiểu</h2><p>Dùng flowchart/mô phỏng để thấy luồng hoạt động thay vì chỉ đọc chữ.</p></div>
        <div><ShieldCheck/><h2>Có ngày kiểm chứng</h2><p>Kiến thức AI/DevOps đổi nhanh, mỗi bài cần nguồn và thời điểm review.</p></div>
      </section>

      <section id="topics" className="topicSection">
        <div className="sectionIntro">
          <span className="badge">Knowledge map</span>
          <h2>Chọn mảng kiến thức</h2>
          <p>AI đang có nội dung đầu tiên. Kubernetes, Docker và DevOps được để sẵn khung “đang cập nhật”.</p>
        </div>
        <div className="topicGrid">{topics.map((topic) => <TopicCard key={topic.id} topic={topic} />)}</div>
      </section>

      <ComparisonTable />

      {availableTopics.map((topic) => (
        <section id={topic.id} className="articles" key={topic.id}>
          <div className="sectionIntro split">
            <div>
              <span className="badge">{topic.title}</span>
              <h2>Các câu hỏi AI đầu tiên</h2>
              <p>Ưu tiên trả lời các nhầm lẫn nền tảng: AI là gì, model có suy nghĩ không, reasoning khác gì, Hermes nằm ở đâu.</p>
            </div>
            <div className="sectionStat">{articles.length}<span>bài nháp</span></div>
          </div>
          {articles.map((article, index) => <ArticleCard key={article.id} article={article} index={index} />)}
        </section>
      ))}

      <section className="updatingGrid">
        {updatingTopics.map((topic) => <UpdatingSection key={topic.id} topic={topic} />)}
      </section>

      <section className="card compact" id="readiness">
        <h2>Trạng thái trước khi public</h2>
        <ul className="checklist">
          <li>✅ Tên repo chưa thấy trùng public trên GitHub theo exact search.</li>
          <li>✅ Có disclaimer độc lập, tách license code/content.</li>
          <li>⚠️ Cần bổ sung nguồn chính thức cho từng claim trước khi public.</li>
          <li>⚠️ Cần secret scan và kiểm tra GitHub Actions trước khi đổi visibility.</li>
          <li>⚠️ Cần kiểm tra nhãn hiệu nếu muốn dùng tên này như brand dài hạn.</li>
        </ul>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
