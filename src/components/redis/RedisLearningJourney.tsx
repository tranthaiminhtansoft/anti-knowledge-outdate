import React from 'react';
import { redisChapterById, redisChapters, redisPersistentQuiz } from './redisJourneyData';
import { RedisMapLesson } from './RedisMapLesson';
import './redis-journey.css';

const FLUSH_INTERVAL_MS = 5_000;

type LogTone = 'info' | 'warn' | 'error' | 'success';
type PacketRoute = 'client-redis' | 'redis-worker' | 'worker-mongo' | 'redis-mongo' | 'mongo-redis' | 'redis-client';
type FloatTarget = 'client' | 'redis' | 'mongo';

type RuntimeState = {
  cartItems: number;
  mongoItems: number;
  dirtyVersion: number;
  persistedVersion: number;
  flushInProgress: boolean;
  coldPreparing: boolean;
  coldRunning: boolean;
  redisAvailable: boolean;
  redisActive: boolean;
  clientSleeping: boolean;
  workerStatus: string;
  nextFlushAt: number;
  generation: number;
};

type LogEntry = { id: number; time: string; message: string; tone: LogTone };
type Packet = { id: number; icon: string; route: PacketRoute; duration: number };
type FloatingText = { id: number; target: FloatTarget; text: string; tone: 'plus' | 'warn' };

function createRuntime(generation = 0): RuntimeState {
  return {
    cartItems: 0,
    mongoItems: 0,
    dirtyVersion: 0,
    persistedVersion: 0,
    flushInProgress: false,
    coldPreparing: false,
    coldRunning: false,
    redisAvailable: true,
    redisActive: false,
    clientSleeping: false,
    workerStatus: 'Flush sau 5s',
    nextFlushAt: Date.now() + FLUSH_INTERVAL_MS,
    generation,
  };
}

function RedisPersistentQuiz() {
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  return <section className="redisPersistentQuiz" aria-labelledby="redis-persistence-checkpoint-title">
    <h2 id="redis-persistence-checkpoint-title">Câu hỏi củng cố</h2>
    <p>Chọn một phương án. Khi sai, phương án bạn chọn hiển thị không đúng và đáp án đúng được đánh dấu rõ ràng.</p>
    {redisPersistentQuiz.map((question, number) => {
      const selected = answers[question.id];
      const answered = selected !== undefined;
      const correct = selected === question.correctIndex;
      return <article key={question.id}>
        <h3>{number + 1}. {question.prompt}</h3>
        <div className="redisQuizOptions" aria-label={question.prompt}>
          {question.options.map((option, index) => {
            const state = answered ? (index === question.correctIndex ? 'correct' : index === selected ? 'wrong' : '') : '';
            return <button type="button" aria-pressed={selected === index} key={option} className={state} onClick={() => setAnswers((current) => ({ ...current, [question.id]: index }))}>{String.fromCharCode(65 + index)}. {option}{answered && index === question.correctIndex ? <span className="redisQuizMark">Đáp án đúng</span> : null}{answered && index === selected && index !== question.correctIndex ? <span className="redisQuizMark">Bạn đã chọn — chưa đúng</span> : null}</button>;
          })}
        </div>
        {answered ? <div className={`redisQuizFeedback ${correct ? 'correct' : 'wrong'}`} role="status"><strong>{correct ? 'Chính xác.' : 'Chưa chính xác.'}</strong><p>{question.explanation}</p></div> : null}
      </article>;
    })}
  </section>;
}

