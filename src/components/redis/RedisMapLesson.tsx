import React from 'react';
import { redisMapQuestions } from './redisJourneyData';

type Strategy = 'standalone' | 'replica' | 'sentinel' | 'cluster';
const strategies: Record<Strategy, { label: string; summary: string; nodes: Array<[string, string, string]> }> = {
  standalone: { label: 'Standalone', summary: 'Một Redis process: đơn giản cho cache hoặc development, nhưng không có HA.', nodes: [['Primary', 'WRITE + READ', 'primary']] },
  replica: { label: 'Primary–Replica', summary: 'Primary nhận write; replica sao chép dữ liệu và có thể chia read.', nodes: [['Primary', 'WRITE', 'primary'], ['Replica', 'READ COPY', 'replica']] },
  sentinel: { label: 'Sentinel', summary: 'Nhiều Sentinel giám sát, đạt quorum để xác nhận lỗi và tự đưa replica lên primary.', nodes: [['Primary', 'WRITE', 'primary'], ['Replica', 'FAILOVER', 'replica'], ['Sentinel 1', 'MONITOR', 'sentinel'], ['Sentinel 2', 'MONITOR', 'sentinel'], ['Sentinel 3', 'MONITOR', 'sentinel']] },
  cluster: { label: 'Cluster', summary: 'Nhiều primary sở hữu hash slot; replica bảo vệ từng shard để scale ngang.', nodes: [['Primary A', '0–5460 · WRITE', 'primary'], ['Replica A', 'COPY A', 'replica'], ['Primary B', '5461–10922 · WRITE', 'primary'], ['Replica B', 'COPY B', 'replica'], ['Primary C', '10923–16383 · WRITE', 'primary'], ['Replica C', 'COPY C', 'replica']] },
};
const components = [
  ['Network I/O', 'Nhận connection và đọc byte từ client.'], ['RESP parser', 'Giải mã protocol Redis thành command.'], ['ACL / state', 'Kiểm tra quyền và trạng thái server.'], ['Command engine', 'Thực thi command trên keyspace.'], ['Keyspace', 'Dữ liệu trong memory và expiry.'], ['Persistence', 'AOF/RDB ghi bền khi được cấu hình.'], ['Replication', 'Phát thay đổi sang replica.'], ['Response writer', 'Gửi RESP response về client.'],
];
const dataTypes = [
  ['String', 'counter, cache value', 'SET / GET / INCR'], ['Hash', 'profile fields hoặc cart fields', 'HSET / HGET / HINCRBY'], ['List', 'queue đơn giản hoặc recent items', 'LPUSH / RPOP / LRANGE'], ['Set', 'unique tags và membership', 'SADD / SISMEMBER / SINTER'], ['Sorted Set', 'leaderboard và priority', 'ZADD / ZRANGE / ZREVRANK'], ['Stream', 'event log và consumer groups', 'XADD / XREADGROUP / XACK'], ['Bitmap', 'attendance hoặc trạng thái boolean theo id số', 'SETBIT / GETBIT / BITCOUNT'], ['HyperLogLog', 'ước lượng unique visitors với ít memory', 'PFADD / PFCOUNT / PFMERGE'], ['Geospatial', 'tìm địa điểm trong bán kính', 'GEOADD / GEOSEARCH / GEODIST'],
];

