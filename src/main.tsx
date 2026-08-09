import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  BrainCircuit,
  Boxes,
  Container,
  Database,
  Network,
} from 'lucide-react';
import mermaid from 'mermaid';
import { AIApplicationDiagram, AgentArchitectureDiagram, LessonQA } from './components/AIFundamentalsDiagrams';
import { DockerCoreDiagram, DockerLessonDetails } from './components/DockerLearning';
import { KubernetesConfigurationGuide, KubernetesObservabilityGuide } from './components/KubernetesOperationsLearning';
import { RedisLearningJourney } from './components/redis/RedisLearningJourney';
import { redisChapters } from './components/redis/redisJourneyData';
import { KafkaLearningJourney } from './components/kafka/KafkaLearningJourney';
import { kafkaChapters } from './components/kafka/kafkaJourneyData';
import { ModelAgentSimulator } from './components/ModelAgentSimulator';
import { HermesUseCases } from './HermesUseCases';
import './styles.css';

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'strict' });

type ArticleStatus = 'draft' | 'review-needed' | 'ready';
type TopicStatus = 'available' | 'updating';
type View = { type: 'home' } | { type: 'topic'; topicId: string } | { type: 'article'; articleId: string };

type Article = {
  id: string;
  topic: 'AI' | 'Kubernetes' | 'Docker' | 'Redis' | 'Kafka' | 'DevOps';
  title: string;
  navLabel?: string;
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
    name: 'Multimodal model',
    shortName: 'Multimodal',
    description: 'Nhận thêm modality như ảnh, âm thanh hoặc video bên cạnh text. Phải benchmark riêng khả năng hiểu từng modality, context và chi phí xử lý.',
    useCases: ['Đọc ảnh/screenshot', 'OCR và tài liệu', 'Phân tích audio/video'],
  },
  {
    name: 'Tool-capable model + runtime',
    shortName: 'Tool calling',
    description: 'Model có thể đề xuất structured tool call, nhưng runtime mới thực thi quyền, validation, retry và audit. Đây là capability độc lập với multimodal dù hai nhóm có thể giao nhau.',
    useCases: ['Agent gọi API', 'Workflow có permission', 'Automation cần audit'],
  },
];

const lessonQAs: Record<string, { question: string; answer: string }[]> = {
  'ai-model-assistant-agent': [
    {
      question: 'AI application có bắt buộc phải có đủ mọi thành phần không?',
      answer: 'Không. Thành phần phụ thuộc mục tiêu. Image classifier có thể chỉ cần model runtime + vision model; assistant nhiều bước mới cần application runtime, tools, permissions, context và bước kiểm tra.',
    },
    {
      question: 'Để AI có khả năng học được thì cần gì?',
      answer: 'Cần model được train hoặc fine-tune từ dữ liệu. Runtime và logic chính điều phối hệ thống nhưng không tự mang những pattern đã học trong trọng số model.',
    },
  ],
  'model-co-thuc-su-suy-nghi-khong': [
    {
      question: 'Model có thực sự tự suy nghĩ?',
      answer: 'Không theo nghĩa ý thức như con người. Model tính output từ trọng số đã học và context hiện tại. “Reasoning” mô tả khả năng xử lý bài nhiều bước và tự kiểm tra tốt hơn, không chứng minh model có trải nghiệm chủ quan.',
    },
    {
      question: 'Tại sao lại cần model?',
      answer: 'Model chứa khả năng đã học từ dữ liệu. Nếu chỉ có runtime và code thông thường, hệ thống chỉ làm được rule do lập trình viên viết sẵn; nó không tự phân loại ảnh, sinh ngôn ngữ hoặc nhận ra pattern phức tạp từ dữ liệu.',
    },
    {
      question: 'Reasoning model nên chọn DeepSeek hay GPT?',
      answer: 'Không chọn chỉ theo tên hãng. Hãy lấy 2–3 ứng viên như OpenAI reasoning/GPT, DeepSeek-R1, Claude extended thinking hoặc Gemini thinking-capable, rồi chạy cùng bộ bài thật của bạn. Chọn model đạt ngưỡng chất lượng với latency, chi phí, privacy và tool calling phù hợp nhất.',
    },
    {
      question: 'Có nên dùng reasoning model cho mọi request?',
      answer: 'Không. Tóm tắt, phân loại, extraction và chat trực tiếp thường hợp model general/fast hơn. Một router thực dụng có thể dùng model nhanh trước, chỉ chuyển sang reasoning model khi task nhiều bước, độ rủi ro cao hoặc lần đầu không đạt tiêu chí.',
    },
  ],
  'rag-grounding-runtime': [
    {
      question: 'RAG có thay thế fine-tuning không?',
      answer: 'Không. RAG đưa bằng chứng ngoài model vào context tại runtime; fine-tuning thay đổi trọng số để thay đổi hành vi hoặc kỹ năng. Có thể kết hợp cả hai, nhưng phải đánh giá riêng retrieval và chất lượng câu trả lời.',
    },
    {
      question: 'Có vector database là đã có RAG tốt chưa?',
      answer: 'Chưa. Chất lượng còn phụ thuộc tài liệu nguồn, chunking, metadata/filter, hybrid search, rerank, context budget và cách hệ thống từ chối khi không có bằng chứng.',
    },
  ],
  'k8s-workload-configuration': [
    {
      question: 'Có thể copy requests/limits từ một service tương tự không?',
      answer: 'Chỉ dùng làm baseline tạm thời. Phải chạy load gần traffic mục tiêu, đo CPU, memory working set, startup peak, throttling và OOM rồi canary. Hai service cùng framework vẫn có object graph, concurrency và request profile khác nhau.',
    },
    {
      question: 'Taint/Toleration khác Node Affinity thế nào?',
      answer: 'Taint repels Pod; toleration cho Pod quyền đi qua rào cản đó. Node affinity thu hút hoặc bắt buộc Pod chọn node có label phù hợp. Dedicated node pool thường dùng cả taint+toleration và affinity.',
    },
  ],
  'k8s-observability-probes': [
    {
      question: 'Readiness fail có restart container không?',
      answer: 'Không. Kubelet đánh dấu Pod chưa Ready và controller endpoints rút Pod khỏi traffic. Restart là hành động của liveness hoặc startup probe khi chúng fail đủ threshold.',
    },
    {
      question: 'Tại sao không dùng cùng endpoint kiểm tra database cho liveness?',
      answer: 'Vì database outage không được chữa bằng cách restart mọi application Pod. Điều đó dễ tạo restart storm. Liveness nên kiểm tra process có tự hồi phục được không; readiness mới cân nhắc dependency thiết yếu để quyết định nhận traffic.',
    },
  ],
  agent: [
    {
      question: 'Agent khác AI application thế nào?',
      answer: 'Agent là một loại AI application có control loop và quyền tự điều phối nhiều bước. AI application thông thường có thể chỉ chạy một inference rồi trả output; agent có thể chọn tool, thực thi, quan sát kết quả, cập nhật state và lặp đến khi đạt mục tiêu.',
    },
  ],
  'model-context-protocol': [
    {
      question: 'MCP có phải là agent hoặc tool không?',
      answer: 'Không. MCP là protocol để AI application kết nối chuẩn hóa tới MCP server; server có thể cung cấp tools, resources và prompts. Agent/runtime vẫn quyết định có gọi capability nào và chịu trách nhiệm permission, approval, audit.',
    },
    {
      question: 'MCP server có tự an toàn không?',
      answer: 'Không. Cần least privilege, allowlist server/tool, xác thực nguồn server, approval cho side effect, giới hạn dữ liệu đưa vào model và audit log. Một server/tool được kết nối không tự động đáng tin hay được phép toàn quyền.',
    },
  ],
  'hermes-vs-copilot-chatgpt': [
    {
      question: 'Hermes Agent có phải là một model không?',
      answer: 'Không. Hermes là agent runtime dùng model/provider phía sau, sau đó kết hợp profile, tools, memory, skills, sessions và automation để thực thi workflow.',
    },
    {
      question: 'Profile khác một system prompt thế nào?',
      answer: 'System prompt chỉ là một phần. Profile là gói cấu hình/data home tách riêng, có thể gồm config, SOUL.md, sessions, memory, skills và plugins; Hermes runtime nạp profile khi bắt đầu một phiên.',
    },
    {
      question: 'Nên chọn reasoning effort nào?',
      answer: 'Dùng mức thấp nhất vẫn đạt pass rate trên task thật: none/minimal cho thao tác gần xác định; low/medium làm baseline hằng ngày; high/xhigh/max/ultra cho bài toán nhiều bước, mơ hồ hoặc rủi ro cao. Các mức khả dụng còn phụ thuộc model/provider; luôn đo lại latency, token/cost và số vòng retry/tool call.',
    },
    {
      question: 'Fast Mode có làm model suy luận kém hơn không?',
      answer: 'Không phải theo thiết kế. /fast chọn priority processing hoặc Fast Mode ở model/provider được Hermes hỗ trợ; /reasoning mới là trục effort. Chỉ bật Fast khi latency đáng giá hơn premium cost, và kiểm tra hỗ trợ bằng /fast status.',
    },
  ],
};

