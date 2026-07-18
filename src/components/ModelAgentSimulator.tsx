import React from 'react';
import './model-agent-simulator.css';

type LaneCode = 'nr' | 'r' | 'a';
type Step = { title: string; description: string; role: string; code?: string };
type Lane = {
  code: LaneCode;
  title: string;
  tag: string;
  capability: string;
  steps: Step[];
  output: string;
  meta: string;
};

const lanes: Lane[] = [
  {
    code: 'nr',
    title: 'Non-reasoning chạy một mình',
    tag: 'Direct inference',
    capability: 'Hiểu câu hỏi và tạo phản hồi trực tiếp từ context/kiến thức có sẵn. Không có tool, state loop hay network access.',
    steps: [
      { title: 'Đọc prompt', description: 'Nhận diện đây là câu hỏi về thời tiết hiện tại.', role: 'Model' },
      { title: 'Nhận ra thiếu dữ liệu live', description: 'Không có nhiệt độ hiện tại, địa điểm hoặc nguồn thời tiết trong context.', role: 'Model' },
      { title: 'Trả lời và kết thúc', description: 'Không thể tự gọi API. Model trả lời từ dữ liệu đang có hoặc hỏi lại input còn thiếu.', role: 'Model' },
    ],
    output: 'Mình chưa có vị trí và dữ liệu thời tiết trực tiếp. Bạn muốn xem thời tiết ở đâu?',
    meta: 'Không có agent · không có tool call · một lần model inference.',
  },
  {
    code: 'r',
    title: 'Reasoning chạy một mình',
    tag: 'Reasoning-oriented',
    capability: 'Phân rã và kiểm tra điều kiện tốt hơn, nhưng vẫn chỉ làm việc trên context được cấp. Reasoning không tự tạo quyền truy cập dữ liệu live.',
    steps: [
      { title: 'Phân rã yêu cầu', description: 'Cần biết địa điểm, ngày/giờ, nguồn dữ liệu mới và thông tin người dùng quan tâm.', role: 'Reasoning model' },
      { title: 'Kiểm tra giới hạn', description: 'Context không chứa location và không có weather tool được expose.', role: 'Reasoning model', code: 'available_tools = []' },
      { title: 'Chọn câu hỏi làm rõ', description: 'Ưu tiên hỏi đúng slot còn thiếu thay vì đoán dữ liệu thời tiết.', role: 'Reasoning model' },
      { title: 'Nêu giới hạn', description: 'Giải thích rằng cần nguồn dữ liệu thời tiết hiện tại hoặc dữ liệu do người dùng cung cấp.', role: 'Reasoning model' },
    ],
    output: 'Bạn đang ở thành phố hoặc khu vực nào? Mình cần địa điểm và nguồn dữ liệu thời tiết hiện tại để trả lời chính xác.',
    meta: 'Reasoning sâu hơn · vẫn không có network/tool · không thể tự lấy thời tiết live.',
  },
  {
    code: 'a',
    title: 'Reasoning đi cùng agent',
    tag: 'Agentic workflow',
    capability: 'Model quyết định; agent runtime giữ state, expose tool, kiểm tra quyền, thực thi network call và điều khiển vòng lặp.',
    steps: [
      { title: 'Agent chuẩn bị context', description: 'Runtime đưa vị trí TP.HCM, ngày giờ và schema Weather API vào model request.', role: 'Agent runtime' },
      { title: 'Reasoning model chọn tool', description: 'So khớp intent “thời tiết hiện tại” với tool phù hợp và tạo structured tool call.', role: 'Reasoning model', code: 'weather(location="Ho Chi Minh City", date="2026-07-18")' },
      { title: 'Agent thực thi API thật', description: 'Validate arguments, kiểm tra quyền, gửi network request và nhận JSON từ provider.', role: 'Runtime + Weather API', code: '{"temp":31,"condition":"cloudy","rain":40,"wind":12}' },
      { title: 'Đưa tool result vào context', description: 'Runtime gọi model lần nữa với dữ liệu vừa lấy được và state workflow.', role: 'Agent runtime' },
      { title: 'Model kiểm tra dữ liệu', description: 'Kiểm tra location, observed_at, field completeness và tính nhất quán.', role: 'Reasoning model' },
      { title: 'Tổng hợp câu trả lời', description: 'Model tạo output cuối; runtime chuyển output về giao diện người dùng.', role: 'Model + runtime' },
    ],
    output: 'Tại TP.HCM lúc 10:00 ngày 18/07/2026: 31°C, trời có mây, khả năng mưa 40%, gió khoảng 12 km/h.',
    meta: 'Hai lần model inference · một tool call · agent quản lý state, execution và vòng lặp.',
  },
];

const flatSteps = lanes.flatMap((lane) => [
  ...lane.steps.map((_, localIndex) => ({ lane: lane.code, localIndex, output: false })),
  { lane: lane.code, localIndex: lane.steps.length, output: true },
]);

