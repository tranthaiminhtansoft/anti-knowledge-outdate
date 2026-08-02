export type KafkaTone = 'good' | 'warn' | 'bad';
export type KafkaMode = 'kraft' | 'zookeeper';

export type KafkaNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
};

export type KafkaEdge = { id: string; from: string; to: string; label?: string };

export type KafkaStep = {
  title: string;
  text: string;
  activeNodes: string[];
  activeEdge?: string;
  tones?: Record<string, KafkaTone>;
  metrics: Record<string, string>;
  log: string;
  mode?: KafkaMode;
};

export type KafkaChapter = {
  id: string;
  phase: string;
  title: string;
  navLabel: string;
  question: string;
  summary: string;
  story: string;
  outcome: string;
  checkpoint: string;
  checkpointAnswer: string;
  runbook: string[];
  keyPoints: string[];
  misconceptions: string[];
  projectCase?: {
    name: string;
    context: string;
    problem: string;
    event: string;
    decision: string;
  };
  callouts?: Array<{ title: string; body: string; tone?: KafkaTone }>;
  flowLanes?: Array<{ title: string; steps: string[] }>;
  glossary?: Array<{ term: string; location: string; role: string }>;
  sourceUrl: string;
  painIds?: string[];
  nodes: KafkaNode[];
  edges: KafkaEdge[];
  steps: KafkaStep[];
};

const n = (id: string, x: number, y: number, title: string, sub: string, w = 160, h = 76): KafkaNode => ({ id, x, y, w, h, title, sub });
const e = (id: string, from: string, to: string, label?: string): KafkaEdge => ({ id, from, to, label });