const topics: Topic[] = [
  {
    id: 'ai',
    title: 'AI căn bản',
    description: 'Sáu lớp nền tảng: AI application, Model, RAG, Agent, MCP và Hermes Agent — từ khái niệm đến runtime thực thi.',
    status: 'available',
    articleCount: 6,
    icon: <BrainCircuit />,
    bullets: ['AI', 'Model', 'RAG', 'Agent', 'MCP', 'Hermes Agent'],
  },
  {
    id: 'k8s',
    title: 'Kubernetes',
    description: 'Master Kubernetes từ mental model: control plane, node, pod, service, ingress, rollout và cách debug.',
    status: 'available',
    articleCount: 4,
    icon: <Network />,
    bullets: ['Kubernetes cốt lõi', 'Multi-container Pod', 'Configuration', 'Observability'],
  },
  {
    id: 'docker',
    title: 'Docker',
    description: 'Docker từ core runtime tới build, cache, dữ liệu, Compose và container networking.',
    status: 'available',
    articleCount: 6,
    icon: <Container />,
    bullets: ['Core', 'Multi-stages', 'Build Cache', 'Volume', 'Docker Compose', 'Network'],
  },
  {
    id: 'redis',
    title: 'Redis',
    description: 'Redis từ cache request flow tới persistence, HA, sharding, multi-region, deployment và incident response.',
    status: 'available',
    articleCount: redisChapters.length,
    icon: <Database />,
    bullets: ['Cache & memory', 'HA & Sentinel', 'Cluster & multi-region', 'Production operations'],
  },
  {
    id: 'kafka',
    title: 'Kafka',
    description: 'Kafka từ event flow, broker và partition tới KRaft, consumer lag, failure recovery và production operations.',
    status: 'available',
    articleCount: kafkaChapters.length,
    icon: <Network />,
    bullets: ['Broker & partition', 'KRaft vs ZooKeeper', 'Producer & consumer', 'Production pain lab'],
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
    title: 'AI application là gì?',
    navLabel: 'AI',
    question: 'Một AI application hoàn chỉnh gồm những thành phần nào?',
    summary: 'AI application là phần mềm sử dụng một hoặc nhiều model, kết hợp với runtime, dữ liệu, tools và logic ứng dụng để cung cấp một chức năng thông minh hoàn chỉnh. Model là phần giúp hệ thống có khả năng đã học từ dữ liệu; các lớp còn lại biến khả năng đó thành một sản phẩm có input, output, quyền và mục tiêu rõ ràng.',
    lastVerified: '2026-07-18',
    status: 'review-needed',
    diagram: `Custom static AI application architecture`,
    points: [
      'AI application/system có thể gồm model, model runtime, application runtime, data/context, tools hoặc external APIs, logic chính, security/permissions và user interface.',
      'Không phải hệ thống nào cũng cần đủ tám thành phần. Image classifier đơn giản có thể chỉ cần Image → Model runtime → Vision model → Label.',
      'Một AI assistant thường cần nhiều lớp hơn: Người dùng → Application runtime → Reasoning model → Tools/APIs → kiểm tra kết quả → Final answer.',
      'Model chứa khả năng đã học từ dữ liệu. Runtime chỉ nạp/chạy model và điều phối request; runtime không thay thế kiến thức đã được học trong model.',
      'Business logic và security quyết định AI được phép làm gì, khi nào phải hỏi người dùng và output nào được chấp nhận.',
    ],
    misconceptions: [
      '“AI application chính là model” — sai. Model chỉ là một thành phần của sản phẩm AI hoàn chỉnh.',
      '“AI nào cũng cần agent, tools và memory” — sai. Bài toán inference đơn giản có thể chỉ cần model runtime và model.',
      '“Có model là tự có UI, API và quyền truy cập dữ liệu” — sai. Những phần đó thuộc application/runtime bao quanh model.',
    ],
    nextQuestions: ['Model runtime khác application runtime thế nào?', 'Khi nào một AI app cần tools?', 'Business logic nên kiểm tra output ra sao?'],
  },
  {
    id: 'model-co-thuc-su-suy-nghi-khong',
    topic: 'AI',
    title: 'Model là gì và có mấy loại?',
    navLabel: 'Model',
    question: 'Tại sao AI cần model, và model có thực sự tự suy nghĩ không?',
    summary: 'Model là phần đã học pattern từ dữ liệu để biến input thành prediction/output. Có nhiều cách phân loại theo nhiệm vụ và hành vi: classification, regression, generative/LLM, embedding, vision, multimodal, reasoning và non-reasoning. Một model có thể thuộc nhiều nhóm cùng lúc; tên nhóm chỉ giúp chọn đúng công cụ, không phải ranh giới tuyệt đối.',
    lastVerified: '2026-07-18',
    status: 'review-needed',
    diagram: `Interactive ModelAgentSimulator component`,
    points: [
      'Model học các tham số/trọng số từ dữ liệu huấn luyện. Inference dùng những trọng số đó và input hiện tại để tạo prediction, vector, label hoặc token tiếp theo.',
      'Theo output có classification model, regression model, generative model/LLM và embedding model. Theo modality có text, vision, audio và multimodal model.',
      'Reasoning/non-reasoning mô tả cách model được huấn luyện và vận hành cho bài nhiều bước; không có nghĩa một bên có ý thức còn bên kia không suy nghĩ.',
      'Chọn model theo quality gate trên workload thật, latency, chi phí, context, tool/structured-output reliability, modality, privacy và cách deploy — không chọn chỉ theo benchmark hay tên hãng.',
      'DeepSeek-R1, OpenAI reasoning/GPT, Claude extended thinking và Gemini thinking-capable là các nhóm ứng viên reasoning để benchmark; model nhanh/general phù hợp hơn cho tóm tắt, extraction và chat trực tiếp.',
      'Một chiến lược tiết kiệm là dùng model nhanh làm mặc định rồi route sang reasoning model cho task nhiều bước, rủi ro cao hoặc case không đạt quality gate.',
      'Model chạy một mình chỉ thấy context và tool schemas được cung cấp. Nó không tự có Internet, quyền file hay API nếu application/agent runtime không cấp.',
      'AI cần model vì runtime và logic chính không tự mang khả năng đã học. Không có model, hệ thống chỉ còn code/rule do con người viết sẵn.',
    ],
    misconceptions: [
      '“Model biết mình đang làm gì như con người” — không nên kết luận vậy; model tính toán output dựa trên trọng số và context.',
      '“Reasoning model tự có Internet và tool” — sai. Tool access đến từ runtime và permission bên ngoài model.',
      '“Mỗi model chỉ thuộc đúng một loại” — sai. Một multimodal LLM có thể vừa generative, reasoning và tool-capable.',
      '“Model càng lớn thì luôn phù hợp hơn” — sai. Latency, chi phí, dữ liệu, task và khả năng kiểm chứng đều quan trọng.',
      '“DeepSeek hay GPT luôn tốt hơn cho mọi tình huống” — sai. Cùng một model có thể thắng benchmark này nhưng thua workload, ngôn ngữ, tool schema hoặc hạ tầng cụ thể của bạn.',
      '“Reasoning model nên xử lý mọi request” — lãng phí. Model general/fast thường đủ tốt và nhanh hơn cho task trực tiếp; reasoning tier nên được route theo độ khó và impact.',
    ],
    nextQuestions: ['Model được train như thế nào?', 'Embedding khác generation ra sao?', 'Reasoning model có thêm gì ở runtime?'],
  },
  {
    id: 'rag-grounding-runtime',
    topic: 'AI',
    title: 'RAG là gì?',
    navLabel: 'RAG',
    question: 'Làm sao để AI trả lời dựa trên tài liệu mới và có thể kiểm tra nguồn?',
    summary: 'RAG (Retrieval-Augmented Generation) tìm bằng chứng từ dữ liệu ngoài model ở runtime rồi đưa phần liên quan vào context trước khi model trả lời: một “open-book exam” có kiểm soát.',
    lastVerified: '2026-08-09',
    status: 'review-needed',
    diagram: `flowchart LR
  A[Tài liệu đã cấp quyền] --> B[Ingest + chunk + metadata]
  B --> C[Keyword / vector index]
  Q[Câu hỏi] --> D[Retrieve + filter + rerank]
  C --> D --> E[Context có nguồn] --> F[LLM] --> G[Answer + citation hoặc từ chối]`,
    points: [
      'Pipeline: ingest → chunk/metadata → keyword, vector hoặc hybrid index → retrieve/filter/rerank → context → answer kèm citation.',
      'Retrieval phải filter theo tenant/user; không đưa chunk không được phép vào context.',
      'Nếu không có bằng chứng đủ tốt, hệ thống phải từ chối thay vì suy đoán. Đánh giá riêng retrieval và grounded answer.',
      'Nguồn khái niệm: Lewis et al., “Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks” (2020).',
    ],
    misconceptions: [
      '“RAG không phải fine-tuning” — RAG thay đổi context tại runtime; fine-tuning thay đổi trọng số model.',
      '“Có vector database là có RAG tốt” — sai; chunking, metadata, hybrid retrieval, rerank và citation đều quan trọng.',
      '“RAG loại bỏ hoàn toàn hallucination” — sai; vẫn cần quality gate và cách từ chối rõ ràng.',
    ],
    nextQuestions: ['Chunk nên cắt theo cấu trúc tài liệu hay token?', 'Khi nào cần hybrid search và reranker?', 'Đo groundedness ra sao?'],
  },
  {
    id: 'agent',
    topic: 'AI',
    title: 'AI Agent là gì?',
    navLabel: 'Agent',
    question: 'Agent khác một AI application thông thường như thế nào?',
    summary: 'Agent là một kiểu AI system có khả năng tự điều phối nhiều bước để hoàn thành mục tiêu. Model chọn bước tiếp theo; runtime thực thi hành động; tools mở quyền ra thế giới bên ngoài; state/memory giữ tiến độ; control loop đưa kết quả quay lại cho model cho đến khi đạt điều kiện dừng.',
    lastVerified: '2026-07-18',
    status: 'review-needed',
    diagram: `Custom static agent architecture`,
    points: [
      'Agent vẫn là một AI application, nhưng có thêm quyền tự chọn và điều phối nhiều bước thay vì chỉ xử lý một request rồi trả một output.',
      'Model quyết định nên làm gì tiếp theo dựa trên goal, context, tool schemas và observations hiện có.',
      'Runtime mới là phần thực thi hành động thật: gọi API, đọc file, chạy code, gửi email hoặc mở browser theo permission.',
      'State/memory lưu tiến độ và kết quả trung gian để bước sau biết điều gì đã làm; không phải mọi state đều nên trở thành memory lâu dài.',
      'Control loop lặp suy luận → hành động → quan sát → kiểm tra mục tiêu; cần max turns, timeout, approval và điều kiện dừng để tránh chạy vô hạn.',
    ],
    misconceptions: [
      '“Agent là một loại model” — sai. Agent là system bao quanh model bằng runtime, tools, state và control loop.',
      '“AI application nào cũng là agent” — sai. Image classifier hoặc chatbot một lượt vẫn là AI application nhưng không tự điều phối nhiều bước.',
      '“Agent tự động thì không cần human review” — sai. Hành động có side effect cần permission, audit và approval phù hợp.',
    ],
    nextQuestions: ['Agent loop dừng khi nào?', 'State khác memory thế nào?', 'Tool permission nên giới hạn ra sao?'],
  },
  {
    id: 'model-context-protocol',
    topic: 'AI',
    title: 'MCP là gì?',
    navLabel: 'MCP',
    question: 'Làm sao để AI application kết nối tool và dữ liệu bên ngoài theo một protocol có kiểm soát?',
    summary: 'Model Context Protocol (MCP) chuẩn hóa cách host/AI application kết nối MCP server. Server có thể cung cấp tools, resources và prompts; runtime vẫn quyết định permission, approval, execution và audit.',
    lastVerified: '2026-08-09',
    status: 'review-needed',
    diagram: `flowchart LR
  H[Host / AI application] --> C[MCP client]
  C <--> S[MCP server]
  S --> T[Tools]
  S --> R[Resources]
  S --> P[Prompts]
  H --> G[Policy: allowlist, least privilege, approval, audit]`,
    points: [
      'MCP là protocol, không phải model, agent, tool hay RAG. Host/client/server là các vai trò chính.',
      'Tools là capability có thể gọi; resources là dữ liệu/context; prompts là template/workflow do server cung cấp.',
      'Kết nối server không có nghĩa cấp toàn quyền: allowlist server/tool, xác thực nguồn, cấp quyền tối thiểu và approval cho side effect.',
      'Giới hạn dữ liệu gửi vào model, ghi audit log và coi tool output là dữ liệu không tin cậy để giảm prompt injection.',
    ],
    misconceptions: [
      '“MCP server an toàn mặc định” — sai; server và tool vẫn cần trust boundary, auth và policy.',
      '“MCP thay agent” — sai; agent/runtime mới điều phối goal, state, tool call và verification.',
      '“Tool output luôn đáng tin” — sai; output có thể chứa dữ liệu hoặc chỉ dẫn độc hại.',
    ],
    nextQuestions: ['Tool khác resource và prompt thế nào?', 'Approval nên đặt ở đâu?', 'Làm sao giảm prompt injection từ tool output?'],
  },
  {
    id: 'hermes-vs-copilot-chatgpt',
    topic: 'AI',
    title: 'Hermes Agent hoạt động như thế nào?',
    navLabel: 'Hermes Agent',
    question: 'Hermes là model, chatbot, hay agent runtime? Profile, reasoning effort và Fast Mode dùng khi nào?',
    summary: 'Hermes không phải một model riêng. Hermes là agent runtime: nhận yêu cầu từ CLI/Desktop/Gateway, nạp profile/cấu hình phù hợp, gọi model/provider, dùng tool thật, ghi nhớ memory/skills/session và kiểm chứng bằng output thật. ChatGPT/Copilot chủ yếu là sản phẩm trợ lý; Hermes là runtime mở, đa provider, có tool loop, state và profile isolation. Profile là một “nhân cách + cấu hình + kho nhớ + skill/tool riêng” để tách manager, developer, reviewer hoặc travel agent thành các agent độc lập.',
    lastVerified: '2026-07-26',
    status: 'review-needed',
    diagram: `Hermes architecture is rendered by HermesArchitectureTraffic component`,
    points: [
      'Hermes = agent runtime, không phải model. Model chỉ là “não dự đoán”; Hermes là hệ điều hành nhỏ bao quanh model để đọc context, gọi tool, chạy workflow, ghi nhớ và verify.',
      'Khác với ChatGPT/Copilot thường đóng gói thành một sản phẩm trợ lý, Hermes cho bạn cấu hình runtime mở: chọn provider/model, bật tool loop, gắn memory/skills/cron và tách profile theo vai trò.',
      'Sau đó Hermes gọi provider/model được cấu hình: OpenRouter, Anthropic, OpenAI, Gemini, Copilot OAuth, local model server hoặc provider custom.',
      'Tool layer là “tay chân”: terminal, browser, file, GitHub, Google Sheets, cron, MCP, image, TTS... Model đề xuất tool call, Hermes thực thi thật rồi đưa output quay lại vòng suy luận.',
      'Profile là gói cấu hình/data home tại ~/.hermes/profiles/<name>/: config, SOUL.md, sessions, memories, skills/plugins có thể tách biệt. Runtime nạp profile khi bắt đầu phiên; mỗi profile chỉ hoạt động như agent instance khi được chạy.',
      'Trong setup team có cấu hình orchestration, default profile có thể làm router; manager profile điều phối specialist profiles; specialist chỉ review/coding theo scope để tránh một agent ôm quá nhiều vai trò.',
      'Runtime chọn profile để xác định vùng config, session, memory và skills riêng. SOUL.md được nạp khi có; skill chỉ được preload hoặc tải khi phù hợp, không phải mọi skill đều được đưa vào context cùng lúc.',
    ],
    misconceptions: [
      '“Hermes là một LLM mới” — sai. Hermes dùng model/provider phía sau; anh có thể đổi model mà workflow vẫn giữ nguyên.',
      '“Profile chỉ là tên gọi khác của prompt” — thiếu. Profile có thể có SOUL.md, config, sessions, memory, skills/plugins riêng nên nó giống một agent runtime con được cô lập hơn là chỉ một system prompt.',
      '“Có tool là thành agent” — chưa đủ. Agent cần vòng lặp mục tiêu → hành động/tool → quan sát output → sửa hướng → verify.',
      '“Một profile giỏi nhất nên làm hết” — dễ loạn scope. Project software nên có manager + developer + QA + UI/UX + content reviewer.',
    ],
    nextQuestions: ['Profile khác skill ở đâu?', 'Khi nào cần tạo profile mới?', 'Hermes gọi tool và verify output như thế nào?'],
  },
  {
    id: 'master-kubernetes',
    topic: 'Kubernetes',
    title: 'Kubernetes cốt lõi',
    navLabel: 'Kubernetes cốt lõi',
    question: 'Làm sao học để master được Kubernetes thay vì chỉ nhớ YAML?',
    summary: 'Muốn master Kubernetes, đừng bắt đầu bằng việc học thuộc YAML. Hãy nắm 3 luồng: bạn khai báo trạng thái mong muốn vào API Server; control plane liên tục reconcile để biến mong muốn thành thực tế; data plane đưa traffic qua Ingress, Service, Pod và Node. Khi hiểu object nào chịu trách nhiệm cho đoạn nào của luồng này, bạn sẽ biết phải deploy, scale, debug và rollback ở đúng layer.',
    lastVerified: '2026-07-18',
    status: 'review-needed',
    diagram: `Custom animated Kubernetes architecture lab`,
    points: [
      'Master Kubernetes = hiểu trạng thái mong muốn, reconciliation loop và traffic path; YAML chỉ là cách ghi intent cho API Server.',
      'Cluster giống một thành phố/cảng container: control plane là tòa thị chính, worker node là khu nhà xưởng, pod là căn hộ chạy app, service là số điện thoại ổn định, ingress/gateway là cổng vào.',
      'Luồng control: kubectl/CI gửi manifest → API Server validate/lưu trạng thái → Scheduler chọn node → Controller giữ đủ replica → Kubelet bảo container runtime chạy Pod.',
      'Luồng traffic: Người dùng → Ingress/Gateway → Service → Pod endpoint → container trong Node → response trả ngược ra ngoài.',
      'Cách học thực chiến: luôn hỏi symptom nằm ở layer nào: manifest/API, scheduling, image/runtime, networking/service discovery, storage, rollout hay app health.',
      'Khi debug, đi từ ngoài vào trong: DNS/Ingress → Service endpoints → Pod status/logs/events → Node/kubelet/runtime → object owner như Deployment/ReplicaSet.',
    ],
    misconceptions: [
      '“Master K8s là nhớ hết YAML” — sai. Quan trọng hơn là hiểu object nào tạo ra trạng thái nào và ai reconcile nó.',
      '“Pod là container” — chưa chính xác. Pod là đơn vị deploy nhỏ nhất, chứa một hoặc nhiều container cùng một boundary runtime.',
      '“Service chạy app” — sai. Service chỉ định tuyến tới Pod endpoints; app thật chạy trong container bên trong Pod.',
      '“Control plane xử lý request user trực tiếp” — sai. Traffic người dùng thường đi qua data plane: Ingress/Gateway, Service, Pod và Node.',
      '“kubectl sửa trực tiếp node” — sai. kubectl gửi intent tới API Server; controller/scheduler/kubelet thực hiện phần còn lại.',
    ],
    nextQuestions: ['Desired state là gì?', 'Service endpoint debug ra sao?', 'Khi nào lỗi nằm ở Scheduler, Kubelet hay app?'],
  },
  {
    id: 'multi-container-trong-pod',
    topic: 'Kubernetes',
    title: 'Multi-container trong một Pod',
    navLabel: 'Multi-container Pod',
    question: 'Trong một Pod có mấy kiểu multi-container, dùng khi nào, lợi và hại là gì?',
    summary: 'Multi-container Pod dùng khi các container phải sống rất gần nhau trong cùng một ranh giới Pod: chung network namespace, chung Pod IP/localhost, có thể chia sẻ volume đã khai báo, và được lên lịch và co giãn theo cùng ranh giới Pod. Các pattern chính gồm sidecar, ambassador/proxy, adapter, init container và helper/log shipper. Dùng nó cho coupling chặt, không dùng để gom nhiều app độc lập vào cùng một Pod.',
    lastVerified: '2026-07-18',
    status: 'review-needed',
    diagram: `Custom animated multi-container Pod pattern lab`,
    points: [
      'Chung ranh giới Pod: container trong cùng Pod chia sẻ network namespace, Pod IP và localhost; dữ liệu chỉ chia sẻ khi có volume dùng chung được mount rõ ràng.',
      'Vòng đời Pod: các container được lên lịch và co giãn cùng Pod, nhưng container bị lỗi có thể được kubelet khởi động lại riêng theo khởi động lạiPolicy; khi Pod bị thay thế thì toàn bộ container được tạo lại.',
      'Sidecar: chạy song song với container chính để bổ trợ như proxy service mesh, trình theo dõi cấu hình, helper TLS hoặc forwarder log.',
      'Ambassador/proxy: app gọi localhost, ambassador chuyển tiếp tới service bên ngoài như database, cache, API hoặc endpoint legacy.',
      'Adapter: biến đổi đầu ra của app chính sang format chuẩn, ví dụ log custom → log có cấu trúc hoặc metric app → metric thân thiện với Prometheus.',
      'Helper/log shipper: đọc file/log từ volume dùng chung rồi đẩy ra Fluent Bit, Loki, Elasticsearch, S3 hoặc collector khác; thường là một dạng sidecar cụ thể.',
      'Trường hợp dùng tốt: sidecar service mesh, shipper log, adapter metric, init để render config/template, init chờ dependency, proxy local cho dependency phức tạp.',
      'Ưu điểm: giao tiếp localhost nhanh, chia sẻ volume đơn giản, deploy cùng nhau, tách concern phụ khỏi image chính của app.',
      'Nhược điểm: scale cùng Pod, ngữ nghĩa khởi động lại phức tạp hơn, phân bổ resource khó hơn, debug nhiều container phức tạp hơn, coupling cao và dễ nhét sai nhiều app độc lập vào một Pod.',
    ],
    misconceptions: [
      '“Chung Pod nghĩa là chung filesystem mặc định” — sai. Filesystem container tách riêng; chỉ volume dùng chung mới chia sẻ dữ liệu.',
      '“Container trong Pod gọi nhau qua Service” — thường không cần; chúng dùng chung network namespace nên gọi nhau qua localhost và port nội bộ.',
      '“Init container chạy song song với main” — cần phân biệt. Init container thường chạy xong rồi thoát trước khi app khởi động; native sidecar nằm trong initContainers nhưng dùng khởi động lạiPolicy: Always và tiếp tục chạy cùng app.',
      '“Sidecar luôn tốt hơn tách service riêng” — sai. Nếu cần scale, release hoặc ownerđẩy đi độc lập thì nên tách Pod/service riêng.',
      '“Multi-container Pod phù hợp để gom frontend + backend + database” — sai với production; đó là nhiều workload độc lập, nên tách deployment.',
    ],
    nextQuestions: ['Sidecar native trong Kubernetes mới khác gì?', 'Resource limit chia cho từng container ra sao?', 'Khi nào nên tách thành service riêng?'],
  },
  {
    id: 'k8s-workload-configuration',
    topic: 'Kubernetes',
    title: 'Configuration: resource, scheduling và shutdown',
    navLabel: 'Configuration',
    question: 'Tại sao cần resources/limits, taint/toleration, node affinity và termination grace; chọn value bằng cách nào?',
    summary: 'Configuration của workload biến dữ liệu vận hành thành quyết định cho scheduler và kubelet: request giúp đặt Pod vào node đủ sức, limit tạo safety boundary, taint/affinity kiểm soát vị trí, còn termination grace cho app thời gian dừng an toàn. Không có một bộ số dùng chung; phải đo load, p95/p99, failure budget và kiểm chứng bằng canary.',
    lastVerified: '2026-07-18',
    status: 'review-needed',
    diagram: `Custom Kubernetes configuration decision guide`,
    points: [
      'CPU request phục vụ scheduling và chia CPU khi tranh chấp; memory request phục vụ scheduling/eviction. Memory vượt limit gây OOMKilled, còn CPU limit có thể gây throttling.',
      'Request nên xuất phát từ usage ở traffic mục tiêu; memory cần quan sát working set, startup peak, heap sau GC và leak trend thay vì snapshot ngắn.',
      'Taint tác động theo effect: NoSchedule chặn scheduling mới, PreferNoSchedule là ưu tiên mềm, NoExecute còn có thể evict Pod đang chạy. Toleration chỉ cấp phép; thường kết hợp node affinity để chọn đúng pool.',
      'Node affinity required là constraint cứng; preferred là tối ưu mềm. Weight 1–100 là điểm tương đối của scheduler, không phải phần trăm traffic.',
      'terminationGracePeriodSeconds phải đủ cho preStop, rút traffic, request đang chạy, flush state và graceful shutdown trước SIGKILL.',
      'Quy trình chọn value: instrument → load test → lấy p95/p99/peak → thêm headroom có lý do → canary → điều chỉnh theo throttling, OOM, Pending, eviction và rollout time.',
    ],
    misconceptions: [
      '“Requests và limits nên bằng nhau cho mọi service” — sai. Chính sách phụ thuộc workload, QoS, burst và mục tiêu latency.',
      '“CPU limit luôn bảo vệ app” — chưa đủ. Limit thấp có thể throttle và làm p99 latency xấu hơn dù node còn CPU.',
      '“Có toleration là Pod chắc chắn vào tainted node” — sai. Cần affinity/nodeSelector nếu muốn thu hút hoặc ép Pod vào pool đó.',
      '“preStop sleep chính là graceful shutdown” — sai. App vẫn phải bắt SIGTERM, ngừng nhận việc mới và tự flush/close đúng cách.',
    ],
    nextQuestions: ['Vertical Pod Autoscaler lấy recommendation thế nào?', 'QoS class ảnh hưởng eviction ra sao?', 'Topology spread khác node affinity ở đâu?'],
  },
  {
    id: 'k8s-observability-probes',
    topic: 'Kubernetes',
    title: 'Observability: Readiness và Liveness Probe',
    navLabel: 'Observability',
    question: 'Readiness/Liveness nhằm mục đích gì và chọn period, timeout, threshold dựa trên số liệu nào?',
    summary: 'Readiness trả lời Pod có nên nhận traffic mới; Liveness trả lời process có mắc kẹt và cần restart hay không. Startup probe bảo vệ cold start chậm. Giá trị probe phải bám p99 startup/probe latency, transient failure duration, SLO/RTO và failure injection — không copy một mẫu YAML rồi coi là xong observability.',
    lastVerified: '2026-07-18',
    status: 'review-needed',
    diagram: `Custom Kubernetes probe traffic and restart guide`,
    points: [
      'Readiness fail đánh dấu endpoint không Ready và loại Pod khỏi backend được route nhưng không restart container; dùng nó để bảo vệ traffic trong startup, overload hoặc dependency thiết yếu bị mất.',
      'Liveness fail liên tiếp khiến kubelet restart container; endpoint phải kiểm tra khả năng tự hồi phục nội tại, không phụ thuộc database/API bên ngoài để tránh restart storm.',
      'Startup probe trì hoãn readiness/liveness đến khi app khởi động xong; startup budget gần bằng periodSeconds × failureThreshold.',
      'Detection window xấp xỉ failureThreshold × periodSeconds; timeout phải lớn hơn p99 probe latency cộng margin nhỏ nhưng đủ ngắn để không treo worker probe.',
      'Chọn value từ histogram latency, p99 cold start, thời gian lỗi transient và recovery objective; kiểm chứng bằng dependency outage, deadlock, CPU pressure, kill process và rollout.',
      'Probe là health management, không thay thế observability đầy đủ. Vẫn cần metrics, logs, traces, Kubernetes Events, endpoint state và restart count.',
    ],
    misconceptions: [
      '“Readiness fail sẽ restart Pod” — sai. Nó chủ yếu dừng route traffic vào Pod.',
      '“Liveness nên kiểm tra database” — nguy hiểm. Database outage có thể làm toàn bộ app restart đồng loạt mà không chữa được nguyên nhân.',
      '“initialDelaySeconds càng lớn càng an toàn” — dễ che startup regression. Startup probe mô tả startup budget rõ hơn.',
      '“Probe trả HTTP 200 là đã có observability” — sai. Probe không giải thích nguyên nhân, xu hướng và impact như metrics/logs/traces.',
    ],
    nextQuestions: ['Startup probe khác initialDelaySeconds thế nào?', 'Readiness gate dùng khi nào?', 'Probe failure xuất hiện ở Events và metrics nào?'],
  },
  {
    id: 'docker-build-trong-vs-ngoai',
    topic: 'Docker',
    title: 'Docker Core: tại sao cần Docker?',
    navLabel: 'Core',
    question: 'Docker giải quyết vấn đề gì, core runtime gồm những component nào, và nên build artifact ở đâu?',
    summary: 'Docker đóng gói application, userspace dependencies và filesystem thành image có version để chạy nhất quán qua dev, CI và production. Linux container chia sẻ kernel Linux host; trên macOS/Windows Docker Desktop cung cấp Linux VM và container chia sẻ kernel của VM đó. Khi đóng gói app, mặc định nên build bằng multi-stage; build ngoài rồi COPY phù hợp khi CI đã kiểm soát chặt toolchain và artifact.',
    lastVerified: '2026-07-16',
    status: 'draft',
    diagram: `flowchart TD
Source["Source code"] --> Choice{"Build ở đâu?"}
Choice -- "Trong Docker" --> DockerBuild["Dockerfile builder stage: install deps, compile, test"]
DockerBuild --> CopyA["COPY artifact sang runtime stage"]
Choice -- "Ngoài Docker" --> CI["CI hoặc host: install deps, compile, test"]
CI --> Artifact["Artifact đã build: dist, binary, jar"]
Artifact --> CopyB["Dockerfile runtime: COPY artifact vào đúng path"]
CopyA --> Image["Runtime image"]
CopyB --> Image`,
    points: [
      'Build trong Docker: Dockerfile chứa luôn môi trường build, dependency và bước compile. Thực tế nên dùng multi-stage: builder stage có compiler/source/deps, runtime stage chỉ giữ artifact cần chạy.',
      'Lợi điểm build trong Docker: ít lệ thuộc máy host, dễ reproduce, dễ pin toolchain bằng base image, phù hợp app cần native dependency hoặc nhiều bước build phức tạp.',
      'Khuyết điểm build trong Docker: build context lớn có thể chậm, cache cần thiết kế kỹ, debug build trong container đôi khi khó hơn, CI có thể tốn tài nguyên hơn.',
      'Build ngoài Docker: CI/host build artifact trước, chạy test trước, sau đó Dockerfile runtime chỉ COPY artifact vào đúng path như /app/dist, /usr/share/nginx/html hoặc /app/app.jar.',
      'Các path artifact chỉ là convention: path thật phụ thuộc WORKDIR, runtime image, web server và command chạy app.',
      'Lợi điểm build ngoài Docker: Dockerfile rất mỏng, image build nhanh, pipeline tách rõ test/build/package, artifact có thể được ký/lưu/reuse trước khi đóng image.',
      'Khuyết điểm build ngoài Docker: dễ lệ thuộc môi trường CI/host, cần đảm bảo artifact tương thích runtime image, có nguy cơ copy nhầm artifact cũ nếu pipeline không clean.',
      'Cache chỉ giúp tăng tốc build, không tự tạo reproducibility; cache sai hoặc stale có thể che dependency drift nếu pipeline thiếu lockfile và clean strategy.',
      'Rule thực dụng: mặc định ưu tiên multi-stage build; chỉ copy artifact từ CI khi pipeline đã kiểm soát toolchain, dependency lock, target OS/architecture, CPU instruction set, runtime assets và tính toàn vẹn artifact.',
    ],
    misconceptions: [
      '“Dockerfile luôn phải build source từ đầu” — không đúng. Dockerfile có thể chỉ đóng gói artifact đã build sẵn nếu pipeline kiểm soát tốt.',
      '“Build ngoài Docker luôn nhanh và tốt hơn” — không hẳn; CI dùng image build được pin version, lockfile và cache đúng vẫn có thể nhanh và tái lập tốt, còn CI lỏng lẻo thì dễ sinh lỗi khó truy vết.',
      '“Copy artifact vào image là kém chuyên nghiệp” — sai. Đây là pattern bình thường khi artifact đã được build/test/ký ở bước CI trước đó.',
      '“Build trong Docker thì không cần CI test riêng” — sai. Vẫn cần test, scan, verify; chỉ khác nơi chạy bước build.',
      '“Go/native binary build ở đâu cũng chạy được” — sai. Cần khớp OS/architecture, CPU instruction set, glibc vs musl, CGO, shared libraries và runtime assets như CA certificates/timezone data nếu app cần.',
      '“Frontend dist dùng được cho mọi môi trường” — chưa chắc. Nhiều biến môi trường/API URL được nhúng ở build time; secret tuyệt đối không đưa vào bundle hoặc ARG/ENV của image.',
    ],
    nextQuestions: ['Khi nào dùng multi-stage?', 'Artifact path nên đặt ở đâu?', 'BuildKit cache giúp gì cho CI?'],
  },
  {
    id: 'docker-multistage-build',
    topic: 'Docker',
    title: 'Docker multi-stage build là gì?',
    navLabel: 'Multi-stages',
    question: 'Làm sao build image nhỏ, sạch, không mang tool build vào production?',
    summary: 'Multi-stage build tách quá trình build và runtime thành nhiều stage. Stage đầu có compiler/dependency để build artifact; stage cuối chỉ copy thứ cần chạy. Kết quả là image production nhỏ hơn, ít attack surface hơn và dễ cache hơn.',
    lastVerified: '2026-07-16',
    status: 'draft',
    diagram: `flowchart LR
Source["Source code"] --> Builder["Builder stage: cài deps, compile, test"]
Builder --> Artifact["Artifact: dist, binary, jar"]
Artifact --> Runtime["Runtime stage: image mỏng chỉ để chạy"]
Runtime --> Image["Production image nhỏ hơn"]`,
    points: [
      'Ví dụ Node: stage builder chạy npm install/build; stage runtime chỉ copy dist/package cần chạy.',
      'Ví dụ Go: builder có Go compiler; runtime có binary tĩnh, thậm chí dùng distroless/scratch khi phù hợp.',
      'Lợi ích: image nhỏ, ít CVE hơn, không lộ source/build cache/dev dependency vào runtime.',
      'Pattern quan trọng: đặt lệnh copy lockfile và cài dependency trước copy source để tận dụng cache.',
      'Không phải cứ multi-stage là an toàn tuyệt đối; vẫn cần pin base image, scan image và chạy non-root nếu có thể.',
    ],
    misconceptions: [
      '“Multi-stage chỉ để giảm size” — thiếu. Nó còn tách trách nhiệm build/runtime và giảm attack surface.',
      '“Stage trước tự động biến mất hoàn toàn” — artifact chỉ sang stage cuối nếu bạn COPY; nhưng cache build vẫn có thể tồn tại ở builder/cache layer trên máy build.',
      '“Một Dockerfile nhiều stage là phức tạp hơn nên không cần” — với app production, nó thường sạch và dễ maintain hơn.',
    ],
    nextQuestions: ['Docker layer cache hoạt động thế nào?', 'Distroless image là gì?', 'COPY --from dùng ra sao?'],
  },
  {
    id: 'docker-build-cache',
    topic: 'Docker',
    title: 'Docker build cache hoạt động thế nào?',
    navLabel: 'Build Cache',
    question: 'Tại sao đổi một dòng code đôi khi làm Docker build lại rất lâu?',
    summary: 'Docker build cache dựa trên từng instruction/layer. Nếu layer trước thay đổi thì các layer sau thường phải build lại. Muốn build nhanh phải sắp xếp Dockerfile từ thứ ít đổi đến thứ hay đổi, dùng .dockerignore và tận dụng BuildKit cache mount khi cần.',
    lastVerified: '2026-07-16',
    status: 'draft',
    diagram: `flowchart TD
Base["FROM base image"] --> Deps["COPY lockfile + install deps"]
Deps --> Source["COPY source code"]
Source --> Build["RUN build"]
Build --> Cache{"Layer trước có đổi không?"}
Cache -- "Không" --> Reuse["Reuse cache"]
Cache -- "Có" --> Rebuild["Build lại layer sau"]`,
    points: [
      'Docker cache theo từng instruction. COPY package-lock.json rồi npm install trước COPY src giúp dependency layer không rebuild khi chỉ đổi code.',
      '.dockerignore rất quan trọng: đừng gửi node_modules, .git, dist, log, secret file vào build context.',
      'BuildKit hỗ trợ cache mount như --mount=type=cache,target=/root/.npm để tăng tốc tải package mà không nhét cache vào final image.',
      'Cache tốt không chỉ nhanh hơn; nó còn làm CI ổn định hơn nếu lockfile/base image được kiểm soát.',
      'Khi cần clean build để debug, dùng --no-cache; nhưng không nên mặc định dùng --no-cache trong CI nếu không có lý do.',
    ],
    misconceptions: [
      '“Docker cache là cache của app runtime” — sai. Đây là cache khi build image, khác với volume/cache runtime.',
      '“Chỉ cần đổi thứ tự lệnh tùy ý” — sai. Thứ ít đổi nên lên trước, thứ hay đổi nên xuống sau.',
      '“COPY . . luôn tiện nhất” — tiện nhưng dễ phá cache và đưa file thừa vào image.',
    ],
    nextQuestions: ['BuildKit cache mount là gì?', '.dockerignore nên có gì?', 'Layer image là gì?'],
  },
  {
    id: 'docker-volume',
    topic: 'Docker',
    title: 'Docker volume dùng để làm gì?',
    navLabel: 'Volume',
    question: 'Data trong container có mất không, volume khác bind mount thế nào?',
    summary: 'Container nên được xem là tạm thời; volume là nơi lưu dữ liệu bền vững hoặc chia sẻ dữ liệu giữa container. Named volume do Docker quản lý; bind mount trỏ trực tiếp vào thư mục host, tiện cho dev nhưng cần cẩn thận quyền và path.',
    lastVerified: '2026-07-16',
    status: 'draft',
    diagram: `flowchart LR
Container["Container: có thể bị xóa và tạo lại"] --> Volume["Named volume: Docker quản lý dữ liệu"]
Host["Host folder"] --> Bind["Bind mount: map thư mục host"]
Volume --> Data["Data sống ngoài lifecycle container"]
Bind --> Dev["Dev workflow: sửa file trên host, container thấy ngay"]`,
    points: [
      'Nếu ghi dữ liệu quan trọng vào filesystem bên trong container mà không mount volume, khi xóa container dữ liệu có thể mất.',
      'Named volume phù hợp cho data service local như database dev, cache, uploaded files trong môi trường học/lab.',
      'Bind mount phù hợp cho development: mount source code từ host vào container để hot reload.',
      'Volume không thay thế backup. Database production vẫn cần backup/snapshot/restore plan rõ ràng.',
      'Cần chú ý quyền file, UID/GID và path khác nhau giữa macOS/Linux/CI.',
    ],
    misconceptions: [
      '“Image lưu luôn data runtime” — sai. Image là template; data runtime nên nằm ở volume/object storage/database phù hợp.',
      '“Volume là backup” — sai. Volume giúp persist, nhưng không tự tạo backup an toàn.',
      '“Bind mount và named volume giống nhau hoàn toàn” — không. Bind phụ thuộc path host, named volume do Docker quản lý.',
    ],
    nextQuestions: ['Named volume vs bind mount?', 'Docker volume backup thế nào?', 'Vì sao container nên stateless?'],
  },
  {
    id: 'docker-compose',
    topic: 'Docker',
    title: 'Docker Compose giải quyết vấn đề gì?',
    navLabel: 'Docker Compose',
    question: 'Khi nào nên dùng compose thay vì gõ docker run dài ngoằng?',
    summary: 'Docker Compose mô tả nhiều container của một app bằng file YAML: service, image/build, port, env, volume, network, dependency. Nó rất hợp local dev, demo, lab, môi trường nhỏ và CI cần dựng database tạm thời/on-demand để test cô lập; production lớn thường chuyển sang orchestrator như Kubernetes/ECS/Nomad tùy nhu cầu.',
    lastVerified: '2026-07-16',
    status: 'draft',
    diagram: `flowchart TD
Compose["compose.yaml"] --> Web["service web"]
Compose --> API["service api"]
Compose --> DB["service database"]
Compose --> Network["default network"]
Compose --> Volumes["named volumes"]
Web --> API
API --> DB`,
    points: [
      'Compose gom cấu hình docker run thành file: ports, environment, volumes, networks, healthcheck, build context.',
      'Các service trong cùng Compose project thường tự thấy nhau bằng DNS theo tên service, ví dụ api gọi db:5432.',
      'Dùng compose up để chạy stack, compose down để dừng/xóa network container; volume chỉ xóa nếu thêm -v.',
      'depends_on chỉ kiểm soát thứ tự start cơ bản; muốn đợi service sẵn sàng nên dùng healthcheck hoặc retry logic trong app.',
      'Compose rất tốt cho dev/test/demo, nhất là khi cần chạy database tạm thời hoặc on-demand ngay trong CI để test integration rồi xóa sau job.',
      'Trường hợp CI thực tế: mỗi workflow có thể spin up Postgres/MySQL/Redis bằng Compose trên network riêng, chạy test, sau đó compose down -v để cô lập dữ liệu và hạn chế impact tới môi trường dev/staging/prod.',
      'Không nên nhầm Compose là Kubernetes đầy đủ; nó thiếu nhiều cơ chế scheduling, rollout và self-healing của orchestrator production.',
    ],
    misconceptions: [
      '“Compose là Kubernetes mini” — không hẳn. Compose đơn giản hơn, ít cơ chế self-healing/scheduling/rollout.',
      '“depends_on nghĩa là database đã sẵn sàng nhận query” — sai; thường chỉ là container đã start.',
      '“Compose chỉ chạy được một container” — sai; mục tiêu chính là mô tả nhiều service cùng nhau.',
    ],
    nextQuestions: ['depends_on khác healthcheck?', 'Compose network hoạt động thế nào?', 'Khi nào chuyển từ Compose sang Kubernetes?'],
  },
  {
    id: 'docker-network',
    topic: 'Docker',
    title: 'Docker network hoạt động thế nào?',
    navLabel: 'Network',
    question: 'Container gọi nhau bằng gì, port mapping khác container network ra sao?',
    summary: 'Docker network quyết định container thấy nhau như thế nào. Bridge network mặc định cho container giao tiếp nội bộ; Compose tạo network riêng và DNS theo tên service. Port mapping như -p 8080:80 chỉ mở cổng từ host vào container, không phải cách container nội bộ bắt buộc phải gọi nhau.',
    lastVerified: '2026-07-16',
    status: 'draft',
    diagram: `flowchart LR
Host["Host machine"] -- "-p 8080:80" --> Web["container web:80"]
Web -- "http://api:3000" --> API["container api"]
API -- "postgres://db:5432" --> DB["container db"]
Network["Docker bridge/compose network"] --> Web
Network --> API
Network --> DB`,
    points: [
      'Port mapping là đường từ host vào container, ví dụ localhost:8080 trên máy bạn vào web:80 trong container.',
      'Container cùng user-defined bridge network có thể gọi nhau bằng container name hoặc service name trong Compose.',
      'Không cần publish port DB ra host nếu chỉ API container cần gọi DB nội bộ.',
      'localhost bên trong container là chính container đó, không phải host và không phải container khác.',
      'Muốn container gọi host trên Docker Desktop thường dùng host.docker.internal; trên Linux cần cấu hình khác tùy setup.',
    ],
    misconceptions: [
      '“Container A gọi localhost là tới container B” — sai. localhost là chính container A.',
      '“Muốn container nói chuyện với nhau phải expose port ra host” — sai. Cùng network thì gọi port container nội bộ được.',
      '“Port EXPOSE tự mở cổng ra ngoài” — sai. EXPOSE chủ yếu là metadata; cần -p/ports để publish ra host.',
    ],
    nextQuestions: ['Bridge network là gì?', 'EXPOSE khác ports?', 'host.docker.internal dùng khi nào?'],
  },
  ...redisChapters.map((chapter): Article => ({
    id: `redis-${chapter.id}`,
    topic: 'Redis',
    title: chapter.title,
    navLabel: chapter.navLabel,
    question: chapter.question,
    summary: chapter.summary,
    lastVerified: '2026-07-19',
    status: 'review-needed',
    diagram: 'Interactive RedisLearningJourney component',
    points: chapter.keyPoints,
    misconceptions: chapter.misconceptions,
    nextQuestions: chapter.questions,
  })),
  ...kafkaChapters.map((chapter): Article => ({
    id: `kafka-${chapter.id}`,
    topic: 'Kafka',
    title: chapter.title,
    navLabel: chapter.navLabel,
    question: chapter.question,
    summary: chapter.summary,
    lastVerified: '2026-08-02',
    status: 'draft',
    diagram: 'Interactive KafkaLearningJourney component',
    points: chapter.keyPoints,
    misconceptions: chapter.misconceptions,
    nextQuestions: [chapter.checkpoint],
  })),
];

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function viewFromHash(): View {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [kind, rawId] = hash.split('/');
  const articleAliases: Record<string, string> = { 'master-hermes-agent': 'hermes-vs-copilot-chatgpt' };
  const id = articleAliases[rawId] ?? rawId;
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
  const [themeRevision, setThemeRevision] = React.useState(0);

  React.useEffect(() => {
    const rerender = () => setThemeRevision((value) => value + 1);
    window.addEventListener('knowledge-theme-change', rerender);
    return () => window.removeEventListener('knowledge-theme-change', rerender);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const theme = document.documentElement.dataset.theme === 'light' ? 'default' : 'dark';
    mermaid.initialize({ startOnLoad: false, theme, securityLevel: 'strict' });
    mermaid.render(`diagram-${id}-${themeRevision}`, chart).then(({ svg }) => {
      if (!cancelled && ref.current) ref.current.innerHTML = svg;
    }).catch((error: unknown) => {
      console.error('Mermaid render failed', id, error);
      if (!cancelled && ref.current) ref.current.textContent = 'Sơ đồ đang được chỉnh lại để hiển thị đúng.';
    });
    return () => { cancelled = true; };
  }, [chart, id, themeRevision]);
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

function KubernetesCoreArchitectureLab() {
  const components = [
    ['API Server', 'Nhận lệnh từ kubectl, CI/CD và controller; validate request rồi mở API Kubernetes cho toàn cluster.'],
    ['etcd', 'Lưu trạng thái mong muốn và trạng thái quan trọng; đây là bộ nhớ/sổ cái của cluster.'],
    ['Scheduler', 'Tìm Pod chưa có Node và chọn Worker Node phù hợp nhất để đặt Pod.'],
    ['Controller Manager', 'So sánh trạng thái mong muốn với actual state rồi tạo/sửa resource để kéo cluster về đúng mong muốn.'],
    ['Kubelet', 'Chạy trên mỗi Worker Node; yêu cầu container runtime chạy Pod và báo status về control plane.'],
    ['Container Runtime', 'Pull image và chạy container bên trong Pod.'],
    ['Pod', 'Đơn vị deploy nhỏ nhất; bọc một hoặc nhiều container phía sau cùng một Pod IP.'],
    ['Service', 'Địa chỉ ảo ổn định để route traffic tới endpoint đủ điều kiện, thường là Pod endpoint ở trạng thái Ready.'],
    ['Ingress / Gateway', 'Cổng vào cho HTTP hoặc traffic L7 từ bên ngoài trước khi tới Service.'],
  ];

  return (
    <div className="k8sCoreLab" aria-label="Sơ đồ động kiến trúc Kubernetes cốt lõi">
      <div className="trafficLegend">
        <span className="badge">Kubernetes cốt lõi</span>
        <strong>Vòng reconcile biến trạng thái mong muốn thành Pod đang chạy; luồng dữ liệu đưa traffic người dùng đi qua cluster.</strong>
      </div>
      <div className="k8sMasterIdea">
        <strong>Cách master Kubernetes</strong>
        <span>Hãy đọc mọi vấn đề qua hai luồng: luồng điều khiển tạo trạng thái và luồng dữ liệu phục vụ traffic.</span>
      </div>
      <div className="k8sCoreGrid">
        <section className="k8sControlPanel">
          <span className="zoneLabel">Control plane: tòa thị chính</span>
          <div className="kubectlBox">kubectl / manifest từ CI</div>
          <div className="controlRailDown" aria-hidden="true"><span /><span /><span /></div>
          <div className="controlHub apiHub">API Server</div>
          <div className="controlFanout">
            <div className="controlMini schedulerMini">Scheduler<br/><small>xếp Pod</small></div>
            <div className="controlMini controllerMini">Controller<br/><small>reconcile</small></div>
            <div className="controlMini etcdMini">etcd<br/><small>lưu state</small></div>
          </div>
          <div className="reconcileLoop" aria-hidden="true"><span >desired</span><b>↻</b><span>actual</span></div>
        </section>
        <section className="k8sDataPlanePanel">
          <span className="zoneLabel">Data plane: đường traffic</span>
          <div className="dataPlanePath">
            <div className="trafficNode userTraffic">Người dùng</div>
            <div className="trafficRail" aria-hidden="true"><span /><span /><span /></div>
            <div className="trafficNode entry">Ingress / Gateway</div>
            <div className="trafficRail" aria-hidden="true"><span /><span /><span /></div>
            <div className="trafficNode service">Service</div>
            <div className="fanoutRail" aria-hidden="true"><span /><span /><span /></div>
            <div className="workerCluster">
              <div className="workerNodeCard"><span>Worker Node A</span><div className="kubeletChip">Kubelet</div><div className="runtimeChip">Runtime container</div><div className="pod activePod">Pod: app-1</div></div>
              <div className="workerNodeCard"><span>Worker Node B</span><div className="kubeletChip">Kubelet</div><div className="runtimeChip">Runtime container</div><div className="pod activePod delayed">Pod: app-2</div></div>
            </div>
          </div>
          <div className="responseLane" aria-hidden="true"><span /><span /><span /><span /></div>
          <div className="trafficNode response">Phản hồi trả về người dùng</div>
        </section>
      </div>
      <section className="componentMissionGrid" aria-label="Nhiệm vụ ngắn của từng component Kubernetes">
        {components.map(([name, mission]) => <article key={name}><strong>{name}</strong><span>{mission}</span></article>)}
      </section>
    </div>
  );
}

function MultiContainerPodPatternLab() {
  const patterns = [
    { name: 'Sidecar', usecase: 'Proxy service mesh, trình theo dõi cấu hình, helper TLS hoặc forwarder log cần chạy cạnh app chính. Native sidecar có thể khai báo trong initContainers với khởi động lạiPolicy: Always.', pros: 'Giữ main image tập trung vào logic chính, trong khi vẫn chia sẻ localhost và volume đã khai báo.', cons: 'Scale theo Pod và làm tăng coupling về lifecycle/resource.' },
    { name: 'Ambassador / Proxy', usecase: 'Container chính app gọi localhost, còn proxy xử lý DB/cache/API dịch vụ remote, TLS hoặc retry logic.', pros: 'Ẩn kết nối bên ngoài phức tạp sau một interface local đơn giản.', cons: 'Thêm một hop mạng và có thể che mất lỗi network nếu observability yếu.' },
    { name: 'Adapter', usecase: 'Biến log hoặc metric custom thành format chuẩn của platform.', pros: 'Tránh phải sửa code legacy app chỉ để khớp format platform.', cons: 'Có thể lệch nghĩa so với app và trở thành lớp compatibility ẩn.' },
    { name: 'Init container', usecase: 'Init container thường chuẩn bị config, chờ dependency, chạy setup một lần hoặc tải file trước khi app start.', pros: 'Làm thứ tự startup rõ ràng và tách setup code khỏi app image.', cons: 'Nếu init container thường bị treo hoặc lỗi, app chính sẽ không start.' },
    { name: 'Helper / log shipper', usecase: 'Đọc log file hoặc artifact từ volume dùng chung rồi đẩy tới Fluent Bit, Loki, Elasticsearch, S3 hoặc collector khác.', pros: 'Tách phần vận chuyển log khỏi process của ứng dụng.', cons: 'Cần quản lý volume dùng chung rõ ràng và đặt resource limit cẩn thận.' },
  ];

  return (
    <div className="multiPodLab" aria-label="Sơ đồ động các pattern multi-container trong Pod">
      <div className="podCircleHeader"><span className="badge">Multi-container Pod</span><strong>Tất cả container nằm trong cùng ranh giới Pod, nhưng mỗi pattern có nhiệm vụ khác nhau.</strong></div>
      <section className="sharedPodContract">
        <div><strong>Chung không gian mạng</strong><span>cùng Pod IP và localhost</span></div>
        <div><strong>Chung volume</strong><span>chỉ khi volume được khai báo và mount</span></div>
        <div><strong>Chung ranh giới Pod</strong><span>được lên lịch/co giãn cùng nhau; từng container có thể khởi động lại theo khởi động lạiPolicy</span></div>
        <div><strong>Tiến trình tách riêng</strong><span>mỗi container vẫn có tiến trình và góc nhìn filesystem riêng</span></div>
      </section>
      <div className="patternStageGrid">
        <section className="patternStage parallelStage">
          <span className="zoneLabel">Container chạy song song</span>
          <div className="equalCircleRow"><div className="containerCircle mainCircle"><strong>Container chính</strong><small>logic chính</small></div><div className="localhostBridge" aria-hidden="true"><span /><span /><span /></div><div className="containerCircle sidecarCircle"><strong>Sidecar</strong><small>vòng lặp hỗ trợ</small></div></div>
          <p>Container chính và sidecar là hai vòng tròn ngang hàng vì chúng chạy song song trong cùng một Pod.</p>
        </section>
        <section className="patternStage initStage">
          <span className="zoneLabel">Luồng Init container</span>
          <div className="initAnimationRow"><div className="initOrbit"><div className="initCircle"><strong>Init</strong><small>chuẩn bị</small></div></div><div className="initArrow" aria-hidden="true">→</div><div className="containerCircle mainCircle stable"><strong>Container chính</strong><small>khởi động sau init</small></div></div>
          <p>Vòng Init xoay, hoàn tất rồi mờ đi; container chính ở lại. Hiệu ứng lặp để thể hiện thứ tự khởi động.</p>
        </section>
        <section className="patternStage proxyStage"><span className="zoneLabel">Ambassador / proxy</span><div className="miniFlow"><div>Container chính</div><span>localhost</span><div>Proxy</div><span>dịch vụ remote</span><div>DB/API</div></div></section>
        <section className="patternStage adapterStage"><span className="zoneLabel">Adapter và helper</span><div className="miniFlow"><div>Đầu ra của app</div><span>chuyển đổi</span><div>Adapter</div><span>đẩy đi</span><div>Nền tảng</div></div></section>
      </div>
      <section className="patternUsecaseGrid">
        {patterns.map((pattern) => <article key={pattern.name}><h4>{pattern.name}</h4><p><strong>Trường hợp dùng:</strong> {pattern.usecase}</p><p><strong>Ưu điểm:</strong> {pattern.pros}</p><p><strong>Nhược điểm:</strong> {pattern.cons}</p></article>)}
      </section>
    </div>
  );
}

function HermesHumanBodyEmbed() {
  return <HermesUseCases />;
}

function HermesRuntimeTuningGuide() {
  const effortLevels = [
    {
      level: 'none / minimal',
      use: 'Tra cứu, phân loại, đổi format, tóm tắt ngắn hoặc thao tác gần như xác định.',
      avoid: 'Không phù hợp khi bài toán mơ hồ, nhiều ràng buộc hoặc cần kiểm chứng chéo.',
    },
    {
      level: 'low / medium',
      use: 'Mặc định tốt cho coding thường ngày, phân tích vừa phải và workflow vài bước.',
      avoid: 'Tăng effort nếu agent bỏ sót dependency, edge case hoặc liên tục phải sửa hướng.',
    },
    {
      level: 'high / xhigh / max / ultra',
      use: 'Kiến trúc, debug khó, migration, security review hoặc quyết định có blast radius lớn; mức khả dụng tùy model/provider.',
      avoid: 'Không bật cho mọi request: latency, reasoning token và chi phí có thể tăng đáng kể.',
    },
  ];

  const combinations = [
    ['Normal + low/medium', 'Baseline hằng ngày', 'Ưu tiên cân bằng chất lượng, latency và chi phí.'],
    ['Fast + low/medium', 'Tương tác cần phản hồi nhanh', 'Pairing, chat trực tiếp, triage hoặc vòng feedback ngắn.'],
    ['Normal + high', 'Bài khó nhưng không gấp', 'Cho phép suy luận sâu mà không trả premium cho priority serving.'],
    ['Fast + high', 'Bài khó và thật sự khẩn cấp', 'Incident hoặc deadline ngắn; theo dõi cả latency lẫn chi phí.'],
  ];
  const deliveryExamples = [
    ['Làm rõ yêu cầu', 'medium · Normal', 'Tách use case, constraint và acceptance criteria mà chưa tăng latency quá sớm.'],
    ['Code thay đổi nhỏ', 'low/medium · Normal', 'Implement, lint và unit test; tăng effort khi diff chạm nhiều module hoặc API contract.'],
    ['Debug / refactor khó', 'high · Normal', 'Lần theo dependency, root cause và regression; ưu tiên độ sâu hơn tốc độ.'],
    ['Pairing / incident', 'medium/high · Fast', 'Bật Fast khi mỗi phút phản hồi đều có giá trị; vẫn bắt buộc chạy lệnh và kiểm chứng thật.'],
    ['PR review / security', 'high/xhigh · Normal', 'Đọc diff, threat model và test evidence; dùng reviewer độc lập cho thay đổi rủi ro cao.'],
    ['Release gate', 'high · Normal', 'Kiểm build, test, migration, rollback và observability; Fast chỉ khi có SLA rõ.'],
  ];

  return (
    <section className="hermesTuningGuide" aria-labelledby="hermes-tuning-title">
      <div className="hermesTuningHeader">
        <span className="badge">Effort & Fast</span>
        <h2 id="hermes-tuning-title">Chọn Fast và Effort tối ưu</h2>
        <p><code>/reasoning</code> điều chỉnh effort; <code>/fast</code> chọn priority processing/Fast Mode trên model được Hermes hỗ trợ. Fast không tự làm reasoning nông hơn, và effort cao không đảm bảo câu trả lời đúng nếu thiếu dữ liệu hoặc verification.</p>
      </div>

      <div className="hermesDecisionFlow" aria-label="Quy trình chọn effort và fast">
        <div><span>1</span><strong>Đánh giá task</strong><small>Độ mơ hồ, số bước, rủi ro và khả năng verify.</small></div><b>→</b>
        <div><span>2</span><strong>Chọn effort thấp nhất đủ dùng</strong><small>Bắt đầu low/medium; chỉ tăng khi có bằng chứng cần suy luận sâu.</small></div><b>→</b>
        <div><span>3</span><strong>Chọn Fast theo SLA</strong><small>Bật khi latency có giá trị kinh doanh lớn hơn premium cost.</small></div><b>→</b>
        <div><span>4</span><strong>Đo và hiệu chỉnh</strong><small>So pass rate, latency, token/cost và số vòng retry/tool call.</small></div>
      </div>

      <div className="hermesEffortGrid">
        {effortLevels.map((item) => (
          <article key={item.level}>
            <h3><code>{item.level}</code></h3>
            <p><strong>Nên dùng:</strong> {item.use}</p>
            <p><strong>Cẩn trọng:</strong> {item.avoid}</p>
          </article>
        ))}
      </div>

      <div className="hermesFastRule">
        <div>
          <h3>Khi nào bật Fast?</h3>
          <p><strong>Bật:</strong> hội thoại tương tác, incident response, live pairing hoặc luồng có SLA latency rõ ràng.</p>
          <p><strong>Giữ Normal:</strong> batch/background, research không gấp, cron hoặc workload nhạy chi phí.</p>
        </div>
        <div className="hermesCommandBox" aria-label="Lệnh Hermes cho reasoning và fast">
          <code>/reasoning medium</code>
          <code>/reasoning high</code>
          <code>/fast status</code>
          <code>/fast fast</code>
          <code>/fast normal</code>
        </div>
      </div>

      <div className="hermesCombinationTable" role="region" aria-label="Ma trận Effort và Fast" tabIndex={0}>
        <table>
          <thead><tr><th>Cấu hình</th><th>Phù hợp</th><th>Quy tắc vận hành</th></tr></thead>
          <tbody>{combinations.map(([mode, fit, rule]) => <tr key={mode}><th scope="row">{mode}</th><td>{fit}</td><td>{rule}</td></tr>)}</tbody>
        </table>
      </div>

      <h3 className="hermesWorkflowTitle">Ví dụ từ coding đến release</h3>
      <div className="hermesCombinationTable" role="region" aria-label="Ví dụ chọn Effort và Fast trong vòng đời delivery" tabIndex={0}>
        <table>
          <thead><tr><th>Giai đoạn</th><th>Gợi ý ban đầu</th><th>Lý do</th></tr></thead>
          <tbody>{deliveryExamples.map(([stage, setting, reason]) => <tr key={stage}><th scope="row">{stage}</th><td><code>{setting}</code></td><td>{reason}</td></tr>)}</tbody>
        </table>
      </div>

      <p className="hermesTuningNote"><strong>Verification loop:</strong> tạo một bộ task đại diện, chạy cùng model/provider với các mức effort và Fast/Normal, rồi chọn cấu hình thấp nhất vẫn đạt tiêu chí chất lượng. Khả năng hỗ trợ và billing của Fast phụ thuộc model/provider; dùng <code>/fast status</code> trước khi chuẩn hóa workflow.</p>
    </section>
  );
}

function HermesComponentsTable() {
  const components = [
    ['SOUL', 'Danh tính và nguyên tắc hành xử ổn định của agent.', 'Có', '~/.hermes/SOUL.md'],
    ['Memory & User profile', 'Dữ kiện bền vững về môi trường và preference; được snapshot vào session.', 'Có', '~/.hermes/memories/MEMORY.md · USER.md'],
    ['Profile', 'Tách config, model, memory, session, skill, plugin và gateway theo vai trò.', 'Có', '~/.hermes/profiles/<name>/'],
    ['Model & provider', 'Sinh quyết định/câu trả lời; effort phụ thuộc khả năng của model.', 'Có', '~/.hermes/config.yaml · ~/.hermes/.env cho secrets'],
    ['Prompt Builder & context', 'Ghép SOUL, tool guidance, skills, project context và memory theo thứ tự.', 'Một phần', 'Custom input qua SOUL, skills, memory và .hermes.md / AGENTS.md'],
    ['Skill Index', 'Danh mục nhẹ gồm tên và mô tả của các skill khả dụng. Hermes quét và dựng index khi bắt đầu session; Model dùng index để nhận diện skill phù hợp mà chưa nạp toàn bộ nội dung.', 'Có mặc định*', '~/.hermes/skills/ · skills_list()'],
    ['skill_view + Full Skill', 'Chỉ chạy theo nhu cầu: khi Model đã chọn một skill và cần quy trình chi tiết, skill_view(name) nạp toàn bộ SKILL.md vào context; skill_view(name, path) mở thêm file reference cụ thể.', 'Theo nhu cầu', '~/.hermes/skills/<skill>/SKILL.md'],
    ['Tools / MCP', 'Thực thi hành động thật như terminal, file, browser hoặc dịch vụ ngoài.', 'Có', '~/.hermes/config.yaml · plugin ở ~/.hermes/plugins/'],
    ['Gateway', 'Nhận/gửi tin nhắn qua Discord, Telegram và các channel đã cấu hình.', 'Có', '~/.hermes/config.yaml · secrets trong ~/.hermes/.env'],
    ['Session & state', 'Giữ lịch sử hội thoại, checkpoint và dữ liệu vận hành.', 'Runtime quản lý', '~/.hermes/state.db và state của profile'],
  ];

  return (
    <section className="hermesPageSection" aria-labelledby="hermes-components-title">
      <div className="hermesSectionHeading">
        <span className="badge">Kiến trúc</span>
        <h2 id="hermes-components-title">Các thành phần của Hermes Agent</h2>
        <p>Mỗi profile là một Hermes home độc lập. Với profile khác default, thay <code>~/.hermes/</code> bằng <code>~/.hermes/profiles/&lt;name&gt;/</code> cho các file thuộc profile đó.</p>
      </div>
      <div className="hermesComponentTable" role="region" aria-label="Bảng thành phần Hermes Agent và đường dẫn custom" tabIndex={0}>
        <table>
          <thead><tr><th>Thành phần</th><th>Vai trò</th><th>Custom?</th><th>Đường dẫn / điểm cấu hình</th></tr></thead>
          <tbody>{components.map(([name, role, custom, path]) => <tr key={name}><th scope="row">{name}</th><td>{role}</td><td>{custom}</td><td><code>{path}</code></td></tr>)}</tbody>
        </table>
      </div>
      <div className="hermesSkillFlow" aria-labelledby="hermes-skill-flow-title">
        <h3 id="hermes-skill-flow-title">Skills được nạp khi nào?</h3>
        <ol>
          <li><strong>Đầu session — dựng Skill Index:</strong> Hermes quét các skill đã cài, đang bật và tương thích với platform, rồi đưa danh mục nhẹ <code>name + description</code> vào system prompt. Profile <code>default</code> có catalog skill bundled theo mặc định, trừ khi cài bằng <code>--no-skills</code>, tắt skill hoặc catalog đang trống.</li>
          <li><strong>Khi xử lý yêu cầu — chọn skill:</strong> Model đối chiếu yêu cầu với mô tả trong index. Việc thấy một skill trong index không có nghĩa Full Skill đã được nạp.</li>
          <li><strong>Khi cần hướng dẫn đầy đủ — gọi skill_view:</strong> Model gọi <code>skill_view(name)</code> để nạp toàn bộ <code>SKILL.md</code> và metadata vào context trước khi làm theo workflow. Nếu skill dẫn tới tài liệu phụ, Model gọi tiếp <code>skill_view(name, path)</code> cho đúng file reference.</li>
        </ol>
        <p><strong>Ngoại lệ preload:</strong> người dùng có thể gọi <code>/skill &lt;name&gt;</code> hoặc chạy <code>hermes -s &lt;name&gt;</code>; khi đó Full Skill được nạp trực tiếp, không cần chờ Model tự chọn từ index.</p>
      </div>
    </section>
  );
}

function HermesConclusion() {
  const misconceptions = [
    ['Hermes chính là model', 'Không. Model là bộ não suy luận; Hermes còn có runtime, context, profile, memory, skills, tools và gateway.'],
    ['Memory là toàn bộ lịch sử chat', 'Không. Memory chỉ nên giữ dữ kiện bền vững; lịch sử session được lưu và tìm riêng.'],
    ['Skill tự chạy mọi lúc', 'Không. Skill là tri thức/workflow được tải khi phù hợp; tool mới thực hiện hành động thật.'],
    ['Fast làm câu trả lời kém thông minh hơn', 'Không mặc định. Fast là ưu tiên phục vụ; reasoning effort mới điều chỉnh độ sâu suy luận.'],
    ['Effort càng cao luôn càng tốt', 'Không. Effort cao tăng latency/chi phí và vẫn có thể sai nếu thiếu dữ liệu hoặc không verify.'],
  ];

  return (
    <section className="hermesPageSection hermesConclusion" aria-labelledby="hermes-conclusion-title">
      <div className="hermesSectionHeading">
        <span className="badge">Tóm tắt</span>
        <h2 id="hermes-conclusion-title">Conclusion và hiểu lầm thường gặp</h2>
        <p>Hãy hình dung Hermes như một con người làm việc có vai trò, trí nhớ, sách hướng dẫn và tay chân. Model quyết định; runtime thực thi; observation và verification khép kín vòng lặp.</p>
      </div>
      <div className="hermesMisconceptionGrid">
        {misconceptions.map(([claim, correction]) => <article key={claim}><h3>{claim}</h3><p>{correction}</p></article>)}
      </div>
    </section>
  );
}

function ModelTypesOverview() {
  return (
    <section className="card compact modelCatalog">
      <div className="sectionIntro">
        <span className="badge">Phân loại model</span>
        <h2>Có mấy loại model thường gặp?</h2>
        <p>Không có một danh sách duy nhất. Có thể phân loại theo output, modality hoặc cách vận hành; một model có thể thuộc nhiều nhóm cùng lúc.</p>
      </div>
      <div className="modelTypeGrid">
        {modelTypes.map((modelType, index) => (
          <div className="modelTypeCard" key={modelType.name}>
            <span className="topicStatus">Nhóm {index + 1}: {modelType.shortName}</span>
            <h3>{modelType.name}</h3>
            <p>{modelType.description}</p>
            <div className="pillRow">{modelType.useCases.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
        ))}
      </div>
      <div className="keyConcept"><strong>Lưu ý:</strong> reasoning/non-reasoning là một trục hành vi; embedding/generative là một trục nhiệm vụ; text/vision/multimodal là một trục dữ liệu. Không nên xem chúng là bốn hộp loại trừ nhau.</div>
    </section>
  );
}

function ModelSelectionGuide() {
  const criteria = [
    ['Chất lượng task thật', 'Pass rate trên prompt, code và dữ liệu của chính bạn — không chỉ benchmark công khai.'],
    ['Latency', 'Time-to-first-token và tổng thời gian; reasoning sâu thường chậm hơn.'],
    ['Chi phí', 'Giá input/output, token reasoning, cache và số lần retry/tool call.'],
    ['Context', 'Độ dài context hữu ích và khả năng giữ đúng chi tiết trong tài liệu dài.'],
    ['Tools / output', 'Độ ổn định của function calling, JSON schema, citation và instruction following.'],
    ['Privacy / hosting', 'Cloud API hay self-host; data retention, region, license và yêu cầu compliance.'],
  ];
  const choices = [
    {
      workload: 'Lập luận nhiều bước',
      examples: 'OpenAI reasoning/GPT · DeepSeek-R1 · Claude extended thinking · Gemini thinking-capable',
      fit: 'Kiến trúc, debug khó, toán/logic, lập kế hoạch có ràng buộc, review rủi ro cao.',
      caution: 'Chậm và đắt hơn; phải so sánh bằng eval vì không có model thắng mọi bài.',
    },
    {
      workload: 'Chat / tác vụ trực tiếp',
      examples: 'GPT general/mini tiers · DeepSeek-V3/Chat · Claude/Gemini fast tiers',
      fit: 'Tóm tắt, viết lại, extraction, phân loại, hỏi đáp khi input và output đã rõ.',
      caution: 'Đừng trả chi phí reasoning cho request đơn giản; ưu tiên latency và throughput.',
    },
    {
      workload: 'Local / dữ liệu riêng tư',
      examples: 'DeepSeek-R1 distilled · Qwen · Llama và các open-weight model phù hợp phần cứng',
      fit: 'Offline, lab nội bộ, dữ liệu không được gửi ra ngoài hoặc cần kiểm soát hạ tầng.',
      caution: 'Một model 8B local hữu ích cho draft/tác vụ hẹp nhưng không mặc nhiên ngang frontier reasoning.',
    },
    {
      workload: 'Ảnh, PDF, audio',
      examples: 'GPT multimodal · Gemini multimodal · Claude vision hoặc model chuyên modality',
      fit: 'Screenshot, biểu đồ, tài liệu scan, hình ảnh sản phẩm và input đa phương thức.',
      caution: 'Kiểm tra modality thực sự hỗ trợ, giới hạn file, OCR và độ chính xác trên ảnh của bạn.',
    },
    {
      workload: 'RAG / semantic search',
      examples: 'Keyword/BM25, embedding/vector hoặc hybrid retrieval + model general/reasoning',
      fit: 'Tìm tài liệu liên quan, hỏi đáp knowledge base, dedup và recommendation.',
      caution: 'RAG không bắt buộc dùng dense embedding; retrieval kém thì model mạnh vẫn trả lời kém.',
    },
    {
      workload: 'Agent gọi tools',
      examples: 'Model có tool calling + structured output ổn định; reasoning tier cho plan khó',
      fit: 'Terminal, browser, API, workflow nhiều bước và tác vụ có state.',
      caution: 'Ưu tiên độ tin cậy schema, permission, retry và verification hơn điểm chat thuần túy.',
    },
  ];

  return (
    <section className="card compact modelSelectionGuide" aria-labelledby="model-selection-title">
      <div className="sectionIntro">
        <span className="badge">Model selection</span>
        <h2 id="model-selection-title">Chọn model theo workload, không theo “hype”</h2>
        <p>Tên DeepSeek, GPT, Claude hay Gemini chỉ là danh sách ứng viên. Quyết định cuối phải dựa trên bài test thật, ngân sách, latency, dữ liệu và cách model tích hợp vào hệ thống.</p>
      </div>

      <div className="selectionCriteriaGrid" role="list" aria-label="Các tiêu chí chọn model">
        {criteria.map(([title, description], index) => (
          <article role="listitem" key={title}>
            <span>{index + 1}</span>
            <div><strong>{title}</strong><small>{description}</small></div>
          </article>
        ))}
      </div>

      <div className="modelDecisionTableWrap" role="region" aria-label="Bảng chọn model — cuộn ngang khi cần" tabIndex={0}>
        <table className="modelDecisionTable">
          <thead><tr><th>Workload</th><th>Ứng viên nên benchmark</th><th>Khi phù hợp</th><th>Cần lưu ý</th></tr></thead>
          <tbody>
            {choices.map((choice) => (
              <tr key={choice.workload}>
                <th scope="row">{choice.workload}</th>
                <td>{choice.examples}</td>
                <td>{choice.fit}</td>
                <td>{choice.caution}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="modelRoutingFlow" aria-label="Quy trình chọn và route model">
        <div><span>1</span><strong>Định nghĩa eval</strong><small>20–100 task đại diện + tiêu chí pass/fail.</small></div>
        <b>→</b>
        <div><span>2</span><strong>Baseline model nhanh</strong><small>Đo quality, latency và cost trước.</small></div>
        <b>→</b>
        <div><span>3</span><strong>So 2–3 ứng viên</strong><small>Chạy cùng prompt, tools và dữ liệu.</small></div>
        <b>→</b>
        <div><span>4</span><strong>Route theo độ khó</strong><small>Fast model mặc định; reasoning fallback cho case khó/rủi ro.</small></div>
      </div>

      <div className="keyConcept"><strong>Quy tắc thực dụng:</strong> chọn model nhỏ/nhanh nhất vẫn đạt quality gate. Chỉ nâng lên reasoning tier khi task nhiều bước, sai sót có impact lớn hoặc eval chứng minh model nhanh chưa đủ.</div>
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
    </button>
  );
}

function LearningSidebar({ activeTopicId, activeArticleId, onOpenTopic, onOpenArticle, onHome, isOpen }: { activeTopicId?: string; activeArticleId?: string; onOpenTopic: (topicId: string) => void; onOpenArticle: (articleId: string) => void; onHome: () => void; isOpen: boolean }) {
  const sidebarRef = React.useRef<HTMLElement | null>(null);
  const [expandedTopicId, setExpandedTopicId] = React.useState<string | null>(activeTopicId ?? null);

  React.useEffect(() => {
    if (activeTopicId) setExpandedTopicId(activeTopicId);
  }, [activeArticleId, activeTopicId]);

  React.useEffect(() => {
    const activeItem = sidebarRef.current?.querySelector('.sidebarArticle.current')
      ?? sidebarRef.current?.querySelector('.sidebarTopic.active');
    activeItem?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeArticleId, activeTopicId]);

  React.useEffect(() => {
    if (!isOpen || !window.matchMedia('(max-width: 820px)').matches) return;
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const focusableSelector = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => Array.from(sidebar.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => !element.closest('[hidden]'));
    const focusable = getFocusable();
    const first = focusable[0];
    const focusFrame = window.requestAnimationFrame(() => first?.focus());

    const trapFocus = (event: KeyboardEvent) => {
      const currentFocusable = getFocusable();
      const currentFirst = currentFocusable[0];
      const currentLast = currentFocusable.at(-1);
      if (event.key !== 'Tab' || !currentFirst || !currentLast) return;
      if (!sidebar.contains(document.activeElement)) {
        event.preventDefault();
        currentFirst.focus();
      } else if (event.shiftKey && document.activeElement === currentFirst) {
        event.preventDefault();
        currentLast.focus();
      } else if (!event.shiftKey && document.activeElement === currentLast) {
        event.preventDefault();
        currentFirst.focus();
      }
    };

    document.addEventListener('keydown', trapFocus);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', trapFocus);
    };
  }, [isOpen]);

  return (
    <aside className="lessonSidebar" aria-label="Danh sách bài học" id="lesson-sidebar" ref={sidebarRef}>
      <div className="sidebarTopbar">
        <button className="sidebarHome" onClick={onHome} type="button">Anti Knowledge Outdate</button>
      </div>
      {topics.map((topic) => {
        const topicArticles = articles.filter((article) => article.topic === topic.title || (topic.id === 'ai' && article.topic === 'AI'));
        const isActiveTopic = activeTopicId === topic.id;
        const isExpanded = expandedTopicId === topic.id && topicArticles.length > 0;
        const articleListId = `sidebar-topic-${topic.id}`;
        return (
          <section className={`sidebarTopic ${isActiveTopic ? 'active' : ''} ${isExpanded ? 'expanded' : ''}`} key={topic.id}>
            <div className="sidebarTopicRow">
              <button className="sidebarTopicButton" onClick={() => onOpenTopic(topic.id)} type="button">
                <span className="sidebarIcon">{topic.icon}</span>
                <span>{topic.title}</span>
                <small>{topic.status === 'available' ? `${topic.articleCount} bài` : 'Đang cập nhật'}</small>
              </button>
              {topicArticles.length > 0 && (
                <button
                  className="sidebarTopicExpand"
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={articleListId}
                  aria-label={`${isExpanded ? 'Thu gọn' : 'Mở rộng'} mục ${topic.title}`}
                  onClick={() => setExpandedTopicId((current) => current === topic.id ? null : topic.id)}
                >
                  <ChevronDown aria-hidden="true" size={18} />
                </button>
              )}
            </div>
            {isExpanded && (
              <div className="sidebarArticleList" id={articleListId}>
                {topicArticles.map((article) => (
                  <button className={`sidebarArticle ${activeArticleId === article.id ? 'current' : ''}`} key={article.id} onClick={() => onOpenArticle(article.id)} type="button">
                    {article.navLabel ?? article.title}
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </aside>
  );
}

function LessonShell({ activeTopicId, activeArticleId, onOpenTopic, onOpenArticle, onHome, children }: { activeTopicId?: string; activeArticleId?: string; onOpenTopic: (topicId: string) => void; onOpenArticle: (articleId: string) => void; onHome: () => void; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(() => window.matchMedia('(min-width: 821px)').matches);
  const toggleRef = React.useRef<HTMLButtonElement | null>(null);
  const closeSidebar = React.useCallback((restoreFocus = false) => {
    setSidebarOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => toggleRef.current?.focus());
  }, []);
  const closeOnMobile = React.useCallback(() => {
    if (window.matchMedia('(max-width: 820px)').matches) closeSidebar();
  }, [closeSidebar]);
  const closeAndTopic = (topicId: string) => { closeOnMobile(); onOpenTopic(topicId); };
  const closeAndArticle = (articleId: string) => { closeOnMobile(); onOpenArticle(articleId); };
  const closeAndHome = () => { closeOnMobile(); onHome(); };

  React.useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 821px)');
    const syncSidebarWithViewport = (event: MediaQueryListEvent) => setSidebarOpen(event.matches);
    desktopQuery.addEventListener('change', syncSidebarWithViewport);
    return () => desktopQuery.removeEventListener('change', syncSidebarWithViewport);
  }, []);

  React.useEffect(() => {
    if (!sidebarOpen) return;
    const isMobile = window.matchMedia('(max-width: 820px)').matches;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSidebar(true);
    };
    if (isMobile) document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (isMobile) document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeSidebar, sidebarOpen]);

  return (
    <main className={`lessonLayout ${sidebarOpen ? 'sidebarOpen' : 'sidebarClosed'}`}>
      <button
        className="sidebarToggle"
        onClick={() => setSidebarOpen((open) => !open)}
        type="button"
        aria-expanded={sidebarOpen}
        aria-controls="lesson-sidebar"
        aria-label={sidebarOpen ? 'Đóng menu bài học' : 'Mở menu bài học'}
        data-tooltip={sidebarOpen ? 'Đóng menu' : 'Mở menu'}
        ref={toggleRef}
      >
        {sidebarOpen ? <ChevronLeft aria-hidden="true" size={20} /> : <ChevronRight aria-hidden="true" size={20} />}
      </button>
      <LearningSidebar activeTopicId={activeTopicId} activeArticleId={activeArticleId} onOpenTopic={closeAndTopic} onOpenArticle={closeAndArticle} onHome={closeAndHome} isOpen={sidebarOpen} />
      <div className="sidebarBackdrop" onClick={() => closeSidebar(true)} aria-hidden="true" />
      <div className="lessonContent">{children}</div>
    </main>
  );
}

function UpdatingPage({ topic, onBack, onHome, onOpenTopic, onOpenArticle }: { topic: Topic; onBack: () => void; onHome: () => void; onOpenTopic: (topicId: string) => void; onOpenArticle: (articleId: string) => void }) {
  return (
    <LessonShell activeTopicId={topic.id} onOpenTopic={onOpenTopic} onOpenArticle={onOpenArticle} onHome={onHome}>
      <div className="pageShell">
      <PageActions onBack={onBack} onHome={onHome} backLabel="Quay lại" />
      <section className="card emptyPage">
        <div className="placeholderIcon">{topic.icon}</div>
        <span className="badge">{topic.title}</span>
        <h1>Đang cập nhật nội dung</h1>
        <p className="lead">Section này đã được giữ chỗ. Khi Tân đưa câu hỏi về {topic.title}, mình sẽ bổ sung bài giải thích, sơ đồ và mô phỏng vào đây.</p>
        <div className="pillRow">{topic.bullets.map((item) => <span key={item}>{item}</span>)}</div>
      </section>
      </div>
    </LessonShell>
  );
}

function TopicPage({ topic, onBack, onHome, onOpenTopic, onOpenArticle }: { topic: Topic; onBack: () => void; onHome: () => void; onOpenTopic: (topicId: string) => void; onOpenArticle: (articleId: string) => void }) {
  const topicArticles = articles.filter((article) => article.topic === topic.title || (topic.id === 'ai' && article.topic === 'AI'));
  return (
    <LessonShell activeTopicId={topic.id} onOpenTopic={onOpenTopic} onOpenArticle={onOpenArticle} onHome={onHome}>
      <div className="pageShell">
      <PageActions onBack={onBack} onHome={onHome} backLabel="Quay lại trang chính" />
      <section className="pageHeader">
        <span className="badge">{topic.title}</span>
        <h1>{topic.id === 'ai' ? 'Các câu hỏi AI đầu tiên' : `Bài học ${topic.title}`}</h1>
        <p className="lead">Chọn từng bài để mở nội dung chi tiết. Trang này không show toàn bộ bài để tránh bị quá tải khi đọc.</p>
      </section>
      <div className="articleList">
        {topicArticles.map((article, index) => <ArticleListItem article={article} index={index} key={article.id} onOpen={() => onOpenArticle(article.id)} />)}
      </div>
      </div>
    </LessonShell>
  );
}

function HermesAgentLearningPage({ article }: { article: Article }) {
  return (
    <article className="hermesAgentPage">
      <header className="hermesPageHero">
        <span className="badge">Hermes Agent</span>
        <h1>Hermes Agent hoạt động như thế nào?</h1>
        <p>Hermes Agent nhận mục tiêu, ghép đúng vai trò và context, dùng model để quyết định bước tiếp theo, rồi gọi tool để hành động và kiểm chứng. Model là phần suy luận; Hermes là toàn bộ hệ thống giúp suy luận đó làm việc an toàn và có trạng thái.</p>
      </header>

      <HermesComponentsTable />
      <HermesHumanBodyEmbed />
      <HermesRuntimeTuningGuide />
      <HermesConclusion />
      {(lessonQAs[article.id]?.length ?? 0) > 0 && <LessonQA items={lessonQAs[article.id]} />}
      <footer className="articleFooter"><span>Cập nhật lần cuối: {article.lastVerified}</span></footer>
    </article>
  );
}

function ArticleVisual({ article }: { article: Article }) {
  if (article.id === 'ai-model-assistant-agent') return <AIApplicationDiagram />;
  if (article.id === 'model-co-thuc-su-suy-nghi-khong') return <><ModelTypesOverview /><ModelSelectionGuide /><ModelAgentSimulator /></>;
  if (article.id === 'agent') return <AgentArchitectureDiagram />;
  if (article.id === 'docker-build-trong-vs-ngoai') return <DockerCoreDiagram />;
  if (article.topic === 'Docker') return <DockerLessonDetails articleId={article.id} />;
  if (article.id === 'master-kubernetes') return <KubernetesCoreArchitectureLab />;
  if (article.id === 'multi-container-trong-pod') return <MultiContainerPodPatternLab />;
  if (article.id === 'k8s-workload-configuration') return <KubernetesConfigurationGuide />;
  if (article.id === 'k8s-observability-probes') return <KubernetesObservabilityGuide />;
  if (article.topic === 'Redis') return <RedisLearningJourney chapterId={article.id.replace(/^redis-/, '')} />;
  if (article.topic === 'Kafka') return <KafkaLearningJourney chapterId={article.id.replace(/^kafka-/, '')} />;
  return <MermaidDiagram chart={article.diagram} id={article.id} />;
}

function ArticlePage({ article, parentTopicId, onBack, onHome, onOpenTopic, onOpenArticle }: { article: Article; parentTopicId: string; onBack: () => void; onHome: () => void; onOpenTopic: (topicId: string) => void; onOpenArticle: (articleId: string) => void }) {
  if (article.id === 'hermes-vs-copilot-chatgpt') {
    return (
      <LessonShell activeTopicId={parentTopicId} activeArticleId={article.id} onOpenTopic={onOpenTopic} onOpenArticle={onOpenArticle} onHome={onHome}>
        <div className="pageShell">
          <PageActions onBack={onBack} onHome={onHome} backLabel={`Quay lại danh sách ${article.topic}`} />
          <HermesAgentLearningPage article={article} />
        </div>
      </LessonShell>
    );
  }

  return (
    <LessonShell activeTopicId={parentTopicId} activeArticleId={article.id} onOpenTopic={onOpenTopic} onOpenArticle={onOpenArticle} onHome={onHome}>
      <div className="pageShell">
      <PageActions onBack={onBack} onHome={onHome} backLabel={`Quay lại danh sách ${article.topic}`} />
      <article className="card articleCard detailArticle">
        <div className="cardHeader">
          <span className="badge">{article.topic}</span>
        </div>
        <p className="question">Câu hỏi: {article.question}</p>
        <h1>{article.title}</h1>
        <p className="summary">{article.summary}</p>
        <ArticleVisual article={article} />
        {article.topic !== 'Kafka' && (
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
        )}
        {(lessonQAs[article.id]?.length ?? 0) > 0 && <LessonQA items={lessonQAs[article.id]} />}
        <footer className="articleFooter">
          <span>Cập nhật lần cuối: {article.lastVerified}</span>
          {article.topic !== 'Kafka' && (
            <span>Câu hỏi tiếp theo: {article.nextQuestions.join(' · ')}</span>
          )}
        </footer>
      </article>
      </div>
    </LessonShell>
  );
}

function HomePage({ onOpenTopic }: { onOpenTopic: (topicId: string) => void }) {
  return (
    <main>
      <section className="topicSection homeTopicSection">
        <div className="sectionIntro homeTitle">
          <h2>Anti Knowledge Outdate</h2>
        </div>
        <div className="topicGrid">{topics.map((topic) => <TopicCard key={topic.id} topic={topic} onOpen={() => onOpenTopic(topic.id)} />)}</div>
      </section>

    </main>
  );
}

function NotFoundPage({ onHome }: { onHome: () => void }) {
  return (
    <main className="pageShell">
      <PageActions onBack={onHome} onHome={onHome} backLabel="Quay lại trang chính" />
      <section className="card emptyPage">
        <div className="placeholderIcon"><Boxes /></div>
        <h1>Không tìm thấy bài học</h1>
        <p>URL này có thể đã được xoá hoặc đổi tên. Hãy quay lại trang chính để chọn bài đang có.</p>
      </section>
    </main>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    const saved = window.localStorage.getItem('knowledge-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  React.useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('knowledge-theme', theme);
    window.dispatchEvent(new CustomEvent('knowledge-theme-change', { detail: theme }));
  }, [theme]);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      className="themeToggle"
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Chuyển sang giao diện ${nextTheme === 'light' ? 'sáng' : 'tối'}`}
      title={`Chuyển sang giao diện ${nextTheme === 'light' ? 'sáng' : 'tối'}`}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
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
    if (topic.status === 'updating') return <UpdatingPage topic={topic} onBack={openHome} onHome={openHome} onOpenTopic={openTopic} onOpenArticle={openArticle} />;
    return <TopicPage topic={topic} onBack={openHome} onHome={openHome} onOpenTopic={openTopic} onOpenArticle={openArticle} />;
  }

  if (view.type === 'article') {
    const article = articles.find((item) => item.id === view.articleId);
    if (!article) return <NotFoundPage onHome={openHome} />;
    const parentTopic = topics.find((topic) => topic.title === article.topic || (article.topic === 'AI' && topic.id === 'ai')) ?? topics[0];
    return <ArticlePage article={article} parentTopicId={parentTopic.id} onBack={() => openTopic(parentTopic.id)} onHome={openHome} onOpenTopic={openTopic} onOpenArticle={openArticle} />;
  }

  return <HomePage onOpenTopic={openTopic} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <ThemeToggle />
    <App />
  </>,
);