export function ModelAgentSimulator() {
  const [cursor, setCursor] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);

  React.useEffect(() => {
    if (!running) return;
    if (cursor >= flatSteps.length) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setCursor((value) => value + 1), 2200 / speed);
    return () => window.clearTimeout(timer);
  }, [cursor, running, speed]);

  const restart = () => {
    setRunning(false);
    setCursor(0);
  };
  const run = () => {
    setCursor((value) => value >= flatSteps.length ? 0 : value);
    setRunning(true);
  };
  const next = () => {
    setRunning(false);
    setCursor((value) => value >= flatSteps.length ? 0 : value + 1);
  };
  const currentStep = cursor < flatSteps.length ? flatSteps[cursor] : null;
  const currentLane = currentStep ? lanes.find((lane) => lane.code === currentStep.lane) : null;
  const statusText = currentStep && currentLane
    ? `${running ? 'Đang chạy' : 'Đang dừng tại'}: ${currentLane.title} · ${currentStep.output ? 'Output' : `Bước ${currentStep.localIndex + 1}/${currentLane.steps.length}`}`
    : 'Hoàn tất mô phỏng';

  let baseIndex = 0;

  return (
    <section className={`modelAgentSimulator ${running ? 'isRunning' : 'isPaused'}`} aria-label="So sánh non-reasoning, reasoning và reasoning đi cùng agent">
      <header className="simulatorHeader">
        <div>
          <span className="badge">Interactive simulator</span>
          <h2>Model chạy một mình khác gì khi đi cùng agent?</h2>
          <p>Cùng input “Thời tiết hôm nay thế nào?” nhưng quyền, context và runtime khác nhau sẽ tạo ra ba luồng xử lý khác nhau.</p>
        </div>
        <div className="simulatorControls" aria-label="Điều khiển mô phỏng">
          <button type="button" onClick={run}>▶ Tự chạy</button>
          <button type="button" onClick={() => setRunning(false)}>⏸ Dừng</button>
          <button type="button" onClick={next}>⏭ Bước tiếp</button>
          <button type="button" onClick={restart}>↻ Chạy lại</button>
          <label>Tốc độ
            <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
              <option value={0.7}>Rất chậm</option>
              <option value={1}>Chậm</option>
              <option value={1.35}>Bình thường</option>
            </select>
          </label>
        </div>
      </header>

      <div className="simulatorPrompt">
        <strong>👤 User input</strong>
        <span>“Thời tiết hôm nay thế nào?”</span>
        <small>Ngày hiện tại có trong request · Không giả định model tự có Internet</small>
      </div>

      <div className="simulatorBoard">
        {lanes.map((lane) => {
          const laneStart = baseIndex;
          baseIndex += lane.steps.length + 1;
          const outputIndex = laneStart + lane.steps.length;
          return (
            <section className={`simulatorLane lane-${lane.code}`} key={lane.code}>
              <div className="simulatorLaneHead">
                <span className="laneLamp" />
                <h3>{lane.title}</h3>
                <span className="laneTag">{lane.tag}</span>
              </div>
              <p className="laneCapability"><strong>Scope:</strong> {lane.capability}</p>
              {lane.code === 'a' && (
                <div className="agentStack">
                  <strong>Agent stack</strong>
                  <div><span>Context/state</span><span>Tool registry</span><span>Auth/policy</span><span>Execution loop</span><span>Retry/timeout</span></div>
                </div>
              )}
              <div className="simulatorSteps">
                {lane.steps.map((step, localIndex) => {
                  const globalIndex = laneStart + localIndex;
                  const active = cursor === globalIndex;
                  const done = cursor > globalIndex;
                  return (
                    <article className={`simulatorStep ${active ? 'active' : ''} ${done ? 'done' : ''}`} aria-current={active ? 'step' : undefined} key={step.title}>
                      {active && running && <span className="activePacket" aria-hidden="true" />}
                      <div><span className="stepNumber">{localIndex + 1}</span><strong>{step.title}</strong></div>
                      <p>{step.description}</p>
                      {step.code && <code>{step.code}</code>}
                      <small>{step.role}</small>
                    </article>
                  );
                })}
              </div>
              <div className={`simulatorOutput ${cursor === outputIndex ? 'active' : ''} ${cursor > outputIndex ? 'done' : ''}`} aria-current={cursor === outputIndex ? 'step' : undefined}>
                {cursor === outputIndex && running && <span className="activePacket" aria-hidden="true" />}
                <span>OUTPUT</span>
                <p>{lane.output}</p>
                <small>{lane.meta}</small>
              </div>
            </section>
          );
        })}
      </div>

      <div className="simulatorComparison">
        <p><strong>Direct inference:</strong> input → model → output; nhanh, dùng context hiện có và ít bước xác minh hơn.</p>
        <p><strong>Reasoning-oriented inference:</strong> input → xử lý bài toán nhiều bước → final answer; vẫn không có tool nếu runtime không cấp.</p>
        <p><strong>Agentic workflow:</strong> goal → observe → decide → act/tool → observe → … → stop; runtime quản lý state và quyền.</p>
      </div>
      <p className="workflowDisclaimer"><strong>Đây là ba cách tổ chức tác vụ, không phải ba loại model loại trừ nhau.</strong> Cùng một model có thể phục vụ nhiều lane tùy prompt, inference configuration, tools và runtime. Phần hiển thị chỉ là workflow quan sát được, plan/tool call/state hoặc reasoning summary do application chủ động tạo và lưu — không phải hidden chain-of-thought nguyên bản hay log đầy đủ quá trình suy luận.</p>
      <div className="simulatorStatus" aria-live="polite">{statusText}</div>
      <div className="simulatorProgress">
        <span>{statusText}</span>
        <span>{Math.min(cursor + 1, flatSteps.length)} / {flatSteps.length} bước</span>
        <i role="progressbar" aria-label="Tiến độ mô phỏng" aria-valuemin={0} aria-valuemax={flatSteps.length} aria-valuenow={Math.min(cursor + 1, flatSteps.length)}><b style={{ width: `${Math.min(100, (cursor + 1) / flatSteps.length * 100)}%` }} /></i>
      </div>
    </section>
  );
}
