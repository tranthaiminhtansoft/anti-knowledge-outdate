import React from 'react';
import ReactDOM from 'react-dom/client';
import { BookOpen, Bot, BrainCircuit, GitBranch, ShieldCheck, Sparkles } from 'lucide-react';
import mermaid from 'mermaid';
import './styles.css';

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'strict' });

type Article = {
  id: string;
  title: string;
  summary: string;
  lastVerified: string;
  status: 'draft' | 'review-needed' | 'ready';
  diagram: string;
  points: string[];
  misconceptions: string[];
  nextQuestions: string[];
};

const articles: Article[] = [
  {
    id: 'ai-model-assistant-agent',
    title: 'AI, model, assistant, agent khác nhau như thế nào?',
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
      'Khác biệt lớn nhất không phải “thông minh hơn”, mà là mức độ tự động hóa và khả năng xác minh.'
    ],
    misconceptions: [
      '“Cứ có LLM là agent” — sai; agent cần vòng lặp hành động và quan sát.',
      '“Agent luôn đúng hơn” — sai; agent có thể sai nhanh hơn nếu tool/quyền/context sai.'
    ],
    nextQuestions: ['Khi nào chỉ cần ChatGPT?', 'Khi nào cần agent có quyền chạy tool?', 'Agent nên bị giới hạn quyền ra sao?']
  },
  {
    id: 'reasoning-vs-non-reasoning',
    title: 'Reasoning model và non-reasoning model khác nhau ra sao?',
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
      'Không nên yêu cầu hoặc công khai chain-of-thought nội bộ; nên yêu cầu kết luận, bằng chứng và bước kiểm chứng.'
    ],
    misconceptions: [
      '“Reasoning model luôn tốt hơn” — sai vì có thể chậm/tốn cho tác vụ đơn giản.',
      '“Không reasoning là không suy nghĩ” — sai; đó chỉ là cách sản phẩm/model được tối ưu.'
    ],
    nextQuestions: ['Nhiệm vụ DevOps nào nên dùng reasoning?', 'Làm sao đo chất lượng thay vì nghe quảng cáo model?']
  },
  {
    id: 'hermes-vs-copilot-chatgpt',
    title: 'Hermes khác GitHub Copilot và ChatGPT ở đâu?',
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
      'Hermes không thay thế hoàn toàn ChatGPT/Copilot; nó phù hợp khi bạn muốn orchestrate workflow và kiểm chứng bằng hành động thật.'
    ],
    misconceptions: [
      '“Hermes là model riêng” — không hẳn; Hermes có thể dùng nhiều provider/model phía sau.',
      '“Có Hermes thì không cần Copilot” — không đúng; Copilot vẫn rất tiện khi coding trong IDE.'
    ],
    nextQuestions: ['Workflow nào nên chạy bằng Hermes?', 'Khi nào dùng Copilot song song Hermes?', 'Rủi ro khi agent có quyền terminal là gì?']
  }
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

function ArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <article className="card" id={article.id}>
      <div className="cardHeader">
        <span className="badge">Bài {index + 1}</span>
        <span className={`status ${article.status}`}>{article.status}</span>
      </div>
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
      <h2>So sánh nhanh</h2>
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
  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow"><Sparkles size={16}/> Anti Knowledge Outdate</p>
          <h1>Kiến thức AI bằng tiếng Việt, dễ hiểu, có sơ đồ và mô phỏng.</h1>
          <p className="lead">Repo này biến các câu hỏi của Minh Tân thành bài giải thích có nguồn, có ngày kiểm chứng, và có hình dung trực quan để bấm vào là hiểu.</p>
          <div className="heroActions">
            <a href="#articles">Đọc bài đầu tiên</a>
            <a href="#readiness" className="secondary">Checklist trước khi public</a>
          </div>
        </div>
        <div className="panel">
          <div className="metric"><BookOpen/> 3 bài nháp AI đầu tiên</div>
          <div className="metric"><GitBranch/> GitHub Pages ready</div>
          <div className="metric"><ShieldCheck/> Public-readiness gate</div>
          <div className="metric"><Bot/> Cập nhật qua Issue → PR → Review</div>
        </div>
      </section>

      <section className="principles">
        <div><BrainCircuit/><h2>Không chạy theo hype</h2><p>Giải thích trade-off, phạm vi đúng, nguồn và ngày kiểm chứng.</p></div>
        <div><Bot/><h2>Agent phải kiểm chứng</h2><p>Nếu có tool/test/source thì dùng kết quả thật, không phỏng đoán.</p></div>
        <div><ShieldCheck/><h2>An toàn trước public</h2><p>Không copy asset, không lộ secret, không tự động publish nội dung AI chưa review.</p></div>
      </section>

      <ComparisonTable />

      <section id="articles" className="articles">
        <h2>Những câu hỏi đầu tiên</h2>
        {articles.map((article, index) => <ArticleCard key={article.id} article={article} index={index} />)}
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