const chapterRegistry: KafkaChapter[] = [
  {
    id: 'overview', phase: 'Phần I · Bắt đầu từ bài toán', title: 'Vì sao backend cần Kafka?', navLabel: 'Vì sao cần Kafka?',
    question: 'Nếu backend đã có HTTP API và database, Kafka giải quyết nỗi đau nào?',
    summary: 'Kafka đứng giữa nơi phát sinh sự kiện và các hệ thống xử lý phía sau để giảm coupling, hấp thụ tải, fan-out và cho phép replay.',
    story: 'Không có Kafka, Checkout API gọi đồng thời ba HTTP dependency: Inventory, Notification và Analytics. Dù chạy song song, request vẫn phải chờ service chậm nhất; chỉ một dependency lỗi cũng có thể làm đặt hàng thất bại dù order đã hợp lệ.',
    outcome: 'Giải thích được lúc nào Kafka có ích, lúc nào không cần Kafka và Kafka không thay thế HTTP API hay database.',
    checkpoint: 'Nếu Notification đang down, việc tạo Order có nhất thiết phải thất bại không?',
    checkpointAnswer: 'Không, nếu Notification là xử lý bất đồng bộ và transaction tạo Order đã thành công. Event vẫn nằm trong Kafka để consumer Notification bắt kịp khi hoạt động lại. Chỉ nên làm Order thất bại nếu notification thực sự là điều kiện bắt buộc trong contract đồng bộ.',
    runbook: ['Dùng Kafka khi cần tách nhiều downstream, buffer tải, lưu event bền vững hoặc replay.', 'Không dùng Kafka cho CRUD đơn giản, luồng cần kết quả tức thời hoặc khi một queue nhỏ đã đủ.', 'Chốt dữ liệu nguồn và transaction boundary trước khi phát event.'],
    keyPoints: ['HTTP API xử lý request đồng bộ và trả kết quả trực tiếp cho client.', 'Kafka giúp backend công bố một fact để nhiều hệ thống xử lý độc lập.', 'Kafka thêm operational complexity; chỉ dùng khi lợi ích coupling, buffering, fan-out hoặc replay đáng giá.'],
    misconceptions: ['“Có backend là mọi request đều phải đi qua Kafka” — sai.', '“Kafka xử lý business logic thay backend” — sai.', '“API phải chờ tất cả consumer xử lý xong” — sai với flow bất đồng bộ.'],
    projectCase: {
      name: 'ShopNow · Dự án thương mại điện tử giả lập',
      context: 'ShopNow có Checkout API nhận POST /orders. Sau khi tạo đơn, hệ thống phải giữ tồn kho, gửi xác nhận và cập nhật số liệu kinh doanh.',
      problem: 'Trong flash sale, Checkout gọi đồng thời cả ba service nhưng vẫn chờ tất cả trong request path. Notification chậm hoặc Analytics lỗi có thể kéo dài request, làm retry phức tạp và khiến đơn hợp lệ bị báo thất bại.',
      event: 'order.created',
      decision: 'Checkout commit Order + Outbox rồi trả HTTP 201. Outbox Relay công bố order.created; Kafka lưu và fan-out event để mỗi hệ thống phía sau tự xử lý, retry và bắt kịp theo tốc độ riêng.',
    },
    callouts: [
      { title:'Không Kafka', body:'Checkout gọi đồng thời 3 service nhưng vẫn chờ tất cả: request chậm theo dependency chậm nhất, lỗi lan ngược và deploy bị coupling.', tone:'bad' },
      { title:'Có Kafka', body:'Checkout commit Order + Outbox; relay phát event; Kafka buffer/lưu; từng consumer xử lý độc lập và có thể replay.', tone:'good' },
      { title:'Không nên dùng', body:'CRUD nhỏ, request-response cần kết quả tức thời, không fan-out/replay: REST + database thường đơn giản hơn.' },
    ],
    sourceUrl: 'https://kafka.apache.org/43/getting-started/introduction/',
    nodes: [n('client', 20, 205, 'Client', 'POST /orders', 135, 72), n('api', 205, 205, 'Checkout API', 'Validate + create order', 170, 82), n('kafka', 465, 205, 'Kafka', 'orders topic', 155, 82), n('inventory', 730, 55, 'Inventory', 'Reserve stock', 145, 76), n('notification', 730, 205, 'Notification', 'Send email', 145, 76), n('analytics', 730, 355, 'Analytics', 'Update metrics', 145, 76)],
    edges: [e('request','client','api','HTTP'), e('direct-inventory','api','inventory','sync HTTP'), e('direct-notification','api','notification','sync HTTP'), e('direct-analytics','api','analytics','sync HTTP'), e('publish','api','kafka','event'), e('consume-inventory','kafka','inventory','fetch'), e('consume-notification','kafka','notification','fetch'), e('consume-analytics','kafka','analytics','fetch')],
    steps: [
      { title:'Client gọi backend API', text:'Client chỉ biết POST /orders. Kafka không nhận HTTP request này; Checkout API mới là nơi validate authentication, payload và business rule.', activeNodes:['client','api'], activeEdge:'request', metrics:{request:'POST /orders',owner:'Checkout API',kafka:'not called yet'}, log:'HTTP POST /orders -> checkout-api' },
      { title:'Nỗi đau: API gọi nhiều service đồng bộ', text:'Checkout có thể gọi Inventory, Notification và Analytics đồng thời, nhưng request vẫn bị giữ đến khi dependency chậm nhất hoàn tất.', activeNodes:['api','inventory'], activeEdge:'direct-inventory', tones:{api:'warn'}, metrics:{dependencies:'3 concurrent sync calls',latency:'slowest dependency',coupling:'high'}, log:'checkout -> inventory HTTP reserve' },
      { title:'Một dependency lỗi kéo hỏng request', text:'Notification timeout có thể làm toàn request lỗi hoặc buộc backend viết logic retry/partial failure phức tạp.', activeNodes:['api','notification'], activeEdge:'direct-notification', tones:{api:'bad',notification:'bad'}, metrics:{notification:'timeout',checkout:'blocked',retry:'coupled'}, log:'notification timeout after 2s -> checkout 500?' },
      { title:'Kafka tách backend khỏi downstream', text:'Sau khi core transaction thành công, backend công bố order.created. Kafka lưu event; backend không cần gọi từng downstream trong request path.', activeNodes:['api','kafka'], activeEdge:'publish', tones:{kafka:'good'}, metrics:{event:'order.created',fan_out:'3 groups',coupling:'asynchronous'}, log:'produce orders key=order-42' },
      { title:'Mỗi consumer tự xử lý theo tốc độ riêng', text:'Inventory chủ động fetch event. Nếu tạm dừng, event vẫn còn trong retention để consumer bắt kịp sau.', activeNodes:['kafka','inventory'], activeEdge:'consume-inventory', metrics:{inventory:'processing',retention:'7 days',notification:'independent'}, log:'group=inventory fetch orders-1@1842' },
      { title:'Một event phục vụ nhiều mục đích', text:'Notification và Analytics dùng group/offset riêng. Lỗi ở một consumer không bắt consumer khác dừng và không đổi HTTP response đã trả.', activeNodes:['notification','analytics'], tones:{notification:'good',analytics:'good'}, metrics:{groups:'3',replay:'possible',api_waits_consumers:'no'}, log:'notification offset=1842\nanalytics offset=1810' },
    ],
  },
  {
    id: 'api-flow', phase: 'Phần I · Request thực tế', title: 'Backend gọi API thì Kafka làm gì?', navLabel: 'API → Kafka',
    question: 'Từ POST /orders đến event order.created, HTTP, database và Kafka tham gia ở bước nào?',
    summary: 'HTTP request đi vào backend, không đi thẳng vào Kafka. Flow production mẫu chọn commit Order + Outbox; relay dùng Kafka producer client để gửi event cho broker.',
    story: 'Transactional Outbox là lựa chọn reliability của flow mẫu, không phải điều kiện để dùng Kafka và vẫn có thể dùng với broker khác. Pattern này tránh lỗi dual-write: database đã có Order nhưng publish thất bại, hoặc broker đã có event nhưng transaction Order rollback.',
    outcome: 'Theo được hai lane: request đồng bộ kết thúc ở HTTP 201 và xử lý bất đồng bộ bắt đầu từ Outbox Relay.',
    checkpoint: 'Produce ACK có đồng nghĩa Inventory đã reserve stock xong không?',
    checkpointAnswer: 'Không. ACK chỉ xác nhận broker đã nhận và lưu record theo durability policy của producer. Inventory vẫn phải fetch event, xử lý reserve stock và commit offset ở một bước độc lập.',
    runbook: ['HTTP contract phải nói rõ phần nào hoàn tất trước 201.', 'Commit Order và Outbox trong cùng local database transaction.', 'Relay publish theo at-least-once với event_id ổn định; consumer deduplicate và xử lý idempotently.'],
    keyPoints: ['Client không call Kafka; client call backend HTTP API.', 'Backend chạy business logic và lưu source of truth trước.', 'Outbox là pattern tích hợp tùy chọn, không phải Kafka component.', 'Kafka nhận record qua Kafka protocol từ producer client, lưu và phân phối cho consumer.'],
    misconceptions: ['“HTTP request tự động chui vào Kafka” — sai.', '“Broker tạo Order trong database” — sai.', '“Kafka gọi HTTP sang consumer” — sai; consumer chủ động poll/fetch.'],
    flowLanes: [
      { title:'Lane đồng bộ HTTP', steps:['Client POST /orders','Checkout validate','Commit Order + Outbox','Trả HTTP 201'] },
      { title:'Lane bất đồng bộ Kafka', steps:['Relay đọc Outbox','Producer gửi record','Broker lưu + ACK','Consumers fetch + commit offset'] },
    ],
    sourceUrl: 'https://kafka.apache.org/43/design/design/',
    nodes: [n('client', 15, 205, 'Client', 'POST /orders', 125, 72), n('api', 175, 205, 'Checkout API', 'Business logic', 155, 82), n('db', 370, 205, 'Orders DB', 'Order + Outbox TX', 170, 82), n('relay', 580, 205, 'Outbox Relay', 'Kafka producer client', 165, 82), n('broker', 790, 85, 'Kafka Broker', 'orders partition', 125, 82), n('consumers', 790, 335, 'Consumers', 'Inventory / email', 125, 82)],
    edges: [e('http-request','client','api','HTTP request'), e('db-tx','api','db','local TX'), e('http-response','api','client','HTTP 201'), e('outbox-read','db','relay','unsent row'), e('produce','relay','broker','ProduceRequest'), e('ack','broker','relay','ACK'), e('fetch-request','consumers','broker','FetchRequest'), e('fetch-response','broker','consumers','FetchResponse')],
    steps: [
      { title:'Client gọi HTTP API', text:'POST /orders đến Checkout API. Kafka không parse JWT, validate payload hay quyết định giá/stock.', activeNodes:['client','api'], activeEdge:'http-request', metrics:{protocol:'HTTP',endpoint:'/orders',kafka_role:'none'}, log:'POST /orders {items:[...]} -> checkout-api' },
      { title:'Backend commit Order + Outbox', text:'Checkout validate business rule rồi ghi Order và event outbox trong cùng database transaction. Đây là source-of-truth boundary.', activeNodes:['api','db'], activeEdge:'db-tx', metrics:{transaction:'Order + Outbox',atomic:'yes',event_status:'pending'}, log:'BEGIN; INSERT orders; INSERT outbox; COMMIT;' },
      { title:'API trả HTTP 201', text:'Sau commit thành công, API có thể trả 201 theo contract bất đồng bộ. Inventory/Notification chưa nhất thiết xử lý xong.', activeNodes:['api','client'], activeEdge:'http-response', tones:{client:'good'}, metrics:{http_status:'201',order_state:'created',consumers_done:'no'}, log:'HTTP/1.1 201 Created orderId=42' },
      { title:'Relay publish event vào Kafka', text:'Outbox Relay đọc row chưa gửi. Producer là thư viện Kafka client trong relay/backend, tạo ProduceRequest order.created.', activeNodes:['db','relay'], activeEdge:'outbox-read', metrics:{producer:'client library',event:'order.created',key:'order-42'}, log:'outbox row 991 -> producer.send(orders)' },
      { title:'Broker lưu và ACK producer', text:'Broker leader append/replicate theo durability policy rồi ACK về producer. ACK chỉ xác nhận bước ghi Kafka, không xác nhận consumer đã xử lý.', activeNodes:['broker','relay'], activeEdge:'ack', tones:{broker:'good'}, metrics:{topic:'orders',partition:'P1',offset:'1842'}, log:'ProduceResponse offset=1842 error=NONE' },
      { title:'Consumer tự fetch và xử lý', text:'Inventory/Notification gửi FetchRequest; broker trả FetchResponse chứa record. Consumer chạy logic riêng rồi commit offset. Lỗi consumer không đảo ngược HTTP 201 đã trả.', activeNodes:['broker','consumers'], activeEdge:'fetch-response', metrics:{consumer_model:'pull',request:'FetchRequest',response:'FetchResponse',http_response:'unchanged'}, log:'group=inventory fetch orders-1@1842' },
    ],
  },
  {
    id: 'components', phase: 'Phần I · Thành phần', title: 'Kafka gồm những thành phần nào?', navLabel: 'Các thành phần',
    question: 'Producer, broker, topic, partition, replica, consumer group, offset và controller chịu trách nhiệm gì?',
    summary: 'Các thành phần được học theo data path thật: producer client gửi record → broker lưu trong topic/partition → consumer group fetch theo offset; controller quản lý metadata.',
    story: 'Kafka không phải một “hộp” duy nhất. Một cluster có broker và controller; ứng dụng sử dụng producer/consumer client để nói chuyện với cluster.',
    outcome: 'Chỉ đúng thành phần nào thuộc ứng dụng, thành phần nào thuộc Kafka cluster và state nào được lưu.',
    checkpoint: 'Producer và consumer có phải process chạy bên trong broker không?',
    checkpointAnswer: 'Không. Producer và consumer là Kafka client chạy trong process ứng dụng hoặc worker. Broker là Kafka server lưu partition và phục vụ Produce/Fetch request.',
    runbook: ['Bắt đầu trace ở producer client, topic/partition và consumer group.', 'Phân biệt data plane broker với control plane controller.', 'Theo dõi offset/lag theo group và replica/ISR theo partition.'],
    keyPoints: ['Producer là Kafka client library nằm trong backend hoặc relay, không phải Kafka server.', 'Kafka không nhận HTTP request và không chạy business logic của Order.', 'Broker lưu record; consumer chủ động fetch; controller quản lý metadata/leader election.'],
    misconceptions: ['“Topic là một server riêng” — sai; topic là logical stream chia thành partition trên broker.', '“Kafka push event bằng HTTP tới consumer” — sai.', '“Produce ACK nghĩa là consumer đã xử lý” — sai.'],
    glossary: [
      { term:'Producer', location:'Trong backend / relay', role:'Kafka client gửi record bằng Kafka protocol.' },
      { term:'Broker', location:'Kafka cluster', role:'Server lưu partition và phục vụ Produce/Fetch request.' },
      { term:'Topic', location:'Logical trong cluster', role:'Tên luồng event, ví dụ orders.' },
      { term:'Partition', location:'Trên broker', role:'Ordered append-only log, cấp offset và đơn vị song song.' },
      { term:'Leader', location:'Một replica của partition', role:'Replica nhận read/write cho partition tại thời điểm hiện tại.' },
      { term:'Follower / ISR', location:'Broker khác', role:'Sao chép leader; ISR là tập replica đang đồng bộ.' },
      { term:'Consumer', location:'Ứng dụng downstream', role:'Kafka client chủ động poll/fetch và xử lý record.' },
      { term:'Consumer Group', location:'Ứng dụng + group state', role:'Chia partition giữa consumer cùng mục đích.' },
      { term:'Offset', location:'Partition / group progress', role:'Vị trí record và checkpoint đọc của từng group.' },
      { term:'KRaft Controller', location:'Control plane Kafka', role:'Quản lý metadata, broker registration và leader election.' },
    ],
    sourceUrl: 'https://kafka.apache.org/43/getting-started/introduction/',
    nodes: [n('producer', 20, 205, 'Producer client', 'Inside backend/relay', 155, 82), n('broker', 220, 205, 'Broker', 'Kafka server', 145, 82), n('partition', 415, 205, 'Topic / Partition', 'Ordered record log', 170, 82), n('replica', 625, 65, 'Replica', 'Durability copy', 145, 76), n('consumer', 625, 330, 'Consumer Group', 'Poll + process', 155, 82), n('controller', 800, 205, 'KRaft Controller', 'Metadata control', 110, 82)],
    edges: [e('produce','producer','broker','Kafka protocol'), e('append','broker','partition','append'), e('replicate','partition','replica','copy'), e('fetch','partition','consumer','fetch'), e('metadata','controller','broker','metadata')],
    steps: [
      { title:'Producer client', text:'Producer là thư viện trong backend/relay: serialize record, chọn partition, batch/compress và gửi Kafka protocol.', activeNodes:['producer'], metrics:{location:'application process',input:'event + key',protocol:'Kafka'}, log:'KafkaProducer.send(topic=orders)' },
      { title:'Broker', text:'Broker là Kafka server nhận Produce/Fetch request. Broker không validate Order và không gửi email.', activeNodes:['producer','broker'], activeEdge:'produce', metrics:{role:'store + serve records',business_logic:'none',http:'none'}, log:'ProduceRequest -> broker-1' },
      { title:'Topic và Partition', text:'Topic là tên logical stream; partition là ordered append-only log thực sự nằm trên broker và cấp offset.', activeNodes:['broker','partition'], activeEdge:'append', metrics:{topic:'orders',partition:'P1',offset:'1842'}, log:'append orders-1@1842' },
      { title:'Replica và Leader', text:'Một partition có leader phục vụ request và follower replicas sao chép để tăng durability/availability.', activeNodes:['partition','replica'], activeEdge:'replicate', metrics:{leader:'B1',replica:'B2',isr:'B1,B2'}, log:'follower B2 fetch orders-1' },
      { title:'Consumer Group', text:'Consumer trong cùng group chia partition để xử lý song song; group khác có thể đọc lại cùng record độc lập.', activeNodes:['partition','consumer'], activeEdge:'fetch', metrics:{group:'inventory',assignment:'P1 -> C1',delivery:'pull/fetch'}, log:'FetchRequest group=inventory' },
      { title:'Offset', text:'Offset là vị trí record trong partition; committed offset lưu tiến độ từng consumer group và cho phép resume/replay.', activeNodes:['consumer'], metrics:{current:'1842',committed:'1843',meaning:'next record'}, log:'OffsetCommit orders-1=1843' },
      { title:'Controller', text:'KRaft controller quản lý metadata, broker registration và leader election. Payload event không đi qua controller.', activeNodes:['controller','broker'], activeEdge:'metadata', metrics:{plane:'control',payload_records:'none',quorum:'3 controllers'}, log:'partition metadata leader=B1 epoch=44' },
    ],
  },
  {
    id: 'partitioning', phase: 'Phần II · Data model', title: 'Topic, Partition, Replica và Ordering', navLabel: 'Partition & ordering',
    question: 'Kafka giữ thứ tự ở phạm vi nào và vì sao key có thể tạo hot partition?',
    summary: 'Topic chia thành partition; mỗi partition là ordered log có leader và replicas.',
    story: 'Order của cùng customer cần đúng thứ tự nhưng traffic phải phân phối qua nhiều broker.',
    outcome: 'Chọn key theo ordering domain và nhận diện partition skew.',
    checkpoint: 'Tăng số partition có giữ nguyên mapping key cũ không?',
    checkpointAnswer: 'Không được bảo đảm. Nhiều partitioner tính partition dựa trên số partition hiện tại, nên khi tăng số lượng partition, cùng một key có thể được ánh xạ sang partition khác. Cần đánh giá ordering và kế hoạch chuyển đổi trước khi tăng.',
    runbook: ['Đo records/bytes theo partition.', 'Kiểm tra cardinality và phân phối key.', 'Tăng partition chỉ sau khi đánh giá ordering và remapping.'],
    keyPoints: ['Ordering chỉ được bảo đảm trong một partition.', 'Một partition có một leader tại một thời điểm.', 'Key skew tạo hotspot dù cluster còn tổng capacity.'],
    misconceptions: ['“Kafka đảm bảo global ordering cho cả topic nhiều partition” — sai.'],
    sourceUrl: 'https://kafka.apache.org/43/design/design/',
    nodes: [n('records', 25, 205, 'Records', 'Keys A / B / C'), n('partitioner', 230, 205, 'Partitioner', 'Key → partition'), n('p0', 500, 60, 'Partition P0', 'Leader B1'), n('p1', 500, 205, 'Partition P1', 'Leader B2'), n('p2', 500, 350, 'Partition P2', 'Leader B3'), n('hot', 750, 205, 'Hot key', 'Skew / overload', 135, 76)],
    edges: [e('to-partitioner','records','partitioner'), e('to-p0','partitioner','p0'), e('to-p1','partitioner','p1'), e('to-p2','partitioner','p2'), e('to-hot','p1','hot')],
    steps: [
      { title:'Record có key', text:'Key xác định ordering domain; không key thường phân phối theo strategy của producer.', activeNodes:['records','partitioner'], activeEdge:'to-partitioner', metrics:{key:'customer-42',ordering_domain:'customer',partitions:'3'}, log:'partitioner key=customer-42' },
      { title:'Key vào một partition', text:'Các event cùng key đi vào P1 và nhận offset tăng dần trong P1.', activeNodes:['partitioner','p1'], activeEdge:'to-p1', metrics:{partition:'P1',offsets:'1842,1843',ordering:'within P1'}, log:'customer-42 -> orders-1' },
      { title:'Scale bằng partition', text:'Các key khác có thể đi P0/P2 để broker xử lý song song.', activeNodes:['p0','p2'], tones:{p0:'good',p2:'good'}, metrics:{parallelism:'3 partitions',global_order:'no',leaders:'B1/B2/B3'}, log:'partition load P0=31% P1=36% P2=33%' },
      { title:'Hot partition', text:'Một key quá nóng làm P1 nghẽn; thêm broker không tự chia một key ra nhiều partition.', activeNodes:['p1','hot'], activeEdge:'to-hot', tones:{p1:'bad',hot:'bad'}, metrics:{p1_records:'18k/s',others:'2k/s',skew:'9×'}, log:'ALERT partition_skew topic=orders partition=1' },
    ],
  },
  {
    id: 'producer', phase: 'Phần II · Data path', title: 'Producer, Replication và ACK', navLabel: 'Producer & ACK',
    question: 'Khi nào producer nhận ACK và ACK đó thực sự bảo đảm điều gì?',
    summary: 'Leader append, follower replication, ISR và cấu hình ACK tạo trade-off latency/availability/durability.',
    story: 'Checkout không được báo thành công nếu record chỉ nằm ở replica không đáp ứng policy durability đã chọn.',
    outcome: 'Giải thích được `acks`, ISR, retry/idempotence và acknowledged-write boundary.',
    checkpoint: '`acks=all` có nghĩa là mọi replica configured đều đã ghi không?',
    checkpointAnswer: 'Không. `acks=all` chờ các replica đang nằm trong ISR theo policy tại thời điểm ghi, kết hợp với `min.insync.replicas`; nó không có nghĩa mọi replica được cấu hình, kể cả replica đang lag hoặc ngoài ISR, đều đã ghi.',
    runbook: ['Kiểm tra producer error/retry và request latency.', 'Đối chiếu `acks`, replication factor, `min.insync.replicas`.', 'Không retry vô hạn; dùng idempotence phù hợp.'],
    keyPoints: ['Leader nhận produce request.', 'ISR chứ không phải mọi configured replica quyết định acknowledged replication.', 'Idempotence giảm duplicate do producer retry trong boundary hỗ trợ.'],
    misconceptions: ['“acks=all luôn là zero data loss” — sai nếu bỏ qua ISR/config/failure sequence.'],
    sourceUrl: 'https://kafka.apache.org/43/design/design/',
    nodes: [n('producer', 25, 205, 'Producer', 'acks=all'), n('leader', 270, 205, 'Leader B1', 'P1 append'), n('follower-a', 555, 80, 'Follower B2', 'In ISR'), n('follower-b', 555, 330, 'Follower B3', 'Out of ISR'), n('ack', 770, 205, 'ACK boundary', 'Policy satisfied', 135, 82)],
    edges: [e('send','producer','leader'), e('replicate-a','leader','follower-a'), e('replicate-b','leader','follower-b'), e('ack','leader','ack')],
    steps: [
      { title:'ProduceRequest tới leader', text:'Producer lấy metadata, chọn P1 và gửi batch tới broker leader.', activeNodes:['producer','leader'], activeEdge:'send', metrics:{acks:'all',batch:'48 records',compression:'zstd'}, log:'send batch orders-1 baseSequence=72' },
      { title:'Follower trong ISR replicate', text:'Follower B2 fetch và append. B3 đang lag nên ngoài ISR, không được tính như replica synchronized.', activeNodes:['leader','follower-a'], activeEdge:'replicate-a', metrics:{isr:'B1,B2',replicas:'B1,B2,B3',follower_lag:'B3=18s'}, log:'ISR=[1,2] replica3 lagging' },
      { title:'ACK theo policy', text:'Leader trả ACK khi điều kiện `acks=all` và `min.insync.replicas` được thỏa tại thời điểm xử lý.', activeNodes:['leader','ack'], activeEdge:'ack', tones:{ack:'good'}, metrics:{min_isr:'2',isr_size:'2',offset:'1842'}, log:'ProduceResponse error=NONE offset=1842' },
      { title:'ISR thiếu: fail rõ ràng', text:'Nếu ISR dưới minimum trước khi append, write bị từ chối với NOT_ENOUGH_REPLICAS. Producer retry có giới hạn và backoff.', activeNodes:['leader','follower-a'], tones:{leader:'bad','follower-a':'bad'}, metrics:{isr_size:'1',required:'2',result:'NOT_ENOUGH_REPLICAS'}, log:'ERROR NOT_ENOUGH_REPLICAS' },
    ],
  },
  {
    id: 'architecture', phase: 'Phần I · Mental model', title: 'Broker, Controller, ZooKeeper và KRaft', navLabel: 'Kiến trúc cluster',
    question: 'Data plane và control plane khác nhau ở đâu, ZooKeeper còn nằm ở đâu?',
    summary: 'Broker phục vụ data request; controller quản lý metadata. KRaft tích hợp control plane vào Kafka và thay dependency ZooKeeper.',
    story: 'Team phải đọc cả cluster legacy và cluster mới mà không vẽ ZooKeeper nằm trên data path.',
    outcome: 'Nhìn topology và chỉ đúng broker, controller, data path, metadata path và migration boundary.',
    checkpoint: 'Producer có gửi record qua ZooKeeper hoặc KRaft controller không?',
    checkpointAnswer: 'Không. Producer gửi record trực tiếp tới broker leader của partition. ZooKeeper hoặc KRaft controller quản lý metadata và leader election, không nằm trên data path của payload record.',
    runbook: ['Xác nhận cluster đang chạy KRaft hay ZooKeeper mode.', 'Giám sát broker data plane và controller quorum riêng.', 'Migration ZooKeeper → KRaft phải theo tài liệu đúng version.'],
    keyPoints: ['Broker luôn là thành phần cốt lõi.', 'ZooKeeper là kiến thức legacy/migration, không vận chuyển record.', 'KRaft controller quorum dùng Raft để quản lý metadata.'],
    misconceptions: ['“Kafka mới vẫn bắt buộc ZooKeeper” — sai trong KRaft mode.', '“Controller nằm trên đường producer gửi record” — sai; đó là control plane.'],
    sourceUrl: 'https://kafka.apache.org/43/getting-started/zk2kraft/',
    nodes: [n('client', 25, 205, 'Kafka clients', 'Produce / fetch'), n('broker-a', 265, 95, 'Broker 1', 'Data plane'), n('broker-b', 265, 315, 'Broker 2', 'Data plane'), n('controller-quorum', 610, 70, 'KRaft controllers', 'Metadata quorum', 190, 82), n('zookeeper', 610, 315, 'ZooKeeper', 'Legacy coordination', 190, 82)],
    edges: [e('client-broker','client','broker-a','records'), e('kraft-metadata','controller-quorum','broker-a','metadata'), e('zk-metadata','zookeeper','broker-b','legacy metadata'), e('replicate','broker-a','broker-b','replicate')],
    steps: [
      { title:'KRaft: record đi tới broker', text:'Client produce/fetch trực tiếp với broker. Controller quorum không nhận payload event.', activeNodes:['client','broker-a'], activeEdge:'client-broker', mode:'kraft', metrics:{mode:'KRaft',data_plane:'broker',controller_payload:'none'}, log:'ProduceRequest -> broker-1' },
      { title:'KRaft: controller quản lý metadata', text:'Controller quorum quản lý broker registration, topic/partition metadata và leader election bằng Raft.', activeNodes:['controller-quorum','broker-a'], activeEdge:'kraft-metadata', mode:'kraft', metrics:{quorum:'3 controllers',leader:'controller-2',metadata_lag:'0'}, log:'controller leader=2 high-watermark=941' },
      { title:'ZooKeeper: kiến trúc legacy', text:'Ở ZooKeeper mode, coordination/metadata thuộc kiến trúc cũ; client vẫn gửi record tới broker.', activeNodes:['zookeeper','broker-b'], activeEdge:'zk-metadata', mode:'zookeeper', metrics:{mode:'ZooKeeper legacy',data_plane:'broker',migration:'plan required'}, log:'legacy cluster metadata coordination' },
      { title:'So sánh đúng boundary', text:'Đổi control plane không biến broker thành tùy chọn: partition và replica vẫn nằm trên broker.', activeNodes:['broker-a','broker-b'], activeEdge:'replicate', mode:'kraft', tones:{'broker-a':'good','broker-b':'good'}, metrics:{brokers:'2',controller_role:'separate',zookeeper:'not required'}, log:'KRaft mode: broker data path healthy' },
    ],
  },
  {
    id: 'consumer', phase: 'Phần III · Consumption', title: 'Consumer Group, Offset và Replay', navLabel: 'Consumer & offset',
    question: 'Processing và offset commit phải phối hợp thế nào để tránh mất hoặc trùng dữ liệu?',
    summary: 'Mỗi group có assignment và committed offset riêng; commit timing quyết định replay/duplicate boundary.',
    story: 'Inventory xử lý record rồi ghi database; crash giữa side effect và commit tạo duplicate khi đọc lại.',
    outcome: 'Đọc đúng current position, committed offset và lag; thiết kế consumer idempotent.',
    checkpoint: 'Commit offset trước khi side effect hoàn tất có rủi ro gì?',
    checkpointAnswer: 'Có nguy cơ mất xử lý. Nếu consumer commit offset rồi crash trước khi side effect hoàn tất, lần chạy sau sẽ tiếp tục từ offset mới và thường không đọc lại record chưa xử lý xong.',
    runbook: ['So sánh latest offset, current position và committed offset.', 'Kiểm tra processing latency/downstream.', 'Replay bằng group/offset có change record và approval.'],
    keyPoints: ['Một partition chỉ do một consumer trong cùng group xử lý tại một thời điểm.', 'Commit không xóa record.', 'At-least-once thường đòi hỏi side effect idempotent.'],
    misconceptions: ['“Consumer đọc record là Kafka tự commit an toàn” — sai; policy/timing commit quyết định.'],
    sourceUrl: 'https://kafka.apache.org/43/design/design/',
    nodes: [n('partition', 25, 205, 'Partition P1', 'Offsets 1840..1845'), n('consumer', 280, 205, 'Consumer C1', 'Group inventory'), n('database', 550, 85, 'Inventory DB', 'Side effect'), n('offset', 550, 325, 'Committed offset', 'Group metadata'), n('replay', 775, 205, 'Replay', 'Read again', 120, 76)],
    edges: [e('fetch','partition','consumer'), e('process','consumer','database'), e('commit','consumer','offset'), e('replay','offset','replay')],
    steps: [
      { title:'Fetch record', text:'C1 fetch offset 1842; current position có thể đi trước committed offset.', activeNodes:['partition','consumer'], activeEdge:'fetch', metrics:{fetched:'1842',committed:'1841',lag:'3'}, log:'fetch orders-1@1842' },
      { title:'Thực hiện side effect', text:'Consumer cập nhật inventory bằng event ID/idempotency key để retry không trừ kho hai lần.', activeNodes:['consumer','database'], activeEdge:'process', metrics:{event_id:'evt-991',db_result:'updated',idempotent:'yes'}, log:'inventory apply evt-991' },
      { title:'Commit sau processing', text:'Sau side effect thành công, group commit offset kế tiếp. Đây là boundary application phải hiểu.', activeNodes:['consumer','offset'], activeEdge:'commit', tones:{offset:'good'}, metrics:{commit:'1843',meaning:'next record',lag:'2'}, log:'OffsetCommit orders-1=1843' },
      { title:'Crash trước commit → replay', text:'Nếu crash sau DB write nhưng trước commit, record được đọc lại; idempotency biến duplicate delivery thành kết quả đúng.', activeNodes:['offset','replay'], activeEdge:'replay', tones:{replay:'warn'}, metrics:{delivery:'duplicate possible',data_loss:'avoided',action:'deduplicate'}, log:'replay evt-991 -> already applied' },
    ],
  },
  {
    id: 'rebalance', phase: 'Phần III · Consumption', title: 'Rebalance và Backpressure', navLabel: 'Rebalance & lag',
    question: 'Vì sao thêm consumer đôi khi không giảm lag mà còn tạo pause liên tục?',
    summary: 'Membership/assignment thay đổi gây revoke/assign; throughput bị giới hạn bởi partition và downstream.',
    story: 'Deploy rolling làm consumer churn trong lúc inventory database chậm, tạo rebalance storm và lag tăng.',
    outcome: 'Phân biệt lag do capacity với lag do rebalance/downstream và chọn mitigation đúng.',
    checkpoint: 'Sáu partition với tám consumer có bao nhiêu consumer có thể xử lý song song?',
    checkpointAnswer: 'Tối đa sáu consumer trong cùng consumer group có thể xử lý song song, vì mỗi partition chỉ được gán cho một consumer trong group tại một thời điểm. Hai consumer còn lại sẽ idle.',
    runbook: ['Khoanh timeline deploy/crash và rebalance.', 'Đo consume rate, processing time, lag theo partition.', 'Ổn định membership/downstream trước khi tăng timeout hoặc scale.'],
    keyPoints: ['Rebalance tạm dừng hoặc thay đổi ownership.', 'Consumer hữu ích không vượt partition count trong group.', 'Backpressure thường bắt đầu ở downstream, không phải broker.'],
    misconceptions: ['“Lag cao cứ thêm consumer là hết” — sai khi hết partition hoặc downstream nghẽn.'],
    sourceUrl: 'https://kafka.apache.org/43/operations/consumer-rebalance-protocol/',
    nodes: [n('group', 25, 205, 'Consumer group', '6 partitions'), n('c1', 265, 70, 'Consumer C1', 'P0,P1'), n('c2', 265, 205, 'Consumer C2', 'P2,P3'), n('c3', 265, 340, 'Consumer C3', 'P4,P5'), n('coordinator', 560, 205, 'Group coordinator', 'Membership / assignment', 190, 82), n('downstream', 790, 205, 'Downstream', 'Slow database', 120, 82)],
    edges: [e('join','group','coordinator'), e('assign','coordinator','c2'), e('process','c2','downstream'), e('rejoin','c1','coordinator')],
    steps: [
      { title:'Downstream chậm', text:'Processing time tăng làm consume rate thấp hơn ingress; lag tăng dù broker khỏe.', activeNodes:['c2','downstream'], activeEdge:'process', tones:{downstream:'bad'}, metrics:{ingress:'8k/s',consume:'5.5k/s',lag:'+2.5k/s'}, log:'inventory-db p99=920ms' },
      { title:'Member rời group', text:'C1 vượt processing/heartbeat boundary hoặc restart; coordinator bắt đầu thay đổi membership.', activeNodes:['c1','coordinator'], activeEdge:'rejoin', tones:{c1:'warn','coordinator':'warn'}, metrics:{members:'3→2',reason:'max.poll interval',state:'reconciling'}, log:'member c1 left group inventory' },
      { title:'Revoke và assign', text:'Partition ownership được thu hồi/gán lại theo protocol; processing có thể pause trong transition.', activeNodes:['coordinator','c2'], activeEdge:'assign', metrics:{revoked:'P0,P1',assigned:'C2',pause:'1.8s'}, log:'assignment epoch=91 P0,P1 -> c2' },
      { title:'Ổn định trước khi scale', text:'Sửa downstream/deploy churn; thêm consumer thứ 7 không giúp nếu chỉ có 6 partition.', activeNodes:['group','c1','c2','c3'], tones:{group:'good'}, metrics:{partitions:'6',active_consumers:'3',max_useful:'6'}, log:'group stable lag recovery ETA=6m' },
    ],
  },
  {
    id: 'failure', phase: 'Phần IV · Failure path', title: 'Broker và Controller Failure', navLabel: 'Failure & recovery',
    question: 'Leader broker chết thì controller, ISR và client phối hợp phục hồi như thế nào?',
    summary: 'Controller chọn leader hợp lệ từ replica state; client refresh metadata rồi retry có giới hạn.',
    story: 'Broker B1 giữ leader P1 bị mất nguồn. Cluster phải phục hồi mà không mô tả record “tự nhảy”.',
    outcome: 'Theo đúng thứ tự detect → election → metadata → client recovery và biết khi nào không thể bầu leader an toàn.',
    checkpoint: 'Nếu không còn replica eligible/in-sync, availability và durability trade-off là gì?',
    checkpointAnswer: 'Giữ yêu cầu leader/ISR nghiêm ngặt sẽ làm partition tạm thời không ghi được nhưng bảo vệ dữ liệu đã ACK. Cho phép unclean leader election có thể khôi phục availability nhanh hơn, đổi lại có nguy cơ mất các record chưa có trên replica được bầu.',
    runbook: ['Xác nhận broker/controller quorum và affected partitions.', 'Kiểm tra ISR/eligible replica trước election.', 'Theo dõi client errors, URP và recovery; giữ rollback/fencing.'],
    keyPoints: ['Failover phụ thuộc replica state thật.', 'Client cần metadata refresh.', 'KRaft quorum là control plane; broker là data plane.'],
    misconceptions: ['“Broker chết thì Kafka luôn tự hồi phục không mất availability” — sai nếu replica/quorum không đủ.'],
    sourceUrl: 'https://kafka.apache.org/43/operations/kraft/',
    nodes: [n('client', 20, 205, 'Clients', 'Cached metadata'), n('leader', 245, 205, 'Broker B1', 'P1 leader'), n('follower', 500, 70, 'Broker B2', 'P1 in ISR'), n('lagging', 500, 340, 'Broker B3', 'P1 out of ISR'), n('controller', 750, 205, 'KRaft quorum', 'Elect + publish', 150, 82)],
    edges: [e('client-leader','client','leader'), e('replicate','leader','follower'), e('detect','leader','controller'), e('elect','controller','follower'), e('refresh','follower','client')],
    steps: [
      { title:'Leader failure', text:'B1 ngừng phục vụ; client request lỗi/timeout trong budget, không retry vô hạn.', activeNodes:['client','leader'], activeEdge:'client-leader', tones:{leader:'bad',client:'warn'}, metrics:{leader:'B1 down',client_errors:'rising',isr:'B1,B2'}, log:'broker-1 disconnected ProduceRequest timeout' },
      { title:'Controller quan sát failure', text:'Control plane cập nhật broker registration/state và xác định replica eligible.', activeNodes:['leader','controller'], activeEdge:'detect', tones:{controller:'warn'}, metrics:{controller_quorum:'2/3 healthy',candidate:'B2',B3:'out of ISR'}, log:'broker 1 fenced; election required P1' },
      { title:'Bầu B2 làm leader', text:'B2 đang in-sync được chọn; B3 ngoài ISR không được vẽ như ACK-safe replica.', activeNodes:['controller','follower'], activeEdge:'elect', tones:{follower:'good'}, metrics:{new_leader:'B2',epoch:'44',unclean:'false'}, log:'partition orders-1 leader=2 epoch=44' },
      { title:'Client refresh metadata', text:'Producer/consumer nhận metadata mới và tiếp tục với B2; theo dõi URP cho tới khi replica hồi.', activeNodes:['follower','client'], activeEdge:'refresh', tones:{client:'good','follower':'good'}, metrics:{availability:'restored',urp:'1',recovery:'in progress'}, log:'metadata refresh leader=broker-2' },
    ],
  },
  {
    id: 'production', phase: 'Phần V · Production', title: 'Production Pain Lab', navLabel: 'Production pain lab',
    question: 'Khi Kafka báo chậm, làm sao đi từ symptom tới evidence thay vì restart hoặc scale theo cảm tính?',
    summary: 'Một incident board kết nối lag, rebalance, skew, disk, ISR và KRaft quorum với impact/runbook.',
    story: 'ShopNow gặp lag tăng sau deploy trong khi một partition nóng, disk B2 gần đầy và ISR bắt đầu co.',
    outcome: 'Ưu tiên incident theo user impact, xác định bottleneck đúng lớp và chọn mitigation reversible.',
    checkpoint: 'Metric nào phân biệt consumer chậm với broker replication đang degraded?',
    checkpointAnswer: 'Consumer chậm thường thể hiện qua consumer lag tăng, processing latency cao hoặc consume rate thấp. Broker replication degraded thể hiện qua under-replicated partitions, ISR shrink, replica lag và lỗi/độ trễ replication; cần nhìn hai nhóm metric riêng.',
    runbook: ['Scope impact và timeline deploy/traffic/config.', 'Đi theo producer → broker/partition → consumer → downstream.', 'Mitigate có rollback; ghi permanent fix và game day.'],
    keyPoints: ['Dashboard phải phản ánh data path lẫn control plane.', 'Thêm broker/consumer không tự chữa skew hoặc downstream bottleneck.', 'Capacity gồm ingress × retention × replication và headroom recovery.'],
    misconceptions: ['“CPU cluster trung bình thấp nghĩa là cluster khỏe” — sai khi một partition/broker đang nóng.'],
    sourceUrl: 'https://kafka.apache.org/43/operations/monitoring/',
    painIds: ['consumer-lag','rebalance-storm','hot-partition','disk-pressure','under-replicated','controller-quorum'],
    nodes: [n('alert', 20, 205, 'User impact', 'Orders delayed'), n('lag', 220, 55, 'Consumer lag', 'Backlog ↑'), n('skew', 220, 205, 'Hot partition', 'P1 overload'), n('disk', 220, 355, 'Disk pressure', 'Broker B2 91%'), n('isr', 520, 95, 'ISR / URP', 'Replication risk'), n('rebalance', 520, 315, 'Rebalance', 'Members unstable'), n('action', 770, 205, 'Mitigation', 'Safe + reversible', 130, 82)],
    edges: [e('scope-lag','alert','lag'), e('scope-skew','alert','skew'), e('disk-isr','disk','isr'), e('lag-rebalance','lag','rebalance'), e('isr-action','isr','action'), e('rebalance-action','rebalance','action')],
    steps: [
      { title:'Scope symptom, không đoán nguyên nhân', text:'Orders trễ 12 phút; khoanh consumer group, partition và thời điểm deploy trước.', activeNodes:['alert','lag'], activeEdge:'scope-lag', tones:{lag:'bad'}, metrics:{lag:'125k',delay:'12m',scope:'inventory / P1'}, log:'ALERT ConsumerLagHigh group=inventory' },
      { title:'Phát hiện hot partition', text:'P1 nhận 68% traffic do key skew. Cluster CPU trung bình che giấu broker hotspot.', activeNodes:['alert','skew'], activeEdge:'scope-skew', tones:{skew:'bad'}, metrics:{P1:'18k rec/s',others:'2k rec/s',broker_cpu:'94%'}, log:'partition_skew orders-1 ratio=9.0' },
      { title:'Disk pressure làm ISR co', text:'B2 disk/network chậm khiến follower lag và under-replicated partition tăng.', activeNodes:['disk','isr'], activeEdge:'disk-isr', tones:{disk:'bad',isr:'warn'}, metrics:{disk:'91%',urp:'14',isr_shrink:'9/min'}, log:'ISR shrink orders-1 [1,2] -> [1]' },
      { title:'Mitigation evidence-first', text:'Giảm deploy churn, bảo vệ downstream, throttle reassignment và xử lý disk; key redesign là permanent fix.', activeNodes:['isr','action'], activeEdge:'isr-action', tones:{action:'good'}, metrics:{lag_rate:'falling',urp:'14→3',rollback:'ready'}, log:'mitigation applied; recovery ETA=8m' },
    ],
  },
];

const chapterOrder = [
  'overview',
  'api-flow',
  'components',
  'architecture',
  'partitioning',
  'producer',
  'consumer',
  'rebalance',
  'failure',
  'production',
] as const;

const registryById = new Map(chapterRegistry.map((chapter) => [chapter.id, chapter]));

export const kafkaChapters: KafkaChapter[] = chapterOrder.map((id) => {
  const chapter = registryById.get(id);
  if (!chapter) throw new Error(`Missing Kafka chapter: ${id}`);
  return chapter;
});

export const kafkaChapterById = new Map(kafkaChapters.map((chapter) => [chapter.id, chapter]));
