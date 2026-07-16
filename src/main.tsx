import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  ArrowLeft,
  BrainCircuit,
  Boxes,
  Container,
  Network,
} from 'lucide-react';
import mermaid from 'mermaid';
import './styles.css';

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'strict' });

type ArticleStatus = 'draft' | 'review-needed' | 'ready';
type TopicStatus = 'available' | 'updating';
type View = { type: 'home' } | { type: 'topic'; topicId: string } | { type: 'article'; articleId: string };

type Article = {
  id: string;
  topic: 'AI' | 'Kubernetes' | 'Docker' | 'DevOps';
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
    articleCount: 5,
    icon: <BrainCircuit />,
    bullets: ['AI vs model vs agent', 'Model có “suy nghĩ” không?', 'Reasoning vs non-reasoning', 'Hermes vs Copilot vs ChatGPT', 'Master Hermes Agent'],
  },
  {
    id: 'k8s',
    title: 'Kubernetes',
    description: 'Master Kubernetes từ mental model: control plane, node, pod, service, ingress, rollout và cách debug.',
    status: 'available',
    articleCount: 2,
    icon: <Network />,
    bullets: ['Master Kubernetes', 'Control plane vs worker node', 'Pod/Deployment/Service/Ingress', 'Multi-container Pod patterns'],
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
  {
    id: 'master-kubernetes',
    topic: 'Kubernetes',
    title: 'Làm sao master Kubernetes?',
    question: 'Cần hiểu mô hình K8s, các thành phần và ví von nó như cái gì?',
    summary: 'Muốn master Kubernetes thì hãy xem cluster như một thành phố/cảng container tự vận hành: control plane là tòa thị chính điều phối, worker node là khu nhà xưởng, pod là căn hộ/container chạy app, service là số điện thoại ổn định, ingress là cổng vào thành phố, deployment là kế hoạch đảm bảo luôn đủ bản sao app chạy đúng trạng thái mong muốn.',
    lastVerified: '2026-07-16',
    status: 'draft',
    diagram: `flowchart TD
User["User gửi request"] --> Ingress["Ingress hoặc Gateway: cổng vào cluster"]
Ingress --> Service["Service: địa chỉ ổn định cho app"]
Service --> PodA["Pod A: chạy container app"]
Service --> PodB["Pod B: bản sao app"]
Service --> PodC["Pod C: bản sao app"]
Deploy["Deployment: mong muốn có N bản sao"] --> ReplicaSet["ReplicaSet: giữ đúng số pod"]
ReplicaSet --> PodA
ReplicaSet --> PodB
ReplicaSet --> PodC
Scheduler["Scheduler: xếp pod lên node"] --> Node1["Worker node 1: máy chạy workload"]
Scheduler --> Node2["Worker node 2: máy chạy workload"]
APIServer["API Server: cửa tiếp nhận lệnh"] --> Scheduler
APIServer --> Controller["Controller Manager: so thực tế với mong muốn"]
Controller --> Deploy
Etcd["etcd: sổ hộ khẩu trạng thái cluster"] --> APIServer
Kubelet["Kubelet: quản gia trên mỗi node"] --> PodA
Kubelet --> PodB`,
    points: [
      'Mental model: Kubernetes không phải “máy chủ thần kỳ”. Nó là hệ điều hành cho cụm máy, chuyên giữ workload chạy đúng trạng thái mong muốn.',
      'Ví von dễ hiểu: cluster là thành phố/cảng container; control plane là tòa thị chính/trung tâm điều phối; worker node là khu nhà xưởng; pod là căn hộ nhỏ chứa container app.',
      'API Server là quầy tiếp nhận mọi yêu cầu. kubectl, CI/CD, controller đều nói chuyện với API Server trước, không đi sửa node trực tiếp.',
      'etcd là sổ cái/sổ hộ khẩu của cluster: lưu trạng thái mong muốn và trạng thái quan trọng. Mất etcd là mất trí nhớ cluster.',
      'Scheduler giống bộ phận phân nhà/xếp bãi: thấy pod chưa có node thì chọn worker node phù hợp dựa trên tài nguyên, rule, taint/toleration, affinity.',
      'Controller Manager giống ban kiểm tra: liên tục so “mong muốn” với “thực tế”. Thiếu pod thì tạo thêm, dư thì giảm, pod chết thì kéo lại.',
      'Kubelet là quản gia trên từng node: nhận nhiệm vụ từ API Server, bảo container runtime chạy pod, rồi báo health/status về cluster.',
      'Service là số điện thoại cố định cho nhóm pod. Pod có thể chết/sinh IP mới, nhưng Service giữ endpoint ổn định để app khác gọi.',
      'Ingress/Gateway là cổng vào thành phố: nhận traffic HTTP/HTTPS bên ngoài rồi route vào Service phù hợp.',
      'Muốn master K8s: học theo luồng request → ingress → service → pod → node, và luồng control → desired state → scheduler/controller/kubelet → actual state.',
    ],
    misconceptions: [
      '“Pod là container” — chưa chính xác. Pod là đơn vị deploy nhỏ nhất, có thể chứa một hoặc nhiều container cùng network/storage namespace.',
      '“Service chạy app” — sai. Service không chạy app; Service định tuyến tới các pod đang chạy app.',
      '“Deployment chỉ để deploy lần đầu” — sai. Deployment giữ trạng thái mong muốn lâu dài, hỗ trợ rollout/rollback và tự phục hồi qua ReplicaSet.',
      '“kubectl sửa trực tiếp container” — sai. kubectl gửi intent tới API Server; control plane và node agent thực hiện phần còn lại.',
      '“Master K8s là nhớ hết YAML” — sai. Quan trọng là hiểu object nào giải quyết vấn đề gì, luồng traffic đi đâu, và debug từ symptom về đúng layer.',
    ],
    nextQuestions: ['Pod khác Deployment thế nào?', 'Service khác Ingress thế nào?', 'Debug CrashLoopBackOff theo lớp nào?'],
  },
  {
    id: 'multi-container-trong-pod',
    topic: 'Kubernetes',
    title: 'Mấy loại multi-container trong một Pod?',
    question: 'Khi nào một Pod nên có nhiều container, và mỗi pattern dùng để làm gì?',
    summary: 'Multi-container Pod là khi nhiều container cần sống chung cực gần: cùng network namespace, cùng localhost, cùng volume, cùng lifecycle Pod. Các pattern phổ biến gồm sidecar, ambassador/proxy, adapter, init container và helper/log shipper. Không nên nhét nhiều app độc lập vào một Pod chỉ để “cho tiện”.',
    lastVerified: '2026-07-16',
    status: 'draft',
    diagram: `flowchart TD
Pod["Pod: chung IP, localhost, volume, lifecycle"] --> Main["Main container: app chính"]
Pod --> Sidecar["Sidecar: phụ trợ chạy cạnh app"]
Pod --> Ambassador["Ambassador: proxy/đại sứ kết nối ra ngoài"]
Pod --> Adapter["Adapter: chuẩn hóa output/log/metrics"]
Init["Init container: chạy xong trước khi app start"] --> Pod
Sidecar --> Use1["Ví dụ: log shipper, service mesh proxy, config watcher"]
Ambassador --> Use2["Ví dụ: proxy DB/cache/API bên ngoài"]
Adapter --> Use3["Ví dụ: đổi log custom thành Prometheus metrics"]`,
    points: [
      'Rule gốc: một Pod nên đại diện cho một “đơn vị triển khai” chặt chẽ. Nếu hai container có thể scale/deploy/restart độc lập, thường nên tách Pod.',
      'Sidecar container: container phụ chạy song song với app chính để hỗ trợ chức năng ngang hông như log shipping, service mesh proxy, config reload, TLS proxy.',
      'Ambassador container: đóng vai “đại sứ/proxy” giúp app nói chuyện với dịch vụ bên ngoài bằng interface đơn giản, ví dụ app gọi localhost còn ambassador forward tới DB/API/cache thật.',
      'Adapter container: biến đổi output của app chính sang format chuẩn mà hệ thống khác hiểu, ví dụ convert log custom thành metrics Prometheus hoặc chuẩn hóa log format.',
      'Init container: không chạy song song mãi; nó chạy trước app chính để chuẩn bị môi trường như migrate nhẹ, chờ dependency, render config, tải file cần thiết.',
      'Helper/log shipper: nhiều tài liệu xem là một dạng sidecar cụ thể; nhiệm vụ là gom file log/volume rồi đẩy ra Fluent Bit/Elasticsearch/Loki/S3.',
      'Tất cả container trong Pod dùng chung IP và có thể gọi nhau qua localhost; muốn chia sẻ file thì dùng shared volume trong Pod.',
      'Điểm cần nhớ: multi-container Pod dùng cho coupling chặt, không dùng để gom frontend + backend + database vào chung một Pod trong production.',
    ],
    misconceptions: [
      '“Một Pod nên chứa càng nhiều container càng tiết kiệm” — sai. Nó làm scale, rollout, debug và ownership khó hơn.',
      '“Sidecar là app chính thứ hai” — sai. Sidecar là phụ trợ cho main container, không nên là workload độc lập cần scale riêng.',
      '“Init container là sidecar” — không đúng. Init container chạy xong rồi thoát trước khi main container start; sidecar chạy cùng app trong vòng đời Pod.',
      '“Container trong cùng Pod gọi nhau qua Service” — thường không cần; chúng dùng chung network namespace nên có thể gọi nhau qua localhost.',
    ],
    nextQuestions: ['Sidecar khác init container thế nào?', 'Khi nào nên tách sang Pod riêng?', 'Service mesh proxy có phải sidecar không?'],
  },
  {
    id: 'master-hermes-agent',
    topic: 'AI',
    title: 'Làm sao master Hermes Agent?',
    question: 'Cần hiểu hệ thống Hermes như thế nào, hoạt động ra sao?',
    summary: 'Muốn master Hermes thì đừng xem nó chỉ là chatbot. Hãy hiểu nó như một agent runtime: model là não dự đoán, system prompt/profile là vai trò, tools là tay chân, memory/skills là kinh nghiệm, session/cron/gateway là cách nó chạy workflow lâu dài và kiểm chứng bằng output thật.',
    lastVerified: '2026-07-16',
    status: 'draft',
    diagram: `flowchart TD
User["Người dùng đưa mục tiêu"] --> Surface["Surface: Desktop, CLI, TUI, Gateway"]
Surface --> Profile["Profile: vai trò, quy tắc, memory riêng"]
Profile --> Prompt["Prompt builder: system prompt + context + skills"]
Prompt --> Model["Model provider: OpenAI, Anthropic, OpenRouter, local, custom"]
Model --> Decision{"Cần hành động thật?"}
Decision -- "Không" --> Answer["Trả lời trực tiếp"]
Decision -- "Có" --> Tool["Tool call: file, terminal, browser, GitHub, Sheets, MCP"]
Tool --> Observe["Đọc output thật"]
Observe --> Loop{"Đạt mục tiêu chưa?"}
Loop -- "Chưa" --> Model
Loop -- "Rồi" --> Final["Final: kết luận + bằng chứng verify"]
Profile --> Memory["Memory: sở thích và facts bền vững"]
Profile --> Skills["Skills: quy trình tái dùng"]
Profile --> Automation["Cron, webhook, gateway: tự động hóa"]`,
    points: [
      'Mental model đúng: Hermes không phải “một model mới”. Hermes là lớp runtime/orchestrator điều khiển model, tool, memory, skill, profile và automation.',
      'Luồng cơ bản: người dùng đưa mục tiêu → Hermes dựng context/system prompt → gọi model → nếu cần thì model gọi tool → Hermes đọc output thật → lặp lại cho đến khi đủ bằng chứng → trả lời cuối.',
      'Profile là “nhân sự” khác nhau: default router, engineering-manager, travel-manager, specialist. Mỗi profile có config, memory, skills và session riêng nên phù hợp để chia vai trò.',
      'Tools là điểm khác biệt lớn: Hermes có thể đọc/sửa file, chạy terminal, dùng browser, gọi GitHub, Google Sheets, MCP, cron… Vì vậy nó có thể thực thi và verify, không chỉ gợi ý.',
      'Memory dùng cho facts bền vững về người dùng/môi trường; skills dùng cho quy trình tái dùng. Đừng nhét task tạm thời vào memory; workflow lặp lại thì biến thành skill.',
      'Gateway/cron/webhook biến Hermes thành hệ thống tự động hóa: nhận việc từ Discord/Telegram/Slack/email, chạy job định kỳ, hoặc phản ứng theo event.',
      'Cách master thực dụng: bắt đầu bằng một workflow thật, yêu cầu Hermes chạy và verify; sau đó tách phần lặp lại thành skill/profile/cron thay vì prompt thủ công mỗi lần.',
    ],
    misconceptions: [
      '“Hermes giống ChatGPT nhưng có giao diện khác” — thiếu. ChatGPT là app hội thoại; Hermes là runtime để điều phối model + tool + workflow trên máy/dịch vụ của bạn.',
      '“Có tool là đủ thành agent tốt” — sai. Agent tốt cần scope rõ, quyền vừa đủ, đọc output thật, biết dừng khi có bằng chứng và có guardrail.',
      '“Memory càng nhiều càng tốt” — sai. Memory nên ngắn và bền; quy trình dài nên lưu thành skill, còn tiến độ task thì để session/git/issue quản lý.',
      '“Master Hermes là học hết command” — chưa đủ. Quan trọng hơn là biết thiết kế workflow: profile nào làm gì, tool nào được phép, verify ở đâu, và khi nào cần human review.',
    ],
    nextQuestions: ['Khi nào nên tạo profile mới?', 'Skill khác memory thế nào?', 'Thiết kế workflow Hermes cho DevOps ra sao?'],
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

function MultiContainerPodCircle() {
  return (
    <div className="podCircleViz" aria-label="Sơ đồ vòng tròn các pattern multi-container trong Pod">
      <div className="podCircleHeader">
        <span className="badge">Pod circle</span>
        <strong>Pod ở giữa, các container pattern xoay quanh</strong>
      </div>
      <div className="podOrbit">
        <div className="orbitRing ringOne" />
        <div className="orbitRing ringTwo" />
        <div className="centerPod">
          <span>Pod</span>
          <small>chung IP · localhost · volume · lifecycle</small>
        </div>
        <div className="orbitItem mainContainer"><strong>Main</strong><span>app chính</span></div>
        <div className="orbitItem sidecarContainer"><strong>Sidecar</strong><span>log/proxy/config watcher</span></div>
        <div className="orbitItem ambassadorContainer"><strong>Ambassador</strong><span>proxy ra dịch vụ ngoài</span></div>
        <div className="orbitItem adapterContainer"><strong>Adapter</strong><span>chuẩn hóa log/metrics</span></div>
        <div className="orbitItem initContainer"><strong>Init</strong><span>chạy trước rồi thoát</span></div>
        <div className="orbitItem helperContainer"><strong>Helper</strong><span>log shipper/file helper</span></div>
        <div className="orbitDot d1" /><div className="orbitDot d2" /><div className="orbitDot d3" />
      </div>
      <div className="podPatternCards">
        <div><strong>Luôn có Main</strong><span>Container chạy business logic chính.</span></div>
        <div><strong>Chạy song song</strong><span>Sidecar/Ambassador/Adapter/Helper sống cùng Pod.</span></div>
        <div><strong>Chạy trước</strong><span>Init container chuẩn bị xong rồi mới tới app chính.</span></div>
      </div>
    </div>
  );
}

function K8sTrafficFlow() {
  return (
    <div className="k8sTrafficFlow" aria-label="Mô phỏng traffic vào và ra trong Kubernetes">
      <div className="trafficLegend">
        <span className="badge">Traffic simulator</span>
        <strong>Request đi vào cluster → app xử lý → response đi ra</strong>
      </div>
      <div className="internetCloud">Internet / User</div>
      <div className="trafficLane inbound" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="k8sCity">
        <section className="controlPlaneBox">
          <span className="zoneLabel">Control Plane = tòa thị chính</span>
          <div className="controlGrid">
            <div>API Server<br/><small>quầy tiếp nhận lệnh</small></div>
            <div>Scheduler<br/><small>xếp pod lên node</small></div>
            <div>Controller<br/><small>giữ đúng mong muốn</small></div>
            <div>etcd<br/><small>sổ hộ khẩu cluster</small></div>
          </div>
          <div className="controlPulse" aria-hidden="true"><span /><span /><span /></div>
        </section>
        <section className="trafficPathBox">
          <span className="zoneLabel">Data plane = đường traffic thật</span>
          <div className="trafficStages">
            <div className="trafficNode entry">Ingress / Gateway<br/><small>cổng vào thành phố</small></div>
            <div className="trafficRail" aria-hidden="true"><span /><span /><span /></div>
            <div className="trafficNode service">Service<br/><small>số điện thoại ổn định</small></div>
            <div className="fanoutRail" aria-hidden="true"><span /><span /><span /></div>
            <div className="podPool">
              <div className="nodeBox"><span>Worker Node 1</span><div className="pod activePod">Pod A</div><div className="pod">Pod B</div></div>
              <div className="nodeBox"><span>Worker Node 2</span><div className="pod">Pod C</div><div className="pod activePod delayed">Pod D</div></div>
            </div>
          </div>
          <div className="responseLane" aria-hidden="true"><span /><span /><span /><span /></div>
          <div className="trafficNode response">Response trả ngược ra ngoài</div>
        </section>
      </div>
      <div className="k8sAnalogyGrid">
        <div><strong>Ingress</strong><span>Cổng vào thành phố</span></div>
        <div><strong>Service</strong><span>Số điện thoại không đổi</span></div>
        <div><strong>Pod</strong><span>Căn hộ chạy app</span></div>
        <div><strong>Control Plane</strong><span>Tòa thị chính điều phối</span></div>
      </div>
    </div>
  );
}

function WeatherPipelineFlow() {
  return (
    <div className="animatedFlow" aria-label="Pipeline xử lý câu hỏi thời tiết">
      <div className="flowInput splitInput">
        <span className="badge">Input</span>
        <strong>“Thời tiết hôm nay thế nào?”</strong>
        <div className="tokenStream" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      </div>
      <div className="splitter" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="dualModelFlow">
        <section className="modelPath basePath">
          <div className="laneHeader"><span className="pulseDot" />Base / non-reasoning model</div>
          <div className="verticalPipeline">
            <div className="flowNode startNode">Nhận input</div>
            <div className="flowEdge vertical" aria-hidden="true"><span /><span /><span /></div>
            <div className="flowNode">Sinh phản hồi nhanh theo context</div>
            <div className="flowEdge vertical" aria-hidden="true"><span /><span /><span /></div>
            <div className="flowNode warnNode">Không có live weather → nói thiếu dữ liệu / hỏi địa điểm</div>
            <div className="flowEdge vertical" aria-hidden="true"><span /><span /><span /></div>
            <div className="flowNode outputNode">Output base: “Mình cần địa điểm hoặc quyền tra cứu thời tiết hiện tại.”</div>
          </div>
        </section>
        <section className="modelPath reasoningPath">
          <div className="laneHeader"><span className="pulseDot" />Reasoning model</div>
          <div className="reasoningDecisionFlow">
            <div className="flowNode startNode">Nhận input</div>
            <div className="flowEdge vertical" aria-hidden="true"><span /><span /><span /></div>
            <div className="decisionBlock">
              <div className="flowNode decisionNode">Đủ địa điểm?</div>
              <div className="branchRow">
                <div className="conditionBranch failBranch"><span>No</span><div className="flowNode warnNode">Hỏi lại địa điểm</div><div className="returnArrow" aria-label="Quay lại điều kiện">↺</div></div>
                <div className="conditionBranch passBranch"><span>Yes</span><div className="flowNode">Đi tiếp: cần dữ liệu realtime</div></div>
              </div>
            </div>
            <div className="flowEdge vertical" aria-hidden="true"><span /><span /><span /></div>
            <div className="decisionBlock">
              <div className="flowNode decisionNode">Có tool / nguồn live?</div>
              <div className="branchRow">
                <div className="conditionBranch failBranch"><span>No</span><div className="flowNode warnNode">Xin quyền tra cứu / yêu cầu nguồn</div><div className="returnArrow" aria-label="Quay lại điều kiện">↺</div></div>
                <div className="conditionBranch passBranch"><span>Yes</span><div className="flowNode">Gọi weather API / web</div></div>
              </div>
            </div>
            <div className="flowEdge vertical" aria-hidden="true"><span /><span /><span /></div>
            <div className="decisionBlock">
              <div className="flowNode decisionNode">Tool trả kết quả?</div>
              <div className="branchRow">
                <div className="conditionBranch failBranch"><span>Fail</span><div className="flowNode warnNode">Thử nguồn khác hoặc hỏi người dùng</div><div className="returnArrow" aria-label="Quay lại điều kiện">↺</div></div>
                <div className="conditionBranch passBranch"><span>Đúng</span><div className="flowNode checkNode">Kiểm tra độ tin cậy</div></div>
              </div>
            </div>
            <div className="flowEdge vertical" aria-hidden="true"><span /><span /><span /></div>
            <div className="flowNode outputNode">Output reasoning: “Ở TP.HCM hiện khoảng …, khả năng mưa …; nên mang áo mưa.”</div>
          </div>
        </section>
      </div>
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
        <span className="badge">{article.topic} · Bài {index + 1}</span>
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
  const topicArticles = articles.filter((article) => article.topic === topic.title || (topic.id === 'ai' && article.topic === 'AI'));
  return (
    <main className="pageShell">
      <PageActions onBack={onBack} onHome={onHome} backLabel="Quay lại trang chính" />
      <section className="pageHeader">
        <span className="badge">{topic.title}</span>
        <h1>{topic.id === 'ai' ? 'Các câu hỏi AI đầu tiên' : `Bài học ${topic.title}`}</h1>
        <p className="lead">Chọn từng bài để mở nội dung chi tiết. Trang này không show toàn bộ bài để tránh bị quá tải khi đọc.</p>
      </section>
      {topic.id === 'ai' && <ModelTypesOverview />}
      <div className="articleList">
        {topicArticles.map((article, index) => <ArticleListItem article={article} index={index} key={article.id} onOpen={() => onOpenArticle(article.id)} />)}
      </div>
    </main>
  );
}

function ArticlePage({ article, onBack, onHome }: { article: Article; onBack: () => void; onHome: () => void }) {
  return (
    <main className="pageShell">
      <PageActions onBack={onBack} onHome={onHome} backLabel={`Quay lại danh sách ${article.topic}`} />
      <article className="card articleCard detailArticle">
        <div className="cardHeader">
          <span className="badge">{article.topic}</span>
          <span className={`status ${article.status}`}>{article.status}</span>
        </div>
        <p className="question">Câu hỏi: {article.question}</p>
        <h1>{article.title}</h1>
        <p className="summary">{article.summary}</p>
        {article.id === 'master-kubernetes' ? <K8sTrafficFlow /> : article.id === 'multi-container-trong-pod' ? <MultiContainerPodCircle /> : <MermaidDiagram chart={article.diagram} id={article.id} />}
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
      <section className="topicSection homeTopicSection">
        <div className="sectionIntro">
          <span className="badge">Knowledge map</span>
          <h2>Chọn mảng kiến thức</h2>
          <p>AI và Kubernetes đã có bài đầu tiên. Docker và DevOps được để sẵn khung “đang cập nhật”.</p>
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
    const parentTopic = topics.find((topic) => topic.title === article.topic || (article.topic === 'AI' && topic.id === 'ai')) ?? topics[0];
    return <ArticlePage article={article} onBack={() => openTopic(parentTopic.id)} onHome={openHome} />;
  }

  return <HomePage onOpenTopic={openTopic} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
