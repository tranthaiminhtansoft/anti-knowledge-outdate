import React from 'react';

type QA = { question: string; answer: string };

export function LessonQA({ items }: { items: QA[] }) {
  return (
    <section className="lessonQA" aria-labelledby="lesson-qa-title">
      <h3 id="lesson-qa-title">Câu hỏi thường gặp</h3>
      <div className="qaList">
        {items.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function StaticArrow({ label }: { label?: string }) {
  return (
    <div className="staticArrow" aria-hidden="true">
      {label && <small>{label}</small>}
      <span>↓</span>
    </div>
  );
}

export function AIApplicationDiagram() {
  const components = [
    ['Model', 'Khả năng đã học từ dữ liệu'],
    ['Model runtime', 'Nạp model và chạy inference'],
    ['Application runtime', 'Điều phối request và lifecycle'],
    ['Data / context', 'Dữ liệu đầu vào, tài liệu, history'],
    ['Tools / external APIs', 'Nguồn dữ liệu và hành động bên ngoài'],
    ['Business logic', 'Rule và mục tiêu sản phẩm'],
    ['Security / permissions', 'Quyền truy cập và guardrail'],
    ['User interface', 'Web, mobile, chat, API'],
  ];

  return (
    <section className="staticLearningDiagram aiApplicationDiagram" aria-label="Kiến trúc tổng quát của một AI application">
      <div className="staticDiagramHeader">
        <span className="badge">Static architecture</span>
        <h3>AI application/system có thể gồm những gì?</h3>
      </div>
      <div className="diagramRoot">AI application / system</div>
      <div className="componentTree" role="list">
        {components.map(([name, description]) => (
          <div className="componentLeaf" role="listitem" key={name}>
            <strong>{name}</strong>
            <small>{description}</small>
          </div>
        ))}
      </div>

      <div className="diagramExamples">
        <article>
          <span className="exampleTag simple">Hệ thống tối giản</span>
          <h4>Phân loại ảnh</h4>
          <div className="staticSequence" aria-label="Image đến model runtime đến vision model đến label">
            <div>Image</div><span>→</span><div>Model runtime</div><span>→</span><div>Vision model</div><span>→</span><div>Label</div>
          </div>
          <p>Không cần tools, memory hay reasoning loop nếu mục tiêu chỉ là ánh xạ một ảnh thành một nhãn. Các bước resize/normalize input và map output có thể nằm bên trong model runtime.</p>
        </article>
        <article>
          <span className="exampleTag assistant">Hệ thống nhiều bước</span>
          <h4>AI assistant</h4>
          <div className="staticSequence verticalSequence" aria-label="User đến application runtime đến reasoning model đến tools APIs đến kiểm tra kết quả đến final answer">
            <div>User</div><StaticArrow/><div>Application runtime</div><StaticArrow/><div>Reasoning model</div><StaticArrow/><div>Tools / APIs</div><StaticArrow/><div>Model kiểm tra kết quả</div><StaticArrow/><div>Final answer</div>
          </div>
          <p>Assistant cần runtime điều phối, quyền tool và bước kiểm tra vì dữ liệu hoặc hành động nằm ngoài model.</p>
        </article>
      </div>
      <div className="keyConcept"><strong>Điểm gốc:</strong> để một hệ thống AI có khả năng đã học từ dữ liệu và tạo dự đoán, nó cần model. Nhưng không phải AI application nào cũng cần đầy đủ mọi thành phần bên trên.</div>
    </section>
  );
}

export function AgentArchitectureDiagram() {
  const parts = [
    ['Model', 'Quyết định nên làm gì tiếp theo'],
    ['Runtime', 'Thực thi hành động thật và quản lý lifecycle'],
    ['Tools', 'Web, API, file, code, email…'],
    ['State / Memory', 'Lưu tiến độ và kết quả trung gian'],
    ['Control loop', 'Lặp suy luận → hành động → quan sát'],
  ];

  return (
    <section className="staticLearningDiagram agentArchitectureDiagram" aria-label="Các thành phần của một AI agent">
      <div className="staticDiagramHeader">
        <span className="badge">Static architecture</span>
        <h3>Agent = Model + Runtime + Tools + State/Memory + Control loop</h3>
      </div>
      <div className="agentFormula" role="list">
        {parts.map(([name, description], index) => (
          <React.Fragment key={name}>
            {index > 0 && <span className="formulaPlus" aria-hidden="true">+</span>}
            <div className="agentPart" role="listitem">
              <strong>{name}</strong>
              <small>{description}</small>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="agentLoopStatic">
        <div><span>1</span><strong>Suy luận</strong><small>Model chọn bước tiếp theo.</small></div>
        <b>→</b>
        <div><span>2</span><strong>Hành động</strong><small>Runtime gọi tool đã được cấp quyền.</small></div>
        <b>→</b>
        <div><span>3</span><strong>Quan sát</strong><small>Kết quả thật quay lại state/context.</small></div>
        <b>↺</b>
        <div><span>4</span><strong>Kiểm tra mục tiêu</strong><small>Đủ bằng chứng thì dừng, chưa đủ thì lặp.</small></div>
      </div>
      <div className="keyConcept"><strong>Quyền tự chủ có giới hạn:</strong> agent chỉ tự chọn nhiều bước trong phạm vi tools, quyền truy cập, sandbox, ngân sách, số vòng lặp và approval policy do application/runtime đặt ra. “Agentic” không đồng nghĩa với toàn quyền hay tự động an toàn.</div>
    </section>
  );
}