export function RedisMapLesson() {
  const [tab, setTab] = React.useState<'deploy' | 'inside' | 'types'>('deploy');
  const [strategy, setStrategy] = React.useState<Strategy>('standalone');
  const [selectedComponent, setSelectedComponent] = React.useState(0);
  const [selectedType, setSelectedType] = React.useState(0);
  const flowSteps = [
    'Network I/O: nhận command từ Application Client.',
    'RESP parser: giải mã SET user:42 cart.',
    'ACL / state: kiểm tra quyền và trạng thái server.',
    'Command engine: thực thi SET trên keyspace.',
    'Keyspace: ghi cart; AOF và replication là nhánh điều kiện.',
    'Response writer: trả +OK về Application Client.',
  ];
  const [flow, setFlow] = React.useState('Bắt đầu ở Application Client; bấm Chạy luồng để xem từng bước.');
  const [flowStep, setFlowStep] = React.useState(-1);
  const [flowPlaying, setFlowPlaying] = React.useState(false);
  const [revealed, setRevealed] = React.useState<Record<number, boolean>>({});
  const active = strategies[strategy];
  const advanceFlow = React.useCallback(() => {
    setFlowStep((current) => {
      const next = current + 1;
      if (next >= flowSteps.length) {
        setFlowPlaying(false);
        return -1;
      }
      setFlow(flowSteps[next]);
      return next;
    });
  }, []);
  React.useEffect(() => {
    if (!flowPlaying) return undefined;
    const timer = window.setInterval(advanceFlow, 1200);
    return () => window.clearInterval(timer);
  }, [advanceFlow, flowPlaying]);
  return <section className="redisMapLesson" aria-label="Redis Map lesson">
    <header className="redisMapHead"><h2>Redis Map</h2><span>Mô hình triển khai → bên trong từng node</span></header>
    <div className="redisMapSubTabs" role="tablist" aria-label="Nội dung Redis Map">
      {([['deploy', 'Deploy strategy'], ['inside', 'Bên trong node'], ['types', 'Data types']] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>)}
    </div>
    {tab === 'deploy' && <section role="tabpanel" aria-label="Deploy strategy">
      <div className="redisMapTabs" role="tablist">{(Object.keys(strategies) as Strategy[]).map((id) => <button key={id} role="tab" aria-selected={strategy === id} onClick={() => setStrategy(id)}>{strategies[id].label}</button>)}</div>
      <div className="redisMapSummary"><h3>{active.label}</h3><p>{active.summary}</p></div>
      <div className="redisMapLegend"><span><i /> request</span><span><i className="copy" /> replication</span><span><i className="control" /> control plane</span></div>
      <div className={`redisMapDiagram strategy-${strategy}`}><div className="redisMapClient">📱<strong>Client / App</strong><small>RESP command</small></div><div className="redisMapBoundary"><span>Redis deployment boundary</span><div className="redisMapNodeGrid">{active.nodes.map(([name, detail, kind]) => <button className={`redisMapNode ${kind}`} key={name} onClick={() => setFlow(`${name}: ${detail}. ${active.summary}`)}><b>🗄️</b><strong>{name}</strong><small>{detail}</small></button>)}<div className="redisMapBus">Replication / cluster bus <small>tuỳ strategy</small></div></div></div></div>
      <div className="redisMapFlowControls"><button className="primary" onClick={() => { if (flowPlaying) { setFlowPlaying(false); } else { setFlowStep(-1); setFlowPlaying(true); advanceFlow(); } }}>{flowPlaying ? 'Tạm dừng' : '▶ Chạy luồng SET'}</button><button onClick={() => { setFlowPlaying(false); advanceFlow(); }}>Từng bước</button><button onClick={() => { setFlowPlaying(false); setFlowStep(-1); setFlow('Bắt đầu ở Application Client; bấm Chạy luồng để xem từng bước.'); }}>{flowStep >= 0 ? 'Dừng luồng' : 'Đặt lại'}</button><p className="redisMapLive" role="status">{flowStep >= 0 ? `${flowStep + 1}/${flowSteps.length} · ${flow}` : flow}</p></div>
    </section>}
    {tab === 'inside' && <section role="tabpanel" aria-label="Bên trong Redis node"><div className="redisMapCoreDiagram"><div className="redisMapSource">Client<br />SET cart</div><div className="redisMapCoreBoundary"><span>Redis process</span><div>{components.map(([name], index) => <button className={selectedComponent === index ? 'active' : ''} key={name} onClick={() => setSelectedComponent(index)}><b>{index + 1}</b>{name}</button>)}</div></div><div className="redisMapSource">Client<br />+OK</div></div><div className="redisMapComponentDetail"><h3>{components[selectedComponent][0]}</h3><p>{components[selectedComponent][1]}</p><dl><dt>Luồng lệnh</dt><dd>Client → Network I/O → RESP parser → ACL/state → Command Engine ↔ Keyspace → Response writer.</dd></dl></div></section>}
    {tab === 'types' && <section role="tabpanel" aria-label="Redis data types"><div className="redisMapTypeGrid">{dataTypes.map(([name], index) => <button key={name} aria-pressed={selectedType === index} onClick={() => setSelectedType(index)}>{name}</button>)}</div><div className="redisMapTypeDetail"><h3>{dataTypes[selectedType][0]}</h3><p>Dùng cho: {dataTypes[selectedType][1]}</p><dl><dt>Commands</dt><dd><code>{dataTypes[selectedType][2]}</code></dd></dl></div></section>}
    <section className="redisMapCheckpoints" aria-labelledby="redis-map-checkpoints"><h2 id="redis-map-checkpoints">Củng cố</h2>{redisMapQuestions.map(([question, answer], index) => <article key={question}><h3>{question}</h3><button type="button" aria-expanded={Boolean(revealed[index])} onClick={() => setRevealed((current) => ({ ...current, [index]: !current[index] }))}>{revealed[index] ? 'Ẩn đáp án' : 'Xem đáp án'}</button>{revealed[index] && <div><strong>Trả lời: </strong>{answer}</div>}</article>)}</section>
  </section>;
}