function DatabaseGlyph({ className }: { className: string }) {
  return (
    <svg className={`redisPersistenceDbSvg ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5zm0 18c-4.42 0-8-1.79-8-4v-1.47c2.19 1.48 5 2.47 8 2.47s5.81-.99 8-2.47V16c0 2.21-3.58 4-8 4zm0-6c-4.42 0-8-1.79-8-4V8.53C6.19 10.01 9 11 12 11s5.81-.99 8-2.47V10c0 2.21-3.58 4-8 4zm0-6c-4.42 0-8-1.79-8-4s3.58-4 8-4 8 1.79 8 4-3.58 4-8 4z" />
    </svg>
  );
}

function RedisPersistentDatabaseLesson({ chapterId }: { chapterId: string }) {
  const chapter = redisChapterById.get(chapterId) ?? redisChapters[0];
  const runtimeRef = React.useRef<RuntimeState>(createRuntime());
  const [runtime, setRuntime] = React.useState<RuntimeState>(runtimeRef.current);
  const [workerEpoch, setWorkerEpoch] = React.useState(0);
  const [logs, setLogs] = React.useState<LogEntry[]>([
    { id: 0, time: 'SYSTEM', message: 'Worker chạy mỗi 5 giây. Hãy bấm liên tục: MongoDB vẫn được flush định kỳ.', tone: 'info' },
  ]);
  const [packets, setPackets] = React.useState<Packet[]>([]);
  const [floatingTexts, setFloatingTexts] = React.useState<FloatingText[]>([]);
  const mountedRef = React.useRef(false);
  const sequenceRef = React.useRef(1);
  const waitersRef = React.useRef(new Map<number, () => void>());
  const scheduledRef = React.useRef(new Set<number>());
  const consoleRef = React.useRef<HTMLDivElement>(null);

  const sync = React.useCallback(() => {
    if (mountedRef.current) setRuntime({ ...runtimeRef.current });
  }, []);

  const addLog = React.useCallback((message: string, tone: LogTone = 'info') => {
    if (!mountedRef.current) return;
    const entry: LogEntry = {
      id: sequenceRef.current++,
      time: new Date().toISOString().slice(11, 19),
      message,
      tone,
    };
    setLogs((current) => [...current.slice(-79), entry]);
  }, []);

  const firePacket = React.useCallback((icon: string, route: PacketRoute, duration: number) => {
    if (!mountedRef.current) return;
    setPackets((current) => [...current, { id: sequenceRef.current++, icon, route, duration }]);
  }, []);

  const showFloatingText = React.useCallback((target: FloatTarget, text: string, tone: 'plus' | 'warn') => {
    if (!mountedRef.current) return;
    setFloatingTexts((current) => [...current, { id: sequenceRef.current++, target, text, tone }]);
  }, []);

  const wait = React.useCallback((duration: number) => new Promise<void>((resolve) => {
    const id = window.setTimeout(() => {
      waitersRef.current.delete(id);
      resolve();
    }, duration);
    waitersRef.current.set(id, resolve);
  }), []);

  const schedule = React.useCallback((duration: number, generation: number, action: () => void) => {
    const id = window.setTimeout(() => {
      scheduledRef.current.delete(id);
      if (mountedRef.current && runtimeRef.current.generation === generation) action();
    }, duration);
    scheduledRef.current.add(id);
  }, []);

  const cancelAsyncWork = React.useCallback(() => {
    scheduledRef.current.forEach((id) => window.clearTimeout(id));
    scheduledRef.current.clear();
    waitersRef.current.forEach((resolve, id) => {
      window.clearTimeout(id);
      resolve();
    });
    waitersRef.current.clear();
  }, []);

  const flushDirty = React.useCallback(async (reason = 'periodic') => {
    const startedGeneration = runtimeRef.current.generation;
    while (runtimeRef.current.flushInProgress) {
      await wait(50);
      if (!mountedRef.current || runtimeRef.current.generation !== startedGeneration) return false;
    }

    const state = runtimeRef.current;
    if (state.coldRunning || state.dirtyVersion <= state.persistedVersion) return false;

    const snapshotItems = state.cartItems;
    const snapshotVersion = state.dirtyVersion;
    state.flushInProgress = true;
    state.workerStatus = 'Đang batch flush…';
    sync();
    addLog(`[WORKER] Tick ${reason}: lấy snapshot Redis v${snapshotVersion} (${snapshotItems} items).`, 'warn');
    firePacket('📨', 'redis-worker', 1_200);

    await wait(1_300);
    if (!mountedRef.current || runtimeRef.current.generation !== startedGeneration) return false;
    firePacket('📦', 'worker-mongo', 1_600);

    await wait(1_700);
    if (!mountedRef.current || runtimeRef.current.generation !== startedGeneration) return false;

    const latest = runtimeRef.current;
    latest.mongoItems = snapshotItems;
    latest.persistedVersion = snapshotVersion;
    latest.flushInProgress = false;
    showFloatingText('mongo', '💾 Durable', 'plus');
    addLog(`[MONGODB] Batch upsert hoàn tất v${snapshotVersion}. ${latest.dirtyVersion > latest.persistedVersion ? 'Có thay đổi mới, giữ Dirty cho tick sau.' : 'Redis đã Clean.'}`, 'success');
    sync();
    return true;
  }, [addLog, firePacket, showFloatingText, sync, wait]);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelAsyncWork();
    };
  }, [cancelAsyncWork]);

  React.useEffect(() => {
    const flushInterval = window.setInterval(() => {
      const state = runtimeRef.current;
      state.nextFlushAt = Date.now() + FLUSH_INTERVAL_MS;
      if (state.coldRunning) return;
      if (state.dirtyVersion > state.persistedVersion) void flushDirty('định kỳ 5s');
      else addLog('[WORKER] Tick định kỳ: không có dirty state, bỏ qua MongoDB write.', 'info');
    }, FLUSH_INTERVAL_MS);

    const countdownInterval = window.setInterval(() => {
      const state = runtimeRef.current;
      if (state.flushInProgress) return;
      const seconds = Math.max(0, Math.ceil((state.nextFlushAt - Date.now()) / 1_000));
      state.workerStatus = `Flush sau ${seconds}s · ${state.dirtyVersion > state.persistedVersion ? 'Dirty' : 'Idle'}`;
      sync();
    }, 250);

    return () => {
      window.clearInterval(flushInterval);
      window.clearInterval(countdownInterval);
    };
  }, [addLog, flushDirty, sync, workerEpoch]);

  React.useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [logs]);

  const addToCart = () => {
    const state = runtimeRef.current;
    if (state.coldPreparing || state.coldRunning) return;
    const generation = state.generation;
    firePacket('👆', 'client-redis', 300);
    state.redisActive = true;
    sync();

    schedule(300, generation, () => {
      const current = runtimeRef.current;
      current.cartItems += 1;
      current.dirtyVersion += 1;
      showFloatingText('client', '+1', 'plus');
      if (current.cartItems % 5 === 1) {
        addLog(`[REDIS] Ghi hot state v${current.dirtyVersion} trên RAM; đánh dấu Dirty (Items: ${current.cartItems}).`, 'success');
      }
      sync();
    });

    schedule(500, generation, () => {
      runtimeRef.current.redisActive = false;
      sync();
    });
  };

  const runColdDataSim = async () => {
    const state = runtimeRef.current;
    if (state.coldPreparing || state.coldRunning) return;
    const generation = state.generation;
    state.coldPreparing = true;
    if (state.cartItems === 0) {
      state.cartItems = 15;
      state.dirtyVersion += 1;
    }
    sync();
    addLog('[SYSTEM] Chuẩn bị cold-data demo: yêu cầu worker flush dirty state trước khi Redis hết TTL.', 'warn');

    await flushDirty('trước cold storage');
    if (!mountedRef.current || runtimeRef.current.generation !== generation) return;

    const current = runtimeRef.current;
    current.coldPreparing = false;
    current.coldRunning = true;
    setLogs([]);
    sync();

    schedule(500, generation, () => {
      runtimeRef.current.clientSleeping = true;
      addLog('[CLIENT] User thoát App. 30 ngày trôi qua không đăng nhập...', 'info');
      sync();
    });
    schedule(2_500, generation, () => {
      runtimeRef.current.redisAvailable = false;
      showFloatingText('redis', '🧹 Xóa để tiết kiệm RAM', 'warn');
      addLog('[REDIS] Tự động dọn dẹp RAM (TTL Expired) đối với user không hoạt động.', 'warn');
      sync();
    });
    schedule(5_500, generation, () => {
      runtimeRef.current.clientSleeping = false;
      addLog('[CLIENT] VÀI THÁNG SAU: User mở lại App!', 'info');
      firePacket('🔍', 'client-redis', 600);
      sync();
    });
    schedule(6_100, generation, () => {
      addLog('[REDIS] Cache Miss (Không tìm thấy giỏ hàng trong RAM).', 'error');
      showFloatingText('redis', 'Miss!', 'warn');
    });
    schedule(6_700, generation, () => {
      addLog('[SYSTEM] Đọc persistent database MongoDB để lấy dữ liệu cũ.', 'warn');
      firePacket('🔍', 'redis-mongo', 800);
    });
    schedule(7_500, generation, () => {
      addLog('[MONGODB] Đã tìm thấy giỏ hàng cũ. Trả về cho Cache (Warm-up).', 'success');
      firePacket('📦', 'mongo-redis', 800);
    });
    schedule(8_300, generation, () => {
      runtimeRef.current.redisAvailable = true;
      showFloatingText('redis', '🔥 Đã hâm nóng', 'plus');
      addLog('[REDIS] Nạp thành công vào RAM. Trả kết quả về App.', 'success');
      firePacket('✅', 'redis-client', 600);
      sync();
    });
    schedule(8_900, generation, () => {
      runtimeRef.current.coldRunning = false;
      showFloatingText('client', 'Load thành công', 'plus');
      addLog('[DEVOPS] Cold data đã phục hồi; Redis lại phục vụ hot state.', 'success');
      sync();
    });
  };

  const hardReset = () => {
    const nextGeneration = runtimeRef.current.generation + 1;
    cancelAsyncWork();
    runtimeRef.current = createRuntime(nextGeneration);
    setWorkerEpoch((epoch) => epoch + 1);
    setPackets([]);
    setFloatingTexts([]);
    setLogs([{ id: sequenceRef.current++, time: 'SYSTEM', message: 'Đã Reset toàn bộ hệ thống. Trạng thái sạch (Clean State).', tone: 'success' }]);
    sync();
  };

  const isDirty = runtime.dirtyVersion > runtime.persistedVersion;
  const controlsLocked = runtime.coldPreparing || runtime.coldRunning;

  return (
    <section className="redisPersistenceLesson" aria-label={`${chapter.title} lesson`}>
      <section className="redisPersistenceIntro" aria-labelledby="redis-persistence-explanation">
        <h2 id="redis-persistence-explanation">Redis phối hợp với persistent database</h2>
        <div className="redisPersistenceQuestions">
          <strong>Câu hỏi cần trả lời</strong>
          <ul>
            <li>Tại sao cần Redis khi đã có Persistent Database?</li>
            <li>Làm thế nào xử lý dữ liệu được cập nhật liên tục mà không gây quá tải Persistent Database?</li>
          </ul>
        </div>
        <h3>Giải thích ngắn</h3>
        <p>Các dữ liệu “nóng” như giỏ hàng thường được đọc và cập nhật liên tục. Nếu mọi thao tác đều ghi trực tiếp xuống Persistent Database, hệ thống sẽ phát sinh nhiều lượt ghi nhỏ, làm tăng độ trễ và áp lực lên tầng lưu trữ.</p>
        <p>Redis đóng vai trò <strong>hot/working state</strong>, giúp xử lý các thao tác với tốc độ cao. Một worker bất đồng bộ sẽ định kỳ gom những dữ liệu đã thay đổi và đồng bộ chúng xuống Persistent Database để lưu trữ bền vững.</p>
        <p>Diagram dưới đây minh họa mô hình này với MongoDB là một ví dụ cho Persistent Database.</p>
      </section>

      <section className="redisPersistenceSimulator" aria-labelledby="redis-persistence-simulator-title">
        <header>
          <h2 id="redis-persistence-simulator-title">Redis Hot State → Async Worker → MongoDB Durable State</h2>
          <p className="redisPersistenceScrollHint">↔ Chỉ cuộn ngang khi khu vực hiển thị quá hẹp</p>
        </header>
        <div className="redisPersistenceViewport" tabIndex={0} aria-label="Khu vực mô phỏng Redis. Chỉ cuộn ngang khi khu vực hiển thị quá hẹp để xem diagram, thao tác và activity log.">
          <div className="redisPersistenceWorkspace">
            <div className="redisPersistenceArchitectureFrame">
            <div className="redisPersistenceArchitecture" role="img" aria-label="App Shopee ghi hot state vào Redis qua đường nét đứt; async worker đứng phía sau Redis và MongoDB, batch-write snapshot theo hai đường cung; cold-data miss được warm trở lại Redis">
              <svg className="redisPersistenceConnections" viewBox="0 0 760 320" aria-hidden="true">
                <defs>
                  <marker id="redis-persistence-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 8 4 L 0 8 z" /></marker>
                  <marker id="redis-persistence-recovery-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 7 3.5 L 0 7 z" /></marker>
                </defs>
                <path className="redisPersistenceConnection client-redis" data-connection="client-redis" d="M 210 160 C 270 160, 282 94, 350 94" markerEnd="url(#redis-persistence-arrow)" />
                <path className="redisPersistenceConnection redis-worker" data-connection="redis-worker" d="M 530 94 C 575 94, 556 132, 600 142" markerEnd="url(#redis-persistence-arrow)" />
                <path className="redisPersistenceConnection worker-mongo" data-connection="worker-mongo" d="M 600 178 C 556 187, 575 226, 530 226" markerEnd="url(#redis-persistence-arrow)" />
                <path className="redisPersistenceRecoveryLine" data-connection="cache-recovery" d="M 438 145 C 462 163, 462 174, 438 190" markerEnd="url(#redis-persistence-recovery-arrow)" />
                <text className="redisPersistenceWireLabel label-snapshot" x="548" y="112">snapshot</text>
                <text className="redisPersistenceWireLabel label-batch" x="548" y="211">batch write</text>
                <text className="redisPersistenceWireLabel label-recovery" x="378" y="171">read-through</text>
              </svg>

              <div className="redisPersistenceClient" data-node="client">
                <span className="redisPersistenceClientIcon">{runtime.clientSleeping ? '💤' : '📱'}</span>
                <strong>App Shopee</strong>
                <span className="redisPersistenceDataBox" data-testid="cart-state">🛒 Cart: {runtime.cartItems}</span>
              </div>

              <div className={`redisPersistenceDb redisPersistenceRedis${runtime.redisActive ? ' active' : ''}`} data-node="redis">
                <DatabaseGlyph className="redisPersistenceRedisLogo" />
                <strong>Redis · Hot State</strong>
                <span className={`redisPersistenceDataBox${isDirty ? ' dirty' : ''}`} data-testid="redis-state">
                  {runtime.redisAvailable ? `Cart: ${runtime.cartItems} · ${isDirty ? 'Dirty' : 'Clean'}` : 'Cart: NULL'}
                </span>
              </div>

              <div className={`redisPersistenceWorker${runtime.flushInProgress ? ' flushing' : ''}`} data-node="worker">
                ⚙️ Async Worker
                <small data-testid="worker-status">{runtime.workerStatus}</small>
              </div>

              <div className="redisPersistenceDb redisPersistenceMongo" data-node="mongo">
                <DatabaseGlyph className="redisPersistenceMongoLogo" />
                <strong>MongoDB · Durable</strong>
                <span className="redisPersistenceDataBox" data-testid="persistent-state">Cart: {runtime.mongoItems} items</span>
              </div>

              {packets.map((packet) => {
                return (
                  <span
                    key={packet.id}
                    className={`redisPersistencePacket route-${packet.route}`}
                    data-route={packet.route}
                    style={{
                      '--packet-duration': `${packet.duration}ms`,
                    } as React.CSSProperties}
                    onAnimationEnd={() => setPackets((current) => current.filter((item) => item.id !== packet.id))}
                    aria-hidden="true"
                  >{packet.icon}</span>
                );
              })}

              {floatingTexts.map((item) => (
                <span
                  key={item.id}
                  className={`redisPersistenceFloat redisPersistenceFloat-${item.target} ${item.tone}`}
                  onAnimationEnd={() => setFloatingTexts((current) => current.filter((candidate) => candidate.id !== item.id))}
                  aria-hidden="true"
                >{item.text}</span>
              ))}
            </div>
            </div>

            <aside className="redisPersistenceSidePanel" aria-label="Điều khiển và activity log">
              <div className="redisPersistenceControls" aria-label="Điều khiển mô phỏng Redis và persistent database">
                <button type="button" className="add" onClick={addToCart} disabled={controlsLocked}>👆 Bấm Thêm Vào Giỏ</button>
                <button type="button" className="cold" onClick={() => void runColdDataSim()} disabled={controlsLocked}>💤 Test Khôi Phục Dữ Liệu</button>
                <button type="button" className="reset" onClick={hardReset}>🔄 Đặt lại từ đầu</button>
              </div>

              <div className="redisPersistenceLogHeader"><span>Activity log</span><small>Worker / Redis / MongoDB</small></div>
              <div ref={consoleRef} className="redisPersistenceConsole" role="log" aria-live="polite" aria-label="Console Redis và MongoDB">
                {logs.map((entry) => (
                  <div key={entry.id}><span className="log-time">[{entry.time}]</span> <span className={`log-${entry.tone}`}>{entry.message}</span></div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <aside className="redisPersistenceBoundary" aria-label="Ranh giới độ bền của mô hình">
        <strong>Ranh giới cần nhớ</strong>
        <p>Đây là mô hình write-behind: phản hồi nhanh từ Redis không đồng nghĩa MongoDB đã ghi bền vững. Dirty state chưa tới kỳ flush có thể mất nếu Redis hoặc worker gặp sự cố. Workload cần durability chặt phải bổ sung Redis persistence hoặc durable change log/queue, retry idempotent và giám sát flush lag.</p>
      </aside>

      <RedisPersistentQuiz />
    </section>
  );
}

export function RedisLearningJourney({ chapterId }: { chapterId: string }) {
  if (chapterId === 'redis-map') return <RedisMapLesson />;
  return <RedisPersistentDatabaseLesson chapterId={chapterId} />;
}
