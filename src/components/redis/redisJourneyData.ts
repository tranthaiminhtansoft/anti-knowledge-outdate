export type RedisChapter = {
  id: string;
  phase: string;
  title: string;
  navLabel: string;
  question: string;
  summary: string;
  keyPoints: string[];
  misconceptions: string[];
  questions: string[];
};

export type RedisQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const redisMapQuestions = [
  ['VM/Kubernetes có phải là Deploy Strategy không?', 'Không. VM và Kubernetes là nơi chạy Redis process/Pod; Standalone, Primary–Replica, Sentinel và Cluster mới là cách các Redis process phối hợp.'],
  ['Primary–Replica khác Sentinel ở đâu?', 'Primary–Replica tạo bản sao nhưng không tự điều phối failover. Sentinel bổ sung nhiều process giám sát, xác nhận lỗi và đưa Replica lên Primary.'],
  ['Redis Cluster dùng hash slot để làm gì?', 'Cluster chia keyspace thành 16.384 hash slot, phân quyền từng slot cho một Primary để dữ liệu và lưu lượng có thể mở rộng theo shard.'],
  ['Lệnh SET đơn giản đi qua những thành phần nào?', 'Client → Network I/O → RESP parser → kiểm tra ACL/trạng thái → Command Engine ↔ Keyspace → Response Writer → Client. AOF/replication là các nhánh thay đổi có điều kiện.'],
  ['Nên chọn data type nào cho leaderboard, event stream và tag?', 'Leaderboard: Sorted Set; event stream/consumer group: Stream; tag không trùng: Set. Chọn data type theo thao tác cần thực hiện, không chỉ theo hình dạng dữ liệu.'],
] as const;

export const redisPersistentQuiz: RedisQuizQuestion[] = [
  { id: 'hot-state', prompt: 'Trong mô hình bài học, Redis giữ loại state nào để phản hồi nhanh?', options: ['Toàn bộ lịch sử bất biến', 'Hot/working state được đọc và cập nhật thường xuyên', 'Chỉ backup đã mã hóa', 'Schema của database'], correctIndex: 1, explanation: 'Redis giữ hot/working state trong RAM để phục vụ thao tác tần suất cao. Persistent database vẫn là nơi lưu trữ bền vững để có thể khôi phục.' },
  { id: 'dirty-state', prompt: 'Dirty state nghĩa là gì trong luồng write-behind?', options: ['Dữ liệu đã bị xóa', 'Thay đổi trong Redis chưa được batch-write xuống persistent database', 'Snapshot đã hoàn tất', 'Kết nối client bị lỗi'], correctIndex: 1, explanation: 'Sau khi ứng dụng cập nhật Redis, state được đánh dấu dirty cho đến khi worker snapshot và ghi batch thành công xuống persistent database.' },
  { id: 'worker', prompt: 'Async worker làm gì trong mô phỏng?', options: ['Chặn request để ghi từng lệnh đồng bộ', 'Định kỳ snapshot dirty state rồi batch-write', 'Chỉ xóa TTL', 'Thay Redis bằng MongoDB'], correctIndex: 1, explanation: 'Worker tách đường ghi bền vững khỏi hot path: gom dirty state, snapshot và batch-write để ứng dụng vẫn phản hồi nhanh.' },
  { id: 'flush-lag', prompt: 'Rủi ro chính nếu Redis lỗi trước khi dirty state được flush là gì?', options: ['Không thể đọc lại dữ liệu đã ghi bền', 'Các cập nhật chưa flush có thể mất', 'MongoDB tự động bị xóa', 'TTL bị vô hiệu hóa vĩnh viễn'], correctIndex: 1, explanation: 'Write-behind có durability window. Bản ghi chưa được flush chưa có trong persistent database, nên Redis cold recovery có thể làm mất các cập nhật đó.' },
  { id: 'cache-miss', prompt: 'Khi cache miss sau recovery, ứng dụng nên làm gì?', options: ['Trả lỗi ngay cho mọi request', 'Đọc persistent database rồi warm Redis', 'Xóa persistent database', 'Chạy Sentinel'], correctIndex: 1, explanation: 'Cache miss không có nghĩa dữ liệu bền vững mất. Ứng dụng đọc persistent database, trả dữ liệu và warm Redis cho các lượt truy cập sau.' },
  { id: 'source-of-truth', prompt: 'Trong lesson này, thành phần nào là nguồn để khôi phục sau khi Redis cold?', options: ['Application client', 'Async worker', 'Persistent database', 'Activity log'], correctIndex: 2, explanation: 'Persistent database là nơi lưu state bền vững. Redis tối ưu hot state nhưng không thay thế trách nhiệm khôi phục của database.' },
  { id: 'mitigation', prompt: 'Cách nào giảm cửa sổ mất dữ liệu của write-behind?', options: ['Tăng batch interval vô hạn', 'Theo dõi flush lag và điều chỉnh batch/đường ghi cho dữ liệu quan trọng', 'Tắt persistent database', 'Luôn xóa Redis trước khi flush'], correctIndex: 1, explanation: 'Cần đo flush lag, chọn batch interval phù hợp và dùng đường ghi bền hơn cho dữ liệu quan trọng. Không nên giả định write-behind có durability tức thời.' },
];

export const redisChapters: RedisChapter[] = [
  {
    id: 'persistent-database', phase: 'Redis và dữ liệu bền vững', title: 'Redis hỗ trợ persistent DB', navLabel: 'Redis hỗ trợ persistent DB',
    question: 'Redis hỗ trợ persistent DB như thế nào?',
    summary: 'Redis giữ hot/working state để phản hồi nhanh; một async worker gom dirty state và batch-write xuống persistent database để lưu trữ bền vững.',
    keyPoints: ['Redis xử lý hot/working state có tần suất đọc và cập nhật cao.', 'Async worker định kỳ snapshot dirty state và batch-write xuống persistent database.', 'Khi cache miss, ứng dụng đọc persistent database rồi warm Redis cho lần truy cập sau.'],
    misconceptions: ['Redis và persistent database không thay thế nhau: Redis tối ưu tốc độ, còn persistent database là nguồn dữ liệu bền vững để khôi phục.'],
    questions: redisPersistentQuiz.map((item) => item.prompt),
  },
  {
    id: 'redis-map', phase: 'Redis Architecture', title: 'Redis Map', navLabel: 'Redis Map',
    question: 'Triển khai Redis như thế nào cho phù hợp với mô hình doanh nghiệp?',
    summary: 'Redis Map đi từ Standalone đến Primary–Replica, Sentinel và Cluster; sau đó mở bên trong node và chọn data type theo use case.',
    keyPoints: ['Deploy Strategy: cách Redis process phối hợp.', 'Components: luồng lệnh, persistence, replication và công việc nền.', 'Data Types: chọn cấu trúc theo thao tác/use case.'],
    misconceptions: ['VM/Kubernetes là runtime substrate, không phải Redis Deploy Strategy.'],
    questions: redisMapQuestions.map(([prompt]) => prompt),
  },
];

export const redisChapterById = new Map(redisChapters.map((chapter) => [chapter.id, chapter]));
