export type RedisTone = 'good' | 'warn' | 'bad';

export type RedisNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
};

export type RedisEdge = { id: string; from: string; to: string };

export type RedisStep = {
  title: string;
  text: string;
  activeNodes: string[];
  activeEdges?: string[];
  tones?: Record<string, RedisTone>;
  metrics: Record<string, string>;
  log: string;
};

export type RedisChapter = {
  id: string;
  phase: string;
  title: string;
  navLabel: string;
  question: string;
  summary: string;
  story: string;
  from: string;
  goal: string;
  next: string;
  outcome: string;
  checkpoint: string;
  questions: string[];
  keyPoints: string[];
  misconceptions: string[];
  nodes: RedisNode[];
  edges: RedisEdge[];
  steps: RedisStep[];
};

const n = (id: string, x: number, y: number, title: string, sub: string, w = 170, h = 82): RedisNode => ({ id, x, y, w, h, title, sub });
const e = (id: string, from: string, to: string): RedisEdge => ({ id, from, to });

export const redisChapters: RedisChapter[] = [
  {
    id: 'overview', phase: 'Bắt đầu', title: 'Bản đồ hành trình Redis', navLabel: 'Bản đồ hành trình',
    question: 'Redis đang giải quyết requirement nào, topology gì, chạy ở đâu và ai chịu trách nhiệm vận hành?',
    summary: 'Tách bốn quyết định thường bị trộn lẫn: requirement, topology, platform và operating model.',
    story: 'ShopNow bị database quá tải khi người dùng xem sản phẩm. Trước khi chọn công nghệ, đội ngũ phải xác định availability, dataset, throughput, RPO/RTO và failure domain.',
    from: 'Không cần kiến thức Redis trước đó.',
    goal: 'Phân biệt yêu cầu workload với topology, platform và người vận hành.',
    next: 'Đặt Redis vào request flow thực tế để thấy cache hit, miss và tải database.',
    outcome: 'Nhìn một thiết kế và chỉ ra đúng bốn lớp quyết định.',
    checkpoint: 'Kubernetes và Sentinel có phải hai lựa chọn cùng một tầng không?',
    questions: ['Workload cần HA, sharding hay multi-region write?', 'Dataset và throughput có vừa một node không?', 'Ai chịu trách nhiệm failover, backup, patching và capacity?'],
    keyPoints: ['Topology mô tả quan hệ giữa các Redis node.', 'VM/Kubernetes/cloud là platform, không phải topology.', 'Managed/serverless mô tả responsibility split, không loại bỏ trách nhiệm về data model và client.'],
    misconceptions: ['“Redis Cluster, Kubernetes và Managed Redis là ba topology ngang hàng” — sai; chúng thuộc ba chiều khác nhau.'],
    nodes: [n('req', 35, 210, 'Requirements', 'HA / scale / RPO-RTO'), n('topology', 275, 70, 'Topology', 'Standalone / Sentinel / Cluster'), n('platform', 275, 350, 'Platform', 'VM / Kubernetes / cloud'), n('operator', 535, 350, 'Operating model', 'Self / managed / serverless'), n('design', 720, 190, 'Final design', 'Ghép đủ các chiều', 165, 100)],
    edges: [e('e1','req','topology'), e('e2','req','platform'), e('e3','platform','operator'), e('e4','topology','design'), e('e5','operator','design')],
    steps: [
      {title:'Bắt đầu từ workload', text:'Đo downtime chấp nhận được, dataset, write throughput, RPO/RTO và số region trước khi gọi tên sản phẩm.', activeNodes:['req'], metrics:{rto:'60 s',rpo:'5 s',dataset:'20 GB'}, log:'requirements captured\nregions=1'},
      {title:'Chọn topology', text:'Standalone, primary–replica, Sentinel và Cluster giải quyết các failure/scale problem khác nhau.', activeNodes:['req','topology'], activeEdges:['e1'], metrics:{dimension:'topology',candidate:'Sentinel',sharding:'no'}, log:'topology=sentinel'},
      {title:'Chọn platform và operator', text:'VM/Kubernetes là nơi chạy; self-managed/managed/serverless là ai sở hữu toil.', activeNodes:['platform','operator'], activeEdges:['e2','e3'], metrics:{platform:'Kubernetes',operator:'team + operator',toil:'shared'}, log:'platform=kubernetes\noperating_model=self-managed'},
      {title:'Ghép thành thiết kế', text:'Ví dụ: Sentinel trên VM do team tự vận hành, hoặc Cluster trên cloud do provider quản lý.', activeNodes:['topology','operator','design'], activeEdges:['e4','e5'], tones:{design:'good'}, metrics:{decision:'explicit',failure_domains:'documented',runbook:'required'}, log:'design review: PASS'}
    ]
  },
  {
    id:'cache', phase:'Phần I · Nền tảng', title:'Redis trong request flow', navLabel:'Request flow & cache',
    question:'Cache-aside vận hành thế nào và chọn TTL dựa trên freshness, tải database và stampede risk ra sao?',
    summary:'Theo request qua cache hit/miss, TTL jitter, database fallback và stampede protection.',
    story:'ShopNow đặt Redis trước database để giảm truy vấn catalog. Redis chỉ hữu ích khi failure flow và source of truth được thiết kế rõ.',
    from:'Đã biết Redis phải phục vụ một requirement cụ thể.', goal:'Hiểu cache-aside, hit/miss, TTL và cache stampede.', next:'Triển khai một Redis Standalone tối giản để quan sát failure domain đầu tiên.',
    outcome:'Mô tả được request khi hit, miss và Redis unavailable.', checkpoint:'Nếu Redis mất toàn bộ key, hệ thống có tái tạo từ database được không?',
    questions:['Redis là cache hay source of truth?', 'TTL có jitter và phù hợp freshness budget không?', 'Cache miss đồng loạt có làm database quá tải không?'],
    keyPoints:['Cache-aside để application chủ động đọc/ghi cache.', 'TTL phải xuất phát từ freshness budget và khả năng chịu tải khi miss.', 'Lock/single-flight, stale-while-revalidate và TTL jitter giảm stampede.'],
    misconceptions:['“Hit ratio càng cao luôn càng tốt” — sai nếu key stale, memory quá lớn hoặc DB fallback chưa được kiểm chứng.'],
    nodes:[n('client',35,210,'Client','HTTP request',145,72),n('app',255,210,'Application','Cache-aside',155,72),n('redis',515,90,'Redis','GET / SET EX',155,78),n('db',515,330,'Database','Source of truth',155,78),n('guard',735,330,'Single-flight','Stampede guard',145,78)],
    edges:[e('e1','client','app'),e('e2','app','redis'),e('e3','redis','app'),e('e4','app','db'),e('e5','db','app'),e('e6','app','guard'),e('e7','app','redis')],
    steps:[
      {title:'Tạo cache key ổn định',text:'Application nhận request và tạo key có namespace/version, ví dụ product:v2:42.',activeNodes:['client','app'],activeEdges:['e1'],metrics:{db_qps:'120',hit_ratio:'—',timeout:'20 ms'},log:'GET /products/42'},
      {title:'Cache hit',text:'GET trả dữ liệu trong freshness budget; đo cả client latency và server latency.',activeNodes:['app','redis'],activeEdges:['e2','e3'],tones:{redis:'good'},metrics:{hit_ratio:'92%',redis_p99:'3.1 ms',db_qps:'120'},log:'GET product:v2:42 -> HIT'},
      {title:'Cache miss',text:'Key chưa có hoặc hết TTL. Retry Redis vô hạn chỉ kéo dài latency và khuếch đại sự cố.',activeNodes:['redis','app'],activeEdges:['e3'],tones:{redis:'warn'},metrics:{hit_ratio:'88%',redis_p99:'4.0 ms',db_qps:'360'},log:'GET product:v2:42 -> nil'},
      {title:'Chặn stampede',text:'Một worker tải dữ liệu; worker khác chờ có giới hạn hoặc dùng stale value. Lock phải có lease timeout và chỉ được release bằng compare-and-delete đúng token để worker cũ không xóa lock mới.',activeNodes:['app','guard'],activeEdges:['e6'],tones:{guard:'warn'},metrics:{lock_ttl:'3 s',wait_budget:'80 ms',db_qps:'180'},log:'SET lock:product:42 token NX PX 3000\n# release only when token matches'},
      {title:'Đọc source of truth',text:'Database vẫn phải sống được khi cache miss tăng; circuit breaker và load shedding cần có.',activeNodes:['app','db'],activeEdges:['e4','e5'],metrics:{db_p99:'42 ms',db_qps:'181',fallback:'healthy'},log:'SELECT ... WHERE id=42'},
      {title:'Ghi cache với TTL jitter',text:'Chọn base TTL không vượt freshness budget; áp dụng jitter trong biên sao cho TTL cuối cùng vẫn không vượt stale limit tối đa.',activeNodes:['app','redis'],activeEdges:['e7'],tones:{redis:'good'},metrics:{freshness_budget:'4000 s',base_ttl:'3600 s',jitter:'0..+10%'},log:'SET product:v2:42 {...} EX 3727'}
    ]
  },
  {
    id:'standalone', phase:'Phần I · Nền tảng', title:'Redis Standalone đầu tiên', navLabel:'Standalone',
    question:'Một Redis node đủ dùng khi nào, và persistence có loại bỏ single point of failure không?',
    summary:'Một endpoint đơn giản, dễ debug nhưng không có automatic failover.', story:'ShopNow bắt đầu bằng một Redis process để học data path và failure flow trước khi thêm HA.',
    from:'Request flow đã rõ.',goal:'Hiểu ưu điểm, giới hạn và recovery của một node.',next:'Quản lý giới hạn RAM và eviction trước khi nghĩ tới cluster.',outcome:'Chọn đúng Standalone cho dev/test, CI ephemeral hoặc workload chịu downtime.',checkpoint:'RDB/AOF có biến một node thành high availability không?',
    questions:['Node chết thì application fallback hay dừng?', 'Dữ liệu tái tạo được hay cần persistence/backup?', 'Manual RTO có đạt SLO không?'],
    keyPoints:['Standalone có một failure domain và một write path.', 'Persistence hỗ trợ durability/restart, không tạo HA.', 'Production critical thường cần replica và cơ chế failover.'],misconceptions:['“Có persistent disk là đã HA” — sai; endpoint vẫn down khi process/node không phục vụ.'],
    nodes:[n('app',45,210,'Application','Single endpoint',150,76),n('redis',340,195,'Redis Standalone','One process / node',180,92),n('disk',670,75,'RDB / AOF','Optional durability',165,82),n('failure',670,340,'Node failure','No automatic failover',165,82),n('operator',340,370,'Operator','Restart / restore',180,76)],
    edges:[e('e1','app','redis'),e('e2','redis','disk'),e('e3','redis','failure'),e('e4','failure','operator'),e('e5','operator','redis')],
    steps:[
      {title:'Một endpoint',text:'Mọi read/write đi qua một process: đơn giản, latency thấp và dễ troubleshoot.',activeNodes:['app','redis'],activeEdges:['e1'],metrics:{nodes:'1',failover:'none',write_path:'single'},log:'redis://redis-01:6379'},
      {title:'Persistence tùy chọn',text:'RDB/AOF giúp restart nhưng vẫn cùng failure domain nếu file chỉ nằm trên node.',activeNodes:['redis','disk'],activeEdges:['e2'],metrics:{aof:'everysec',ha:'no',backup:'separate'},log:'appendonly yes'},
      {title:'Node down',text:'Endpoint mất hoàn toàn; application phải fail open/closed theo data semantics.',activeNodes:['redis','failure'],activeEdges:['e3'],tones:{redis:'bad',failure:'bad'},metrics:{availability:'down',failover:'manual',data_path:'unavailable'},log:'ECONNREFUSED redis-01:6379'},
      {title:'Operator recovery',text:'Runbook thay node, attach storage hoặc restore backup; thời gian này chính là RTO thực tế.',activeNodes:['failure','operator'],activeEdges:['e4'],tones:{operator:'warn'},metrics:{rto:'operator-dependent',rpo:'persistence-dependent',automation:'low'},log:'restore dump.rdb\nstart redis-server'},
      {title:'Reconnect',text:'Client dùng bounded retry/backoff; không tạo retry storm khi Redis trở lại.',activeNodes:['operator','redis','app'],activeEdges:['e5','e1'],tones:{redis:'good',app:'good'},metrics:{availability:'up',risk:'SPOF',retries:'bounded'},log:'PING -> PONG'}
    ]
  },
  {
    id:'memory',phase:'Phần I · Nền tảng',title:'Memory và eviction',navLabel:'Memory & eviction',
    question:'maxmemory và eviction policy phải chọn theo dataset, headroom và data semantics như thế nào?',summary:'Từ used_memory/RSS đến eviction hoặc OOM error khi RAM đầy.',story:'Catalog ShopNow tăng nhanh. Redis cần RAM cho dataset, allocator, buffers, replication và persistence fork.',from:'Đã có một node thật.',goal:'Hiểu memory budget, headroom và policy.',next:'Giải quyết durability bằng RDB/AOF và restore test.',outcome:'Đặt alert/capacity và policy phù hợp cache hay dữ liệu quan trọng.',checkpoint:'Vì sao maxmemory không nên bằng toàn bộ RAM?',
    questions:['Headroom có đủ cho fork/replication/client buffers không?', 'Policy có phù hợp cache hay source-of-truth-like data?', 'Có key không TTL hoặc big key ngoài dự kiến không?'],keyPoints:['used_memory và RSS khác nhau do allocator/fragmentation.', 'allkeys-lfu/lru thường hợp cache; noeviction trả lỗi write khi đầy.', 'evicted_keys tăng là symptom capacity, TTL hoặc data-model cần điều tra.'],misconceptions:['“Redis chỉ dùng RAM đúng bằng tổng kích thước value” — sai; còn key, metadata, allocator và buffers.'],
    nodes:[n('traffic',45,215,'Write traffic','Dataset grows',145,72),n('memory',290,85,'Redis memory','used_memory / RSS',190,88),n('limit',290,335,'maxmemory','Configured budget',190,88),n('policy',600,85,'Eviction policy','LFU / LRU / noeviction',195,88),n('result',600,335,'Outcome','Evict key / OOM',195,88)],edges:[e('e1','traffic','memory'),e('e2','memory','limit'),e('e3','limit','policy'),e('e4','policy','result'),e('e5','result','traffic')],
    steps:[
      {title:'Đo memory đúng lớp',text:'Theo dõi used_memory, used_memory_rss, fragmentation, buffers và keyspace.',activeNodes:['traffic','memory'],activeEdges:['e1'],metrics:{used_memory:'5.8 GB',rss:'6.5 GB',fragmentation:'1.12'},log:'INFO memory'},
      {title:'Chọn maxmemory có headroom',text:'Dành RAM cho OS, allocator, replica/client buffers và fork copy-on-write khi RDB/AOF rewrite.',activeNodes:['memory','limit'],activeEdges:['e2'],tones:{memory:'warn'},metrics:{ram:'12 GB',maxmemory:'8 GB',headroom:'4 GB'},log:'maxmemory 8gb'},
      {title:'Chọn policy theo semantics',text:'Cache có thể evict; dữ liệu không được tự mất nên dùng noeviction và xử lý write error/capacity.',activeNodes:['limit','policy'],activeEdges:['e3'],tones:{policy:'warn'},metrics:{policy:'allkeys-lfu',ttl_coverage:'94%',dataset:'cache'},log:'maxmemory-policy allkeys-lfu'},
      {title:'Eviction bắt đầu',text:'Theo dõi evicted_keys rate cùng hit ratio và DB QPS, không chỉ số tích lũy.',activeNodes:['policy','result'],activeEdges:['e4'],tones:{result:'warn'},metrics:{evicted_keys_rate:'31/s',hit_ratio:'84%',db_qps:'+38%'},log:'evicted_keys:+1842'},
      {title:'Kiểm chứng application behavior',text:'Cache miss phải fallback có kiểm soát; noeviction phải biến OOM thành lỗi rõ thay vì retry vô hạn.',activeNodes:['result','traffic'],activeEdges:['e5'],tones:{traffic:'good'},metrics:{fallback:'bounded',alerts:'active',capacity_review:'open'},log:'SET result=OK\ncache miss fallback=healthy'}
    ]
  },
  {
    id:'persistence',phase:'Phần I · Nền tảng',title:'Persistence, backup và restore',navLabel:'Persistence & backup',question:'RDB, AOF và backup khác nhau thế nào, chọn theo RPO/RTO ra sao?',summary:'Durability trong node, bản sao ngoài failure domain và restore rehearsal.',story:'ShopNow muốn cart/session sống qua restart nhưng không nhầm persistence với backup hoặc HA.',from:'Đã quản lý memory budget.',goal:'Phân biệt RDB, AOF, backup và restore.',next:'Thêm replica để có bản sao đang chạy.',outcome:'Thiết kế RPO/RTO và restore test đo được.',checkpoint:'AOF có cứu được dữ liệu khi application DEL nhầm và lệnh đã được append không?',questions:['RPO chấp nhận mất bao nhiêu?', 'Backup có ở ngoài node/cluster/account failure domain?', 'Restore gần nhất mất bao lâu và đã verify data chưa?'],keyPoints:['RDB là snapshot theo thời điểm; AOF log write operation.', 'AOF everysec thường có RPO xấp xỉ giây nhưng không phải zero-loss guarantee.', 'Backup chỉ có giá trị sau restore rehearsal và verification.'],misconceptions:['“AOF là backup” — sai; corruption, operator error hoặc delete hợp lệ có thể được ghi vào AOF.'],
    nodes:[n('app',45,215,'Application','Writes',145,72),n('ram',270,205,'Redis RAM','Live dataset',160,82),n('rdb',530,75,'RDB','Point-in-time snapshot',165,82),n('aof',530,340,'AOF','Write operation log',165,82),n('backup',745,205,'External backup','Separate failure domain',145,82)],edges:[e('e1','app','ram'),e('e2','ram','rdb'),e('e3','ram','aof'),e('e4','rdb','backup'),e('e5','aof','backup'),e('e6','backup','ram')],
    steps:[
      {title:'Write trước tiên ở RAM',text:'Persistence bổ sung durability nhưng có performance/capacity cost.',activeNodes:['app','ram'],activeEdges:['e1'],metrics:{rpo:'undefined',rto:'undefined',durability:'memory only'},log:'SET cart:123 ...'},
      {title:'RDB snapshot',text:'BGSAVE tạo snapshot; RPO phụ thuộc khoảng snapshot và fork có thể tăng memory/latency.',activeNodes:['ram','rdb'],activeEdges:['e2'],tones:{rdb:'good'},metrics:{snapshot_interval:'5 min',fork_time:'18 ms',target_rpo:'≈5 min nếu snapshot hoàn tất và restore dùng được'},log:'BGSAVE started'},
      {title:'AOF append',text:'appendfsync everysec cân bằng durability/performance; AOF rewrite cần disk và fork headroom.',activeNodes:['ram','aof'],activeEdges:['e3'],tones:{aof:'good'},metrics:{fsync:'everysec',target_rpo:'~1 s khi fsync healthy; phải test',rewrite:'scheduled'},log:'appendonly yes\nappendfsync everysec'},
      {title:'Backup ngoài failure domain',text:'Copy artifact/versioned backup sang storage độc lập; mã hóa, retention và access control.',activeNodes:['rdb','aof','backup'],activeEdges:['e4','e5'],tones:{backup:'good'},metrics:{retention:'30 days',offsite:'yes',encrypted:'yes'},log:'upload backup to object storage'},
      {title:'Restore rehearsal',text:'Khôi phục instance mới, đo RTO, kiểm tra key count/sample và application read.',activeNodes:['backup','ram'],activeEdges:['e6'],tones:{ram:'good'},metrics:{restore_rto:'11 min',verification:'PASS',last_test:'7 days'},log:'DB loaded from disk\nrestore verification PASS'}
    ]
  },
  {
    id:'primary-replica',phase:'Phần II · High availability',title:'Primary–Replica',navLabel:'Primary–Replica',question:'Replication tạo bản sao nhưng vì sao vẫn chưa có automatic failover?',summary:'Async replication, lag, manual promotion và endpoint update.',story:'ShopNow thêm replica để giảm recovery time nhưng promotion và client endpoint vẫn cần operator.',from:'Persistence xử lý restart/recovery.',goal:'Hiểu replication lag và manual failover.',next:'Sentinel bổ sung detection, election và promotion.',outcome:'Giải thích replication khác automatic HA.',checkpoint:'Write được primary ACK nhưng chưa tới replica sẽ ra sao khi primary chết?',questions:['Replica dùng DR hay phục vụ stale read?', 'Lag/RPO tối đa chấp nhận được?', 'Ai promote và cập nhật endpoint?'],keyPoints:['Replication mặc định bất đồng bộ nên failover có thể mất write mới nhất.', 'Replica không tự promote chỉ nhờ REPLICAOF.', 'Client/DNS/Service phải tìm primary mới.'],misconceptions:['“Có replica là application tự failover” — sai nếu không có orchestration và discovery.'],
    nodes:[n('app',35,210,'Application','Primary endpoint',150,76),n('primary',285,195,'Primary','Read + write',165,92),n('replica',625,80,'Replica','Async copy',165,88),n('operator',625,340,'Operator','Manual promotion',165,88),n('endpoint',285,370,'Endpoint / DNS','Must change',165,76)],edges:[e('e1','app','primary'),e('e2','primary','replica'),e('e3','primary','operator'),e('e4','operator','replica'),e('e5','operator','endpoint'),e('e6','endpoint','app')],
    steps:[
      {title:'Primary nhận write',text:'Một primary vẫn là write authority; replica chưa loại bỏ single write path.',activeNodes:['app','primary'],activeEdges:['e1'],metrics:{replicas:'1',write_nodes:'1',failover:'manual'},log:'role:master'},
      {title:'Async replication',text:'So sánh replication offset/lag và network backlog với RPO.',activeNodes:['primary','replica'],activeEdges:['e2'],metrics:{lag:'350 ms',offset_gap:'4821 bytes',consistency:'eventual'},log:'master_repl_offset=901240\nreplica_offset=896419'},
      {title:'Primary down',text:'Replica thường vẫn read-only; replication không tự election.',activeNodes:['primary','operator'],activeEdges:['e3'],tones:{primary:'bad',operator:'warn'},metrics:{writes:'down',replica:'read-only',rto:'running'},log:'primary unreachable'},
      {title:'Manual promotion',text:'Sau fencing/lag check, operator chạy REPLICAOF NO ONE và reconfigure replica khác.',activeNodes:['operator','replica'],activeEdges:['e4'],tones:{replica:'good'},metrics:{new_role:'primary',data_loss:'possible',promotion:'manual'},log:'REPLICAOF NO ONE'},
      {title:'Update endpoint',text:'Client retry có giới hạn và refresh endpoint; DNS TTL cũng cộng vào RTO.',activeNodes:['operator','endpoint','app'],activeEdges:['e5','e6'],tones:{app:'good'},metrics:{dns_ttl:'30 s',availability:'restored',retries:'bounded'},log:'redis.service -> replica-01:6379'}
    ]
  },
  {
    id:'sentinel',phase:'Phần II · High availability',title:'Sentinel automatic failover',navLabel:'Sentinel',question:'Sentinel quorum, promotion và client discovery phối hợp thế nào?',summary:'Từ SDOWN/ODOWN đến promote replica và reconnect primary mới.',story:'ShopNow không muốn manual promotion lúc 2 giờ sáng nên phân bố Sentinel trên các failure domain độc lập.',from:'Primary–Replica có data copy nhưng thiếu election.',goal:'Hiểu detection, quorum, authorization và discovery.',next:'Sentinel vẫn yêu cầu dataset vừa một primary; scale tiếp bằng sharding.',outcome:'Theo được failover flow và các điểm có thể mất write.',checkpoint:'Application gửi data traffic xuyên qua Sentinel hay chỉ dùng Sentinel để discovery?',questions:['Quorum có trải failure domain không?', 'Client có Sentinel-aware và bounded retry không?', 'Replication lag ảnh hưởng candidate/RPO thế nào?'],keyPoints:['SDOWN là nhận định cục bộ; ODOWN cần quorum.', 'Failover authorization cần đa số Sentinel có thể bầu leader, không chỉ quorum config.', 'Sentinel không fence primary cũ; min-replicas-to-write/min-replicas-max-lag có thể giảm data-loss/split-brain impact nhưng đánh đổi availability và không bảo đảm zero loss.', 'Client hỏi Sentinel để tìm primary, data không đi xuyên Sentinel.'],misconceptions:['“Sentinel là load balancer/proxy” — sai; Sentinel monitor, coordinate failover và discovery.'],
    nodes:[n('app',35,210,'Application','Sentinel-aware client',155,72),n('primary',310,205,'Primary','Read + write',160,82),n('replicaA',640,75,'Replica A','Promotion candidate',160,82),n('replicaB',640,345,'Replica B','Async copy',160,82),n('sentinels',310,45,'Sentinel quorum','Detect + elect',170,72)],edges:[e('e1','app','primary'),e('e2','primary','replicaA'),e('e3','primary','replicaB'),e('e4','sentinels','primary'),e('e5','sentinels','replicaA'),e('e6','replicaA','app')],
    steps:[
      {title:'Healthy replication',text:'Primary ACK write; replicas theo sau bất đồng bộ.',activeNodes:['app','primary','replicaA','replicaB'],activeEdges:['e1','e2','e3'],metrics:{lag:'200 ms',sentinels:'3',quorum:'2'},log:'role:master\nconnected_slaves:2'},
      {title:'SDOWN detection',text:'Mỗi Sentinel đánh dấu subjectively down sau down-after-milliseconds.',activeNodes:['sentinels','primary'],activeEdges:['e4'],tones:{primary:'warn'},metrics:{votes:'1/3',state:'SDOWN',writes:'degraded'},log:'+sdown master redis-main'},
      {title:'ODOWN và leader',text:'Đủ quorum tạo ODOWN; đa số Sentinel authorize một leader cho failover epoch.',activeNodes:['sentinels','primary'],activeEdges:['e4'],tones:{sentinels:'warn',primary:'bad'},metrics:{votes:'2/3',state:'ODOWN',leader:'elected'},log:'+odown master redis-main #quorum 2/3'},
      {title:'Promote candidate',text:'Sentinel chọn replica phù hợp dựa priority, offset và health rồi promote.',activeNodes:['sentinels','replicaA'],activeEdges:['e5'],tones:{replicaA:'good'},metrics:{candidate:'replica-a',lag:'lowest',role:'new primary'},log:'+promoted-slave replica-a'},
      {title:'Reconfigure topology',text:'Replica còn lại follow primary mới; old primary khi quay lại phải được reconfigured. Sentinel không fence primary cũ, nên partition vẫn có split-brain risk.',activeNodes:['replicaA','replicaB'],activeEdges:['e3'],metrics:{primary:'replica-a',followers:'1',split_brain_risk:'mitigated, not eliminated'},log:'+slave-reconf-sent replica-b'},
      {title:'Client reconnect',text:'Client refresh primary qua Sentinel và retry có backoff/jitter.',activeNodes:['replicaA','app'],activeEdges:['e6'],tones:{app:'good',replicaA:'good'},metrics:{rto:'8 s',rpo_evidence:'ACKed writes chưa tới candidate',availability:'restored'},log:'get-master-addr-by-name -> replica-a'}
    ]
  },
  {
    id:'cluster',phase:'Phần III · Scale',title:'Redis Cluster và sharding',navLabel:'Redis Cluster',question:'Khi nào một primary không còn đủ và hash slot/client routing thay đổi thiết kế ra sao?',summary:'16.384 hash slots, cluster-aware client, MOVED/ASK và reshard.',story:'Dataset/throughput ShopNow vượt một primary. Keyspace được chia thành shard, mỗi shard cần replica/placement riêng.',from:'Sentinel giải quyết HA cho một dataset trên một primary.',goal:'Hiểu sharding và client topology.',next:'So sánh native client-side routing với proxy-based enterprise topology.',outcome:'Biết khi nào Cluster cần thiết và giới hạn cross-slot.',checkpoint:'Hai key cần multi-key operation phải làm gì để cùng slot?',questions:['Slot có lệch tạo hot shard không?', 'Multi-key có dùng hash tag đúng không?', 'Reshard có rate limit và headroom không?'],keyPoints:['Redis Cluster có 16.384 hash slots.', 'Client cluster-aware xử lý MOVED/ASK và cache slot map.', 'Hash tag {…} đưa các key liên quan vào cùng slot nhưng có thể tạo hotspot.'],misconceptions:['“Cluster tự chia một big key qua nhiều shard” — sai; một key vẫn thuộc một slot/node.'],
    nodes:[n('client',35,215,'Cluster client','Slot-aware',145,72),n('slot',255,215,'Hash slot','0..16383',150,72),n('shard1',540,55,'Shard 1','Slots 0–5460',160,78),n('shard2',540,220,'Shard 2','Slots 5461–10922',160,78),n('shard3',540,385,'Shard 3','Slots 10923–16383',160,78),n('reshard',770,220,'Reshard','Move slots',120,78)],edges:[e('e1','client','slot'),e('e2','slot','shard1'),e('e3','slot','shard2'),e('e4','slot','shard3'),e('e5','shard2','reshard'),e('e6','reshard','shard3'),e('e7','shard2','client')],
    steps:[
      {title:'Client tính slot',text:'CRC16(key) mod 16384; hash tag chỉ hash phần trong {…}.',activeNodes:['client','slot'],activeEdges:['e1'],metrics:{slots:'16384',key:'cart:{user-123}',slot:'12893'},log:'CLUSTER KEYSLOT cart:{user-123}'},
      {title:'Route trực tiếp đến shard',text:'Native Cluster không có proxy trung tâm mặc định; client cache slot map.',activeNodes:['slot','shard3'],activeEdges:['e4'],metrics:{routing:'client-side',target:'shard-3',cluster_state:'ok'},log:'SET cart:{user-123} -> shard-3'},
      {title:'MOVED/ASK redirect',text:'MOVED cập nhật slot map lâu dài; ASK chỉ redirect tạm trong migration và client phải gửi ASKING trước command.',activeNodes:['shard2','client'],activeEdges:['e7'],tones:{shard2:'warn'},metrics:{moved_rate:'42/s',ask_rate:'3/s',client_refresh:'yes'},log:'MOVED 7365 10.0.2.15:6379'},
      {title:'Reshard có kiểm soát',text:'Move slot tạo network/CPU/latency load; cần rate limit và capacity headroom.',activeNodes:['shard2','reshard'],activeEdges:['e5'],tones:{reshard:'warn'},metrics:{slots_moving:'120',p99:'+18%',headroom:'35%'},log:'Migrating slot 7365'},
      {title:'Cân bằng lại',text:'Client map mới; theo dõi slot coverage, hot shard và replica availability.',activeNodes:['reshard','shard3'],activeEdges:['e6'],tones:{shard3:'good'},metrics:{slots_ok:'16384',cluster_state:'ok',skew:'8%'},log:'Slot 7365 assigned to shard-3'}
    ]
  },
  {
    id:'enterprise',phase:'Phần III · Scale',title:'Proxy-based Enterprise Cluster',navLabel:'Enterprise topology',question:'Proxy che topology giúp client đơn giản hơn nhưng thêm failure/bottleneck gì?',summary:'Logical endpoint, proxy routing, shard HA và control plane.',story:'ShopNow cân nhắc Redis Enterprise hoặc dịch vụ tương tự cung cấp proxy endpoint; capability cụ thể phải đối chiếu sản phẩm.',from:'Native Cluster yêu cầu client cluster-aware.',goal:'So sánh client-side và proxy-based routing.',next:'Mở rộng failure domain sang multi-region DR.',outcome:'Không đánh đồng OSS Cluster với sản phẩm enterprise/managed.',checkpoint:'Proxy tier được HA, capacity-tested và quan sát như thế nào?',questions:['Proxy có bottleneck/failure domain không?', 'Shard/replica có trải AZ không?', 'Command/client compatibility có khác OSS không?'],keyPoints:['Proxy có thể che slot topology sau logical endpoint.', 'Control plane điều phối placement/failover/reshard theo capability sản phẩm.', 'Cần kiểm tra limits, consistency, persistence và SLA thay vì suy diễn từ tên Redis.'],misconceptions:['“Mọi Managed Redis đều dùng cùng topology/proxy” — sai; provider implementation khác nhau.'],
    nodes:[n('app',35,215,'Application','Standard client',145,72),n('proxy',255,200,'Database proxy','Logical endpoint',170,92),n('shard1',535,55,'Shard 1','Primary + replica',160,80),n('shard2',535,220,'Shard 2','Primary + replica',160,80),n('shard3',535,385,'Shard 3','Primary + replica',160,80),n('control',755,220,'Control plane','Placement / HA',135,80)],edges:[e('e1','app','proxy'),e('e2','proxy','shard1'),e('e3','proxy','shard2'),e('e4','proxy','shard3'),e('e5','shard2','control'),e('e6','control','shard3')],
    steps:[
      {title:'Logical endpoint',text:'Application dùng protocol/client được sản phẩm hỗ trợ mà không giữ slot map trực tiếp.',activeNodes:['app','proxy'],activeEdges:['e1'],metrics:{endpoint:'single',client_mode:'standard',shards:'3'},log:'redis://database-endpoint:12000'},
      {title:'Proxy route theo key',text:'Proxy tier phải scale/HA và có latency budget riêng.',activeNodes:['proxy','shard2'],activeEdges:['e3'],metrics:{proxy_p99:'1.6 ms',target:'shard-2',connections:'18k'},log:'route order:42 -> shard-2'},
      {title:'Scale bằng shard',text:'Dataset/throughput chia shard; mỗi shard vẫn cần replica và failure-domain placement.',activeNodes:['shard1','shard2','shard3'],activeEdges:['e2','e3','e4'],tones:{shard1:'good',shard2:'good',shard3:'good'},metrics:{shards:'3',replicas_per_shard:'1',az_spread:'yes'},log:'database shard_count=3'},
      {title:'Control plane failover',text:'Khi shard primary down, sản phẩm có thể promote replica theo SLA/capability đã công bố.',activeNodes:['shard2','control'],activeEdges:['e5'],tones:{shard2:'bad',control:'warn'},metrics:{failed_shard:'2',action:'promote',client_change:'none'},log:'shard-2 primary down\npromoting replica'},
      {title:'Endpoint ổn định',text:'Client đơn giản hơn nhưng team vẫn theo dõi proxy, shard, capacity, backup và client behavior.',activeNodes:['control','shard3','proxy','app'],activeEdges:['e6','e4','e1'],tones:{proxy:'good',app:'good'},metrics:{availability:'restored',endpoint:'unchanged',responsibility:'shared'},log:'logical endpoint remains available'}
    ]
  },
  {
    id:'replica-of-dr',phase:'Phần IV · Multi-region',title:'Replica Of và disaster recovery',navLabel:'Replica Of / DR',question:'Replication một chiều qua WAN đạt RPO/RTO nào và tránh split-brain khi cutover ra sao?',summary:'Async cross-region replica, fencing, promotion, DNS và failback.',story:'ShopNow tạo Region B làm standby. Chỉ Region A ghi cho tới controlled cutover.',from:'Một region vẫn là failure domain lớn.',goal:'Hiểu lag, fencing, DR promotion và failback.',next:'Active-Active cho phép nhiều region cùng ghi nhưng đổi consistency model.',outcome:'Mô tả DR cutover không tạo hai writer.',checkpoint:'Tại sao phải fence Region A trước khi promote Region B?',questions:['WAN lag/RPO thực tế?', 'DR capacity có đủ full traffic?', 'Failback/reverse replication được diễn tập chưa?'],keyPoints:['REPLICAOF qua region thường async và một chiều.', 'Fencing là điều kiện trước promotion để tránh split-brain.', 'RPO phải ước lượng từ acknowledged-but-not-replicated writes và kiểm chứng bằng failure test; backlog chủ yếu hỗ trợ partial resync, không phải cam kết RPO.', 'RTO gồm detect, decision, promotion và traffic shift.'],misconceptions:['“Có cross-region replica là automatic multi-region HA” — sai nếu chưa có orchestration và traffic/fencing plan.'],
    nodes:[n('clients',30,215,'Clients','Active region',145,76),n('source',245,200,'Region A','Active writer',165,92),n('wan',475,215,'WAN','Async stream',120,76),n('target',655,200,'Region B','DR replica',165,92),n('traffic',655,370,'Traffic manager','Controlled cutover',165,76)],edges:[e('e1','clients','source'),e('e2','source','wan'),e('e3','wan','target'),e('e4','source','traffic'),e('e5','traffic','target'),e('e6','target','clients')],
    steps:[
      {title:'Region A active',text:'Chỉ A nhận write; B read-only/standby theo thiết kế DR.',activeNodes:['clients','source'],activeEdges:['e1'],metrics:{active_region:'A',write_regions:'1',mode:'DR'},log:'traffic -> region-a'},
      {title:'Async WAN replication',text:'Đo lag, backlog, bandwidth và reconnect/full-sync risk.',activeNodes:['source','wan','target'],activeEdges:['e2','e3'],metrics:{lag:'2.4 s',backlog:'18 MB',link:'up'},log:'cross-region lag=2.4s'},
      {title:'Region A outage',text:'Dừng automatic write ở B cho tới khi xác định A không còn nhận write.',activeNodes:['source','traffic'],activeEdges:['e4'],tones:{source:'bad',traffic:'warn'},metrics:{region_a:'down',writes:'paused',decision:'pending'},log:'region-a unavailable'},
      {title:'Fence rồi promote',text:'Fence A, kiểm tra acknowledged-but-not-replicated writes, lag/capacity, approve promotion và đổi global traffic. RPO phải được kiểm chứng bằng failure test, không suy ra như upper bound chắc chắn từ lag.',activeNodes:['traffic','target'],activeEdges:['e5'],tones:{target:'good'},metrics:{new_active:'B',rpo_evidence:'ACKed writes chưa replicate',capacity:'verified'},log:'fence A\nREPLICAOF NO ONE\nshift traffic'},
      {title:'Chuẩn bị failback',text:'Recovery chưa kết thúc: reverse replication, reconciliation và controlled failback.',activeNodes:['target','clients'],activeEdges:['e6'],tones:{target:'good',clients:'good'},metrics:{active_region:'B',availability:'restored',failback:'planned'},log:'traffic -> region-b'}
    ]
  },
  {
    id:'active-active',phase:'Phần IV · Multi-region',title:'Active-Active multi-region',navLabel:'Active-Active',question:'Nhiều region cùng write hội tụ ra sao và invariant nào không phù hợp eventual merge?',summary:'Multi-directional replication, CRDT semantics, partition và convergence.',story:'ShopNow muốn local write tại A/B. Đây là capability enterprise-specific, không phải Redis OSS replication mặc định.',from:'DR một chiều chỉ có một active writer.',goal:'Hiểu availability/consistency trade-off và CRDT.',next:'Chọn platform và operating model phù hợp topology.',outcome:'Phân biệt Active-Active với DR và đánh giá operation semantics.',checkpoint:'Partition tăng availability local nhưng consistency tạm thời thay đổi thế nào?',questions:['Data type/operation có merge semantics phù hợp?', 'Application chấp nhận eventual convergence?', 'Quan sát conflict, lag và partition ra sao?'],keyPoints:['Redis Enterprise Active-Active dùng CRDT; Redis OSS không tự cung cấp mô hình này.', 'Mỗi region có thể nhận local write trong partition.', 'Business invariant như unique allocation có thể cần coordination ngoài CRDT.'],misconceptions:['“CRDT tự giải quyết mọi conflict nghiệp vụ” — sai; nó chỉ định nghĩa merge semantics cho data type/operation hỗ trợ.'],
    nodes:[n('clientA',25,70,'Clients A','Local read/write',145,76),n('regionA',245,65,'Region A','Active database',175,92),n('merge',465,215,'CRDT merge','Conflict semantics',155,86),n('regionB',655,355,'Region B','Active database',175,92),n('clientB',25,375,'Clients B','Local read/write',145,76),n('partition',655,65,'Network partition','Both sides continue',175,92)],edges:[e('e1','clientA','regionA'),e('e2','clientB','regionB'),e('e3','regionA','merge'),e('e4','regionB','merge'),e('e5','merge','regionA'),e('e6','merge','regionB'),e('e7','regionA','partition'),e('e8','partition','regionB')],
    steps:[
      {title:'Local writes',text:'Mỗi region nhận write cho cùng logical dataset với latency local.',activeNodes:['clientA','regionA','clientB','regionB'],activeEdges:['e1','e2'],metrics:{write_regions:'2',local_latency:'low',consistency:'eventual'},log:'A: INCR counter\nB: INCR counter'},
      {title:'Multi-directional sync',text:'Operation replicate nhiều chiều thay vì copy từ một source cố định.',activeNodes:['regionA','regionB','merge'],activeEdges:['e3','e4'],metrics:{lag:'180 ms',convergence:'pending',direction:'A↔B'},log:'sync A <-> B'},
      {title:'CRDT merge',text:'Merge deterministic theo supported data type; phải map với business invariant.',activeNodes:['merge','regionA','regionB'],activeEdges:['e5','e6'],tones:{merge:'warn'},metrics:{conflicts:'2',merge:'deterministic',invariant_review:'required'},log:'merge concurrent updates'},
      {title:'WAN partition',text:'Hai region tiếp tục local traffic nhưng view tạm thời diverge.',activeNodes:['regionA','partition','regionB'],activeEdges:['e7','e8'],tones:{partition:'bad'},metrics:{link:'partitioned',local_availability:'up',state:'diverged'},log:'inter-region link down'},
      {title:'Convergence',text:'Sau reconnect, exchange operation và hội tụ; kiểm chứng business outcome chứ không chỉ replication healthy.',activeNodes:['regionA','merge','regionB'],activeEdges:['e3','e4','e5','e6'],tones:{merge:'good',regionA:'good',regionB:'good'},metrics:{link:'up',convergence:'complete',audit:'PASS'},log:'regions converged'}
    ]
  },
  {
    id:'deployment',phase:'Phần V · Production',title:'Chọn cách vận hành Redis',navLabel:'VM, K8s, Managed',question:'VM, Kubernetes, managed và serverless thay đổi responsibility split như thế nào?',summary:'Giữ topology tách biệt platform và operating model.',story:'ShopNow đã chọn data topology; giờ mới chọn nơi chạy và ai sở hữu patch, backup, failover, capacity.',from:'Đã xác định yêu cầu HA/scale/region.',goal:'Lập responsibility matrix có thể vận hành.',next:'Dùng toàn bộ mental model để xử lý incident production.',outcome:'So sánh deployment option bằng SLO, capability, toil và cost.',checkpoint:'Managed Redis có loại bỏ trách nhiệm về key design, client timeout và capacity không?',questions:['Topology có giữ nguyên khi đổi platform?', 'Provider chịu phần nào bằng SLA cụ thể?', 'Service limits có hợp connection/command/latency không?'],keyPoints:['Kubernetes hỗ trợ reconciliation nhưng Redis vẫn stateful.', 'Managed chuyển một phần toil, không chuyển data/application responsibility.', 'Serverless cần kiểm tra limits, persistence, region và billing behavior.'],misconceptions:['“Chạy Redis trên Kubernetes tự tạo HA” — sai; topology, storage, placement và failover vẫn phải thiết kế.'],
    nodes:[n('topology',30,215,'Chosen topology','Sentinel / Cluster / ...',175,82),n('vm',300,40,'VM / bare metal','Self-managed',155,78),n('k8s',300,160,'Kubernetes','StatefulSet / Operator',155,78),n('managed',300,280,'Managed Redis','Provider-operated',155,78),n('serverless',300,400,'Serverless','Usage-based',155,78),n('responsibility',650,180,'Responsibility split','Capacity / patch / backup / HA',210,145)],edges:[e('e1','topology','vm'),e('e2','topology','k8s'),e('e3','topology','managed'),e('e4','topology','serverless'),e('e5','vm','responsibility'),e('e6','k8s','responsibility'),e('e7','managed','responsibility'),e('e8','serverless','responsibility')],
    steps:[
      {title:'Topology trước platform',text:'Data path/failover yêu cầu được chốt trước khi chọn nơi chạy.',activeNodes:['topology'],metrics:{topology:'cluster',platform:'TBD',operator:'TBD'},log:'topology=cluster'},
      {title:'VM / bare metal',text:'Team sở hữu OS, storage, placement, patch, backup và failover automation.',activeNodes:['topology','vm','responsibility'],activeEdges:['e1','e5'],metrics:{control:'maximum',toil:'high',owner:'team'},log:'owner=os, redis, backup, failover'},
      {title:'Kubernetes',text:'StatefulSet/Operator, PVC, PDB, anti-affinity và topology spread phải phối hợp đúng.',activeNodes:['topology','k8s','responsibility'],activeEdges:['e2','e6'],metrics:{reconciliation:'yes',stateful:'yes',owner:'team/operator'},log:'StatefulSet + PVC + anti-affinity'},
      {title:'Managed Redis',text:'Đọc SLA/capability: provider có thể sở hữu node replacement, patch, failover; customer vẫn sở hữu workload/data/DR requirement.',activeNodes:['topology','managed','responsibility'],activeEdges:['e3','e7'],tones:{managed:'good'},metrics:{toil:'lower',control:'provider-specific',owner:'shared'},log:'provider: infra + HA\ncustomer: data + client'},
      {title:'Serverless',text:'Capacity/billing tự động hơn nhưng limits, cold behavior, commands và persistence phải được load-test.',activeNodes:['topology','serverless','responsibility'],activeEdges:['e4','e8'],tones:{serverless:'warn'},metrics:{billing:'usage',limits:'reviewed',benchmark:'required'},log:'check connections / object size / commands'}
    ]
  },
  {
    id:'incident',phase:'Phần V · Production',title:'Redis incident response',navLabel:'Incident response',question:'Khi p99 tăng, làm sao đi từ symptom tới evidence mà không restart/scale theo cảm tính?',summary:'Phân tầng client, Redis command/key, memory/replication và infrastructure.',story:'ShopNow báo p99 500 ms. CPU cao nhưng memory chỉ 60%; đội ngũ phải tìm hot/big key hoặc expensive command.',from:'Topology/platform cho biết node và failure domain nào cần kiểm tra.',goal:'Điều tra có thứ tự, mitigation an toàn và permanent fix.',next:'Hoàn tất lộ trình; quay lại chapter cần lab failure sâu hơn.',outcome:'Có runbook evidence-first thay vì “restart Redis”.',checkpoint:'Nêu năm kiểm tra đầu tiên khi CPU cao nhưng memory mới 60%.',questions:['Symptom bắt đầu ở client, Redis hay infra?', 'CPU do QPS, hot key hay command complexity?', 'Mitigation có đẩy tải sang database hoặc mất dữ liệu không?'],keyPoints:['Bắt đầu bằng phạm vi và timeline.', 'Dùng INFO, latency, SLOWLOG, commandstats, SCAN/MEMORY USAGE; tránh KEYS và MONITOR kéo dài.', 'Mitigation phải có rollback và theo dõi downstream impact.'],misconceptions:['“Memory chưa đầy nên Redis không thể chậm” — sai; single-threaded command path, hot key, CPU/network/disk vẫn gây latency.'],
    nodes:[n('alert',35,215,'Alert','p99 latency ↑',145,78),n('metrics',255,75,'Metrics','CPU / memory / lag',160,78),n('slowlog',255,345,'SLOWLOG','Expensive command',160,78),n('keys',530,75,'Key analysis','Hot / big key',160,78),n('infra',530,345,'Infrastructure','Network / disk / swap',160,78),n('action',755,215,'Mitigation','Safe + reversible',135,78)],edges:[e('e1','alert','metrics'),e('e2','alert','slowlog'),e('e3','metrics','keys'),e('e4','slowlog','keys'),e('e5','metrics','infra'),e('e6','keys','action'),e('e7','infra','action')],
    steps:[
      {title:'Scope alert',text:'Xác định một client, node, shard hay toàn cluster; ghi timeline/deploy/traffic change.',activeNodes:['alert'],metrics:{p99:'480 ms',scope:'shard-2',started:'09:42'},log:'ALERT RedisLatencyP99High'},
      {title:'Đọc metric trước',text:'CPU, ops/sec, memory, evictions, blocked clients, network và replication lag.',activeNodes:['alert','metrics'],activeEdges:['e1'],tones:{metrics:'warn'},metrics:{cpu:'94%',memory:'61%',blocked_clients:'18'},log:'INFO all\nLATENCY LATEST'},
      {title:'SLOWLOG và commandstats',text:'Tìm expensive command/complexity; không chạy MONITOR lâu trên production.',activeNodes:['alert','slowlog'],activeEdges:['e2'],tones:{slowlog:'warn'},metrics:{slowlog_len:'128',top_command:'HGETALL',duration:'412 ms'},log:'SLOWLOG GET 20\nHGETALL user_sessions_big'},
      {title:'Hot/big key',text:'Dùng sampling/SCAN, MEMORY USAGE và provider tooling; tránh KEYS trên dataset lớn.',activeNodes:['metrics','slowlog','keys'],activeEdges:['e3','e4'],tones:{keys:'bad'},metrics:{key_size:'286 MB',hot_qps:'19k/s',shard:'2'},log:'MEMORY USAGE user_sessions_big'},
      {title:'Loại trừ infrastructure',text:'Kiểm tra swap, network retransmit, fork/AOF/RDB, noisy neighbor và host steal.',activeNodes:['metrics','infra'],activeEdges:['e5'],metrics:{swap:'0',retransmit:'normal',aof_rewrite:'no'},log:'infra signals normal'},
      {title:'Mitigate rồi sửa gốc',text:'Rate limit, đổi command, phân mảnh key hoặc UNLINK có kiểm soát; theo dõi DB/cache miss và lập permanent fix.',activeNodes:['keys','infra','action'],activeEdges:['e6','e7'],tones:{action:'good'},metrics:{p99:'24 ms',cpu:'48%',rollback:'ready'},log:'UNLINK user_sessions_big\nrate limit applied\np99 recovered'}
    ]
  }
];

export const redisChapterById = new Map(redisChapters.map((chapter) => [chapter.id, chapter]));
