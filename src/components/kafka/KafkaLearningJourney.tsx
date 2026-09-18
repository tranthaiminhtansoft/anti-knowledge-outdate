import { useEffect, useRef, useState } from "react";
import "./kafka-journey.css";

type Props = { chapterId: string; onOpenChapter?: (chapterId: string) => void };
const legacyChapterSections: Record<string, string> = {
  overview: "project",
  "api-flow": "flow",
  components: "architecture",
  architecture: "architecture",
  partitioning: "architecture",
  producer: "flow",
  consumer: "flow",
  rebalance: "failure",
  failure: "failure",
  production: "operations",
};
type Ack = "all" | "1" | "0";
type Mode = "normal" | "slow" | "failed";
type Event = {
  id: number;
  key: string;
  p: number;
  ack: Ack;
  stage: number;
  offset?: number;
  resultOffset?: number;
};
type Move = {
  from: "api" | "b0" | "b1" | "b2" | "payment" | "result" | "inventory" | "notification";
  to: "api" | "b0" | "b1" | "b2" | "payment" | "result" | "inventory" | "notification";
  id: number;
  key: string;
  label: string;
};
type Group = {
  pos: number;
  commit: number;
  done: number;
  mode: Mode;
  pending: number | null;
  last: string;
};
type State = {
  tick: number;
  seq: number;
  queue: Event[];
  active: Event | null;
  logs: Event[][];
  hw: number[];
  pos: number[];
  commit: number[];
  leaders: (number | null)[];
  up: boolean[];
  ends: number[][];
  workers: number;
  slow: boolean;
  election: number;
  recovery: number;
  rebalance: number;
  phase: number;
  last: Event | null;
  pending: (number | null)[];
  done: Set<number>;
  success: Event[];
  moves: Move[];
  trace: string[];
  groups: Record<"inventory" | "notification", Group>;
  running: boolean;
  key: string;
  acks: Ack;
  autoCommit: boolean;
  ins: number[];
  outs: number[];
};
const hash = (key: string) =>
  [...key].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 0) % 3;
const fresh = (): State => ({
  tick: 0,
  seq: 0,
  queue: [],
  active: null,
  logs: [[], [], []],
  hw: [0, 0, 0],
  pos: [0, 0, 0],
  commit: [0, 0, 0],
  leaders: [0, 1, 2],
  up: [true, true, true],
  ends: [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ],
  workers: 1,
  slow: false,
  election: 0,
  recovery: 0,
  rebalance: 0,
  phase: -1,
  last: null,
  pending: [null, null, null],
  done: new Set(),
  success: [],
  moves: [],
  trace: [],
  groups: {
    inventory: {
      pos: 0,
      commit: 0,
      done: 0,
      mode: "normal",
      pending: null,
      last: "Chưa có event",
    },
    notification: {
      pos: 0,
      commit: 0,
      done: 0,
      mode: "normal",
      pending: null,
      last: "Chưa có event",
    },
  },
  running: false,
  key: "order-123",
  acks: "all",
  autoCommit: true,
  ins: [],
  outs: [],
});
const stages = [
  "Key → partition",
  "Append leader",
  "Replicate",
  "ACK / durable",
  "Consumer read",
  "Commit offset",
];
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
type Packet = { color: string; motion: string; values: string; keyTimes: string; points: string; motionTimes: string; dur: string };
const AS_EDGES = [["edge blue", "M250 75V135", "aBlue"], ["edge blue", "M250 210V295", "aBlue"], ["edge blue", "M250 375V465", "aBlue"], ["edge red dashed", "M150 335H100Q88 335 88 323V50Q88 40 100 40H180", "aRed"], ["edge red dashed", "M295 545V590Q295 602 307 602H390Q402 602 402 590V50Q402 40 390 40H320", "aRed"]] as const;
const TO_EDGES = [["edge blue","M250 70V105","tGreen"],["edge green","M250 170V210","tGreen"],["edge green","M250 285V318Q250 330 238 330H130Q118 330 118 342V390","tGreen"],["edge green","M130 465V525","tGreen"],["edge green","M80 525V465","tGreen"],["edge green","M190 390V330Q190 318 202 318H218Q230 318 230 306V285","tGreen"],["edge green","M270 285V318Q270 330 282 330H370Q382 330 382 342V390","tGreen"],["edge red dashed","M360 247H475Q487 247 487 259V415Q487 427 475 427H479","tRed"],["edge green","M135 137H90Q78 137 78 125V40Q78 32 90 32H180","tGreen"]] as const;
const AS_MOTION = AS_EDGES.map(([, d], i) => [`as${i + 1}`, d] as const);
const TO_MOTION = [["to1",TO_EDGES[0][1]],["to2",TO_EDGES[1][1]],["to3",TO_EDGES[2][1]],["to4",TO_EDGES[3][1]],["to5a",TO_EDGES[4][1]],["to5b",TO_EDGES[5][1]],["to5c",TO_EDGES[6][1]],["to6",TO_EDGES[7][1]],["toAck",TO_EDGES[8][1]]] as const;
const packets = (dur: string, values: string[], times: string[], points: string[], motionTimes: string[], motion: string[], colors: string[]): Packet[] => motion.map((m, i) => ({ dur, motion: m, color: colors[i], values: values[i], keyTimes: times[i], points: points[i], motionTimes: motionTimes[i] }));
const AS_PACKETS = packets("11s",["1;1;0;0","0;0;1;1;0;0","0;0;1;1;0;0","0;0;1;1;0;0","0;0;1;1;0;0"],["0;.12;.13;1","0;.12;.13;.28;.29;1","0;.29;.30;.50;.51;1","0;.53;.54;.68;.69;1","0;.69;.70;.94;.95;1"],["0;1;1","0;0;1;1","0;0;1;1","0;0;1;1","0;0;1;1"],["0;.12;1","0;.12;.29;1","0;.29;.51;1","0;.53;.69;1","0;.69;.95;1"],["as1","as2","as4","as3","as5"],["blue","blue","red","blue","red"]);
const TO_PACKETS = packets("12s",["1;1;0;0","0;0;1;1;0;0","0;0;1;1;0;0","0;0;1;1;0;0","0;0;1;1;0;0","0;0;1;1;0;0","0;0;1;1;0;0","0;0;1;1;0;0","0;0;1;1;0;0"],["0;.09;.10;1","0;.09;.10;.20;.21;1","0;.16;.17;.28;.29;1","0;.27;.28;.44;.45;1","0;.44;.45;.56;.57;1","0;.56;.57;.65;.66;1","0;.65;.66;.75;.76;1","0;.75;.76;.84;.85;1","0;.85;.86;.98;.99;1"],["0;1;1","0;0;1;1","0;0;1;1","0;0;1;1","0;0;1;1","0;0;1;1","0;0;1;1","0;0;1;1","0;0;1;1"],["0;.09;1","0;.09;.21;1","0;.16;.29;1","0;.27;.45;1","0;.44;.57;1","0;.56;.66;1","0;.65;.76;1","0;.75;.85;1","0;.85;.99;1"],["to1","to2","toAck","to3","to4","to5a","to5b","to5c","to6"],["blue","orange","green","green","green","green","green","green","red"]);
function PacketDots({ packets: dots }: { packets: Packet[] }) { return <>{dots.map((p, i) => <circle className={`dot ${p.color}`} r="6" key={`${p.motion}-${i}`}><animate attributeName="opacity" dur={p.dur} repeatCount="indefinite" values={p.values} keyTimes={p.keyTimes}/><animateMotion dur={p.dur} repeatCount="indefinite" keyPoints={p.points} keyTimes={p.motionTimes}><mpath href={`#${p.motion}`}/></animateMotion></circle>)}</>; }
function Nodes({ nodes }: { nodes: ReadonlyArray<readonly [string, number, number, number, number, string, string, number, number, number]> }) { return <>{nodes.map(([kind,x,y,w,h,title,sub,tx,ty,sy],i) => <g className={`node ${kind}`} key={`${title}-${i}`}><rect x={x} y={y} width={w} height={h} rx="12"/><text className="title" x={tx} y={ty}>{title}</text><text className="sub" x={tx} y={sy}>{sub}</text></g>)}</>; }
function Diagram({ tobe }: { tobe?: boolean }) {
 const edges = tobe ? TO_EDGES : AS_EDGES, motion = tobe ? TO_MOTION : AS_MOTION, dots = tobe ? TO_PACKETS : AS_PACKETS;
 const labels = tobe ? [["blue",264,94,"① POST /payments"],["green",264,198,"② payment.requested"],["green",16,94,"③ HTTP 202"],["green",16,109,"không chờ consumers"],["green",38,320,"④ controlled consume"],["green",143,505,"⑤ DB write"],["green",14,487,"⑥ COMMIT OK"],["green",198,305,"⑦ Consumer publish"],["green",285,318,"payment.succeeded"],["red",374,235,"⑧ no commit → đọc lại"]] as const : [["blue",264,111,"① POST /payments × N"],["blue",264,260,"② synchronous writes"],["blue",264,426,"③ sync notify"],["red",18,255,"DB overload"],["red",18,270,"→ HTTP timeout"],["red",365,270,"Notification fail"],["red",365,285,"→ lỗi lan ngược"]] as const;
 const nodes = tobe ? [["",180,10,140,60,"Client","nhận 202 Accepted",250,38,55],["api",135,105,230,65,"Payment API","Kafka Producer",250,132,151],["kafka",140,210,220,75,"Kafka","buffer · fan-out · retry",250,240,260],["good",35,390,190,75,"Payment Consumer","scale theo consumer lag",130,420,441],["bad",285,390,194,75,"Notification Consumer","FAILED · offset chưa commit",382,418,439],["good",35,525,190,75,"Payments DB","SUCCEEDED · healthy",130,555,576]] as const : [["",180,15,140,60,"Client","giữ request mở",250,43,60],["api",150,135,200,75,"Payment API","điều phối đồng bộ",250,165,186],["bad",150,295,200,80,"Payments DB","OVERLOAD · scale chưa kịp",250,327,348],["bad",150,465,200,80,"Notification Service","TIMEOUT",250,497,518]] as const;
 return <svg viewBox="0 0 500 690" role="img" aria-label={tobe ? "TO-BE có Kafka" : "AS-IS không Kafka"}><defs>{(tobe ? [["tGreen","#55d6be"],["tRed","#ff647c"]] : [["aBlue","#62b9f4"],["aRed","#ff647c"]]).map(([id,stroke]) => <marker id={id} markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" key={id}><path d="M2 1.5L8.5 5L2 8.5" fill="none" stroke={stroke} strokeWidth="1.8"/></marker>)}</defs>{edges.map(([c,d,marker],i)=><path className={c} d={d} markerEnd={`url(#${marker})`} key={i}/>)}{motion.map(([id,d])=><path id={id} className="motion" d={d} key={id}/>)}{labels.map(([c,x,y,text])=><text className={`label ${c}`} x={x} y={y} key={text}>{text}</text>)}<Nodes nodes={nodes}/><PacketDots packets={dots}/></svg>;
}
function Overview() { return <div className="k-project-native page"><header><small>01 / WHY KAFKA</small><h2>Kafka tham gia vào Project</h2></header><div className="k-scope scope"><b>Cùng outcome:</b> Payment được xử lý và lưu trong Payments DB; Notification nhận kết quả thanh toán. TO-BE chỉ chèn Kafka và Consumer để buffer tải và cô lập lỗi.</div><section className="k-compare"><figure className="diagram asis"><figcaption><span>DIAGRAM 1 · AS-IS — KHÔNG KAFKA</span><h2>API gọi trực tiếp mọi thành phần</h2><p>Database và Notification đều nằm trong request path; một điểm chậm hoặc lỗi có thể lan ngược về Client.</p></figcaption><Diagram/><footer><span className="bad-text"><b>Hai failure cùng lan về request:</b></span> DB chưa scale kịp làm timeout; Notification lỗi cũng có thể khiến API báo thất bại dù Payment đã được ghi.</footer></figure><figure className="diagram tobe"><figcaption><span>DIAGRAM 2 · TO-BE — CÓ KAFKA</span><h2>Kafka buffer và fan-out độc lập</h2><p>Payment Consumer điều tiết tốc độ ghi DB; Notification Consumer lỗi không ảnh hưởng Payment đã thành công.</p></figcaption><Diagram tobe/><footer><span className="good-text"><b>Payment vẫn SUCCEEDED:</b></span> Kafka hấp thụ burst, DB nhận controlled writes. Notification Consumer chỉ commit offset sau khi xử lý thành công; nếu lỗi, record vẫn có thể được đọc lại.</footer></figure></section><section className="k-lessons"><article><h3>Case 1 · Database chưa scale kịp</h3><p>AS-IS đẩy burst thẳng xuống DB. TO-BE giữ backlog trong Kafka và Consumer ghi theo capacity an toàn.</p></article><article><h3>Case 2 · Notification bị lỗi</h3><p>AS-IS lỗi lan về request. TO-BE event còn trong Kafka; Notification Consumer retry độc lập.</p></article></section><div className="project-legend"><span>● HTTP/request</span><span>● xử lý thành công/độc lập</span><span>● điểm fail và retry</span></div></div>; }
function advance(s: State): State {
  const n: State = {
    ...s,
    tick: s.tick + 1,
    phase: -1,
    moves: [],
    trace: [...s.trace],
    ins: s.ins.filter((t) => t > s.tick - 9),
    outs: s.outs.filter((t) => t > s.tick - 9),
  };
  const log = (x: string) =>
    (n.trace = [...n.trace, `[${String(n.tick).padStart(3, "0")}] ${x}`].slice(
      -65,
    ));
  if (n.election && !--n.election) {
    n.leaders = [1, n.leaders[1], n.leaders[2]];
    log("KRaft: ISR B2 được bầu leader P0. Client refresh metadata.");
  }
  if (n.recovery && !--n.recovery) {
    n.up = [true, true, true];
    n.ends = n.ends.map(() => n.logs.map((x) => x.length));
    log("B1 bắt kịp log → trở lại ISR (follower P0).");
  }
  if (n.rebalance) n.rebalance--;
  let active = n.active;
  const queue = [...n.queue];
  if (!active && queue.length) active = queue.shift()!;
  const addMove = (from: Move["from"], to: Move["to"], event: Event, label: string) => {
    n.moves.push({ from, to, id: event.id, key: event.key, label });
  };
  if (active) {
    n.last = active;
    n.phase = active.stage;
    const p = active.p,
      leader = n.leaders[p];
    if (leader === null) {
      log(`P${p} chưa có leader · producer chờ metadata / retry.`);
      return { ...n, queue, active };
    }
    if (active.stage === 0) {
      addMove("api", `b${leader}` as Move["to"], active, `route P${p}`);
      log(`Route event-${active.id} → P${p}`);
      active = { ...active, stage: 1 };
    } else if (active.stage === 1) {
      const offset = n.logs[p].length;
      n.logs = n.logs.map((x, i) =>
        i === p ? [...x, { ...(active as Event), offset } as Event] : x,
      ) as Event[][];
      n.ends = n.ends.map((x, b) =>
        b === leader ? x.map((v, i) => (i === p ? offset + 1 : v)) : x,
      );
      addMove("api", `b${leader}` as Move["to"], active, `append P${p}`);
      if (active.ack === "1") addMove(`b${leader}` as Move["from"], "api", active, "ACK 1");
      log(`Append P${p} @${offset} · acks=${active.ack}`);
      n.ins = [...n.ins, n.tick];
      active = { ...active, offset, stage: 2 };
    } else if (active.stage === 2) {
      for (let b = 0; b < 3; b++) {
        if (n.up[b] && b !== leader) addMove(`b${leader}` as Move["from"], `b${b}` as Move["to"], active, `replica P${p}`);
      }
      n.ends = n.ends.map((x, b) => (n.up[b] ? x.map((v, i) => (i === p ? n.logs[p].length : v)) : x));
      n.hw = n.hw.map((v, i) => (i === p ? n.logs[p].length : v));
      log(`Replicate event-${active.id} → mọi ISR`);
      active = { ...active, stage: 3 };
    } else {
      if (active.ack === "all") addMove(`b${leader}` as Move["from"], "api", active, "ACK all");
      log("Record dưới HW, consumer có thể đọc.");
      active = null;
    }
  } else if (!n.rebalance && (!n.slow || n.tick % 6 === 0)) {
    for (let worker = 0; worker < Math.min(n.workers, 3); worker++) {
      const assigned = [0, 1, 2].filter(
        (p) => p % n.workers === worker && n.leaders[p] !== null,
      );
      let committed = false;
      for (const p of assigned) {
        if (n.pending[p] === null) continue;
        committed = true;
        if (n.autoCommit) {
          const committedEvent = n.logs[p][n.pending[p]! - 1];
          n.commit = n.commit.map((x, i) => (i === p ? n.pending[p]! : x));
          addMove("payment", "b1", committedEvent, `commit P${p} → ${n.pending[p]}`);
          n.phase = 5;
          log(`Commit P${p} = ${n.pending[p]}`);
        }
        n.pending = n.pending.map((x, i) => (i === p ? null : x));
      }
      if (committed) continue;
      const p = assigned.find((partition) => n.pos[partition] < n.hw[partition]);
      if (p === undefined) continue;
      const e = n.logs[p][n.pos[p]];
      n.pos = n.pos.map((x, i) => (i === p ? x + 1 : x));
      n.pending = n.pending.map((x, i) => (i === p ? n.pos[p] : x));
      n.phase = 4;
      addMove(`b${n.leaders[p]!}` as Move["from"], "payment", e, `read P${p} @${e.offset}`);
      if (!n.done.has(e.id)) {
        n.done = new Set(n.done).add(e.id);
        const result = { ...e, resultOffset: n.success.length };
        n.success = [...n.success, result];
        addMove("payment", "result", result, "payment.succeeded");
        n.outs = [...n.outs, n.tick];
        log(`Payment DB OK evt-${e.id} → payment.succeeded`);
      }
    }
  }
  for (const name of ["inventory", "notification"] as const) {
    const g = n.groups[name];
    const ng = { ...g };
    if (ng.mode === "failed")
      ng.last =
        n.success.length > ng.commit
          ? "FAILED · không commit; chờ retry"
          : "FAILED · chờ event";
    else if (!(ng.mode === "slow" && n.tick % 6 !== 0)) {
      if (ng.pending !== null) {
        const e = n.success[ng.pending];
        ng.done++;
        ng.commit = ng.pending + 1;
        ng.pos = ng.commit;
        addMove(name, "result", e, `${name} commit ${ng.commit}`);
        ng.pending = null;
        ng.last = `OK evt-${e.id} · commit ${ng.commit}`;
      } else if (ng.pos < n.success.length) {
        const e = n.success[ng.pos];
        ng.pending = ng.pos;
        ng.pos++;
        addMove("result", name, e, `read @${e.resultOffset}`);
        ng.last = `READ evt-${e.id}`;
      }
    }
    n.groups = { ...n.groups, [name]: ng };
  }
  return { ...n, queue, active };
}
export function KafkaLearningJourney({ chapterId, onOpenChapter }: Props) {
  const journeyRef = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(fresh);
  const [sendFeedback, setSendFeedback] = useState("");
  useEffect(() => {
    const sectionId = legacyChapterSections[chapterId] ?? "project";
    const section = journeyRef.current?.querySelector<HTMLElement>(`#${sectionId}`);
    if (typeof section?.scrollIntoView === "function") section.scrollIntoView({ block: "start" });
    onOpenChapter?.(chapterId);
  }, [chapterId, onOpenChapter]);
  useEffect(() => {
    if (!s.running) return;
    const id = window.setInterval(() => setS(advance), 750);
    return () => clearInterval(id);
  }, [s.running]);
  const send = (count = 1) =>
    setS((x) => {
      if (!x.key.trim()) return x;
      let y = { ...x, queue: [...x.queue] };
      for (let i = 0; i < count; i++) {
        const id = y.seq + 1,
          key = count === 1 ? y.key : `order-${id + 123}`;
        y = {
          ...y,
          seq: id,
          queue: [...y.queue, { id, key, p: hash(key), ack: y.acks, stage: 0 }],
          last: { id, key, p: hash(key), ack: y.acks, stage: 0 },
        };
      }
      return y;
    });
  const sendWithFeedback = (count = 1) => {
    if (!s.key.trim()) {
      setSendFeedback("⚠ Nhập Key trước");
      window.setTimeout(() => setSendFeedback(""), 1800);
      return;
    }
    send(count);
    setSendFeedback(count === 1 ? "✓ Order đã vào queue" : `✓ Đã thêm ${count} orders vào queue`);
    window.setTimeout(() => setSendFeedback(""), 1800);
  };
  const lag = sum(s.logs.map((x) => x.length)) - sum(s.commit);
  const setGroup = (name: "inventory" | "notification", mode: Mode) =>
    setS((x) => ({
      ...x,
      groups: { ...x.groups, [name]: { ...x.groups[name], mode } },
    }));
  const kill = () =>
    setS((x) => {
      if (x.up[0]) {
        const rollback = x.leaders[0] === 0 && x.active?.p === 0 && x.active.stage === 2;
        const logs = rollback ? x.logs.map((log, p) => p === 0 ? log.slice(0, x.hw[0]) : log) : x.logs;
        const active = rollback ? { ...x.active!, stage: 0, offset: undefined } : x.active;
        return {
          ...x, logs, active, up: [false, x.up[1], x.up[2]],
          leaders: x.leaders[0] === 0 ? [null, x.leaders[1], x.leaders[2]] : x.leaders,
          pos: rollback ? [Math.min(x.pos[0], x.hw[0]), x.pos[1], x.pos[2]] : x.pos,
          commit: rollback ? [Math.min(x.commit[0], x.hw[0]), x.commit[1], x.commit[2]] : x.commit,
          pending: rollback ? [null, x.pending[1], x.pending[2]] : x.pending,
          election: x.leaders[0] === 0 ? 2 : 0,
        };
      }
      return { ...x, recovery: 2 };
    });
  return (
    <div ref={journeyRef} className="kafkaCanonical" data-chapter={chapterId}>
      <main>
        <section id="project" className="lesson">
          <Overview />
          <p className="note">
            <b>Nối sang toàn project:</b> Order Service gọi Payment API →{" "}
            <code>payment.requested</code> (key = orderId). Payment ghi DB rồi
            phát <code>payment.succeeded</code>; Inventory và Notification đọc
            bằng hai group riêng.
          </p>
          <details>
            <summary>Hai điểm cần hiểu đúng khi đọc bản gốc</summary>
            <p>
              Không commit không tự tua lại vị trí đọc trong phiên hiện tại: ứng
              dụng phải retry/seek, hoặc restart rồi đọc từ committed offset.
            </p>
          </details>
        </section>
        <section id="architecture" className="lesson">
          <div className="section-head">
            <div className="eyebrow">02 / OPEN THE BLACK BOX</div>
            <h2>Kafka Cluster Architecture</h2>
            <p>Hộp “Kafka” ở trên, mở ra thành 3 broker. Event vẫn thuộc cùng order và nghiệp vụ Payment.</p>
          </div>
          <div className="box">
          <div className="bar spread"><div><b>Order Service → Payment API</b><p style={{ fontSize: 12 }}>Producer · metadata → key → partition leader</p></div><a href="#flow">Gửi order trong simulator ↓</a></div>
          <div className="rail"><span className="packet">payment.requested</span></div>
          <div className="live-lab">
            <div><Traffic s={s} /></div>
            <div className="live-controls">
              <h3>Live cluster · bộ điều khiển duy nhất</h3>
              <div className="bar"><label>
                Key{" "}
                <input
                  value={s.key}
                  maxLength={40}
                  onChange={(e) => setS((x) => ({ ...x, key: e.target.value }))}
                />
              </label>
              <label>
                ACK{" "}
                <select
                  value={s.acks}
                  onChange={(e) =>
                    setS((x) => ({ ...x, acks: e.target.value as Ack }))
                  }
                >
                  <option value="all">all · mọi ISR</option>
                  <option value="1">1 · leader</option>
                  <option value="0">0 · không chờ</option>
                </select>
              </label>
              </div>
              <div className="bar">
              <button className={`primary send-order-button${sendFeedback ? " is-sent" : ""}`} onClick={() => sendWithFeedback()}>
                {sendFeedback || "+ Send order"}
              </button>
              <button
                onClick={() => setS((x) => ({ ...x, running: !x.running }))}
              >
                {s.running ? "Pause" : "Start"}
              </button>
              <button
                onClick={() =>
                  setS((x) => ({
                    ...advance({ ...x, running: false }),
                    running: false,
                  }))
                }
              >
                Step →
              </button>
              <button onClick={() => setS(fresh())}>Reset lab</button>
              </div>
              <div className="bar">
              <button
                className="danger"
                disabled={!!s.election || !!s.recovery}
                onClick={kill}
              >
                {s.up[0]
                  ? "Kill Broker 1"
                  : s.recovery
                    ? "Recovering…"
                    : "Recover Broker 1"}
              </button>
              <button
                aria-pressed={s.slow}
                onClick={() => setS((x) => ({ ...x, slow: !x.slow }))}
              >
                Slow consumer: {s.slow ? "ON" : "OFF"}
              </button>
              <button
                disabled={s.workers >= 5 || !!s.rebalance}
                onClick={() =>
                  setS((x) => ({ ...x, workers: x.workers + 1, rebalance: 2 }))
                }
              >
                {s.rebalance
                  ? "Rebalancing…"
                  : s.workers >= 5
                    ? "5 workers · 2 idle"
                    : "+ Add worker"}
              </button>
              <button className="primary" onClick={() => sendWithFeedback(30)}>
                ⚡ +30 orders
              </button>
              </div>
              <div className={`send-status${sendFeedback ? " is-visible" : ""}`} aria-live="polite">
                <span className="send-status-dot" aria-hidden="true" />
                {sendFeedback || (s.queue.length > 0
                  ? `${s.queue.length} order${s.queue.length === 1 ? "" : "s"} đang chờ xử lý · bấm Start hoặc Step`
                  : "Sẵn sàng nhận order · bấm Send order để tạo event")}
              </div>
            <div className="live-monitor">
                {s.up.filter(Boolean).length}/3 brokers · URP{" "}
                {s.up.every(Boolean) ? 0 : 3} · offline{" "}
                {s.leaders.filter((x) => x === null).length}
              </div>
              <div className="live-monitor">
                Payment lag {lag} · {s.workers} workers ·{" "}
                {s.rebalance ? "REBALANCING" : s.slow ? "SLOW" : "NORMAL"}
              </div>
              <div className="live-monitor">
                In / processed: {s.logs.flat().length} / {s.success.length} ·
                tick {s.tick}
              </div>
              <small>Đây là bộ điều khiển duy nhất. Packet có eventId thật của lần gửi. Xanh: record / ACK; vàng: commit. Step chạy một nhịp. Bảng replicas chi tiết ngay dưới.</small>
            </div>
          </div>
          <div className="controller"><b>KRaft quorum · C1 active / C2, C3 standby</b><br /><small>{s.election ? `B1 heartbeat lost → P0 leader election (${s.election} nhịp)` : s.recovery ? "B1 đang fetch log để gia nhập lại ISR" : "Metadata & leader election · control plane, không chở order event"}</small></div>
          <div className="bar spread" style={{ marginBottom: 14 }}><b>Topic: payment.requested</b><span className="pill">3 partitions · RF=3 · min ISR=2</span></div>
          <div className="component-glossary"><h3>Nhìn nhanh · mỗi thành phần làm gì?</h3>{[["Producer","Gửi event vào Kafka."],["Broker","Lưu log và phục vụ đọc/ghi."],["Topic","Luồng event cùng loại."],["Partition","Nhánh log có thứ tự riêng."],["Leader","Nhận ghi cho partition."],["Follower","Sao chép leader để dự phòng."],["ISR","Replica đang theo kịp leader."],["KRaft controller","Quản lý metadata và bầu leader."],["Consumer","Đọc và xử lý event."],["Consumer Group","Chia partition giữa các consumer."],["Offset","Vị trí của record trong partition."],["Commit","Đánh dấu vị trí có thể phục hồi."]].map(([term, meaning]) => <div key={term}><b>{term}</b><small>{meaning}</small></div>)}</div>
          <div className="three brokers">
            {s.up.map((up, b) => (
              <div className={`broker ${up ? "" : "down"}`} key={b}>
                <div className="bar spread"><b>Broker {b + 1}</b><span className="status">{up ? "ONLINE" : s.recovery && b === 0 ? `RECOVERING ${s.recovery}` : "OFFLINE"}</span></div>
                {[0, 1, 2].map((p) => (
                  <div key={p} className={`replica ${s.leaders[p] === b ? "leader" : ""} ${s.active?.p === p && up ? "hot" : ""}`}>
                    P{p} · {s.leaders[p] === b ? "★ LEADER" : "FOLLOWER"}
                    <small>log end {s.ends[b][p]} · last offset {s.ends[b][p] - 1} · {up ? "ISR" : "OUT OF ISR"}</small>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="architecture-caption">★ Leader nhận produce · Followers fetch từ leader · ISR = replicas đang theo kịp (gồm leader). RF=3 mở rộng mô hình replica của bản flash-sale.</p>
          <div className="rail"><span className="packet">poll / fetch →</span></div>
          <div className="service assignment"><b>Payment Consumer Group</b><div className="readout">{Array.from({ length: s.workers }, (_, w) => `Worker ${w + 1} → ${s.rebalance ? "REBALANCING" : [0, 1, 2].filter((p) => p % s.workers === w).map((p) => `P${p}`).join(", ") || "IDLE"}`).join("\n")}</div><small>Group coordinator (broker) quản lý membership/offset; KRaft controller quản lý metadata cluster.</small></div>
          <div className="deployment-map"><h3>Deployment map · 4 lớp không nên trộn</h3><p>K8s tạo pod. Code Kafka trong pod tạo consumer. Kafka assign partition. Broker chỉ lưu log và replica.</p><div className="map-chain"><div><b>Kubernetes</b><small>{s.workers} consumer pod{s.workers === 1 ? "" : "s"}</small></div><i>→</i><div><b>Consumer Group</b><small>{s.workers} consumer instance{s.workers === 1 ? "" : "s"}</small></div><i>→</i><div><b>Topic partitions</b><small>3 partitions · {Math.min(s.workers, 3)} active{s.workers > 3 ? ` · ${s.workers - 3} idle` : ""}</small></div></div><table><thead><tr><th>Tình huống</th><th>Điều xảy ra</th></tr></thead><tbody><tr><td>3 partitions · 4 pods</td><td>3 consumer active, 1 pod idle; Kafka không tự tạo P4.</td></tr><tr><td>16 partitions · 16 pods</td><td>Có thể dùng 16 consumer song song nếu workload phân bố đều.</td></tr><tr><td>16 partitions · 3 brokers</td><td>Broker chia leader/follower; RF=3 thì mỗi partition có một replica trên mỗi broker.</td></tr></tbody></table><p className="map-rule"><b>Quy tắc:</b> số consumer active tối đa bị giới hạn bởi số partition mà group subscribe. <code>Broker ≠ pod scaler</code>; K8s scale pod, Kafka rebalance assignment.</p></div>
          <div className="rail"><span className="packet">DB → payment.succeeded</span></div>
          <div className="service">Payments DB<small>{s.success.length} payments succeeded</small><div className="readout">payment.succeeded · 1 partition minh họa · log end {s.success.length}</div></div>
          <div className="downstream architecture-downstream">{(["inventory", "notification"] as const).map((name) => <div className="service" key={name}><b>{name[0].toUpperCase() + name.slice(1)} group</b><small>{s.groups[name].done} {name === "inventory" ? "reservations" : "notifications"} · lag {s.success.length - s.groups[name].commit}</small><label>Consumer mode <select value={s.groups[name].mode} onChange={(e) => setGroup(name, e.target.value as Mode)}><option value="normal">Normal</option><option value="slow">Slow · mỗi 6 nhịp</option><option value="failed">Failed · không commit</option></select></label><div className="group-stats">{s.groups[name].last} | read {s.groups[name].pos} · commit {s.groups[name].commit} · lag {s.success.length - s.groups[name].commit} · done {s.groups[name].done}</div></div>)}</div>
          <p className="note">Hai group downstream mỗi bên nhận toàn bộ <code>payment.succeeded</code>. Các worker trong <em>cùng</em> group chia partition. Topic kết quả có log riêng (1 partition minh họa). Mỗi group có read position và committed offset riêng. Thử Notification Failed → gửi order → Inventory vẫn xử lý; chuyển Normal để retry và xả lag.</p>
          </div>
        </section>
        <section id="flow" className="lesson">
          <header>
            <small>03 / FOLLOW ONE EVENT</small>
            <h2>How Messages Actually Flow</h2>
            <p>Các nút Send / Step / Start / scenario nằm cạnh cluster ở phần 02 để bạn vừa bấm vừa nhìn packet chạy. Phần này tập trung giải thích từng bước và offset.</p>
          </header>
          <p className="flow-intro">Chế độ giảng giải: xử lý hết hàng chờ producer rồi mới chạy consumer để từng bước dễ quan sát. Kafka thật cho hai phía chạy đồng thời.</p>
          <p className="flow-source"><b>Nguồn event:</b> Payment API tạo <code>payment.requested</code> rồi gửi vào Kafka. Từ bước 01 đến 04 là việc của Kafka cluster; bước 05 và 06 là việc của Payment Consumer Group.</p>
          <div className="flow-ownership"><div><b>Kafka cluster · 01–04</b><small>chọn partition → append leader → replicate follower/ISR → trả ACK</small></div><div><b>Consumer app · 05–06</b><small>poll/read → xử lý DB → commit offset</small></div></div>
          <div className="steps">
            {stages.map((x, i) => (
              <div className={s.phase === i ? "active" : ""} key={x}>
                0{i + 1}
                <br />
                {x}
              </div>
            ))}
          </div>
          <pre className="event">
            {JSON.stringify(
              s.last
                ? {
                    eventId: `evt-${s.last.id}`,
                    type: "payment.requested",
                    orderId: s.last.key,
                    partition: s.last.p,
                    offset: s.last.offset ?? "pending",
                    acks: s.last.ack,
                  }
                : { type: "payment.requested", orderId: "order-123" },
              null,
              2,
            )}
          </pre>
          <p className="note" aria-live="polite">
            {s.moves.map((move) => `evt-${move.id} [${move.key}] ${move.from} → ${move.to} · ${move.label}`).join(" | ") || "Sẵn sàng. Gửi order đầu tiên."}
          </p>
          <table>
            <thead>
              <tr>
                <th>Partition</th>
                <th>Log end</th>
                <th>High watermark</th>
                <th>Read position</th>
                <th>Committed</th>
                <th>Lag</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2].map((p) => (
                <tr key={p}>
                  <td>P{p}</td>
                  <td>{s.logs[p].length}</td>
                  <td>{s.hw[p]}</td>
                  <td>{s.pos[p]}</td>
                  <td>{s.commit[p]}</td>
                  <td>{s.logs[p].length - s.commit[p]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="commit">
            <b>Commit offset = bookmark</b>
            <code>Đọc @17 → DB OK → commit 18</code>
            <label>
              <input
                type="checkbox"
                checked={s.autoCommit}
                onChange={(e) =>
                  setS((x) => ({ ...x, autoCommit: e.target.checked }))
                }
              />{" "}
              Commit sau xử lý
            </label>
            <button
              onClick={() =>
                setS((x) => ({
                  ...x,
                  commit: [...x.pos],
                  pending: [null, null, null],
                }))
              }
            >
              Commit now
            </button>
            <button
              onClick={() =>
                setS((x) => ({
                  ...x,
                  pos: [...x.commit],
                  pending: [null, null, null],
                }))
              }
            >
              Restart / replay
            </button>
          </div>
        </section>
        <section id="failure" className="lesson">
          <header>
            <small>04 / BREAK IT, THEN SCALE IT</small>
            <h2>Failure & Scale</h2>
            <p>Dùng bộ điều khiển duy nhất cạnh cluster ở phần 02; các thẻ dưới đây giải thích kết quả sau mỗi thao tác.</p>
          </header>
          <div className="scenarios">
            <article>
              <b>01 · Broker down</b>
              <p>B1 dừng → P0 tạm mất leader → controller chọn ISR còn sống. RF 3 còn 2 bản sao, vẫn đạt min ISR.</p>
              <mark>
                {s.election
                  ? "P0 offline → electing leader"
                  : `${s.up.filter(Boolean).length}/3 online · P0 leader ${s.leaders[0] === null ? "—" : `B${s.leaders[0]! + 1}`}`}
              </mark>
            </article>
            <article>
              <b>02 · Slow consumer</b>
              <p>
                Payment worker chỉ đọc mỗi 6 nhịp. Log tăng nhanh hơn commit → lag tăng; downstream đến chậm.
              </p>
              <mark>Điều khiển: Slow consumer cạnh cluster</mark>
            </article>
            <article>
              <b>03 · Add consumer</b>
              <p>
                Rebalance tạm dừng đọc rồi chia lại 3 partition. Worker thứ 4 idle;
                key nóng vẫn chỉ có một worker.
              </p>
              <mark>Điều khiển: Add worker cạnh cluster</mark>
            </article>
          </div>
          <div className="spike-card"><div><b>04 · Traffic spike</b><p>30 orders, nhiều key → backlog → tăng workers để bắt kịp.</p></div><mark>Điều khiển: +30 orders cạnh cluster</mark></div>
          <p className="note">Thử ở phần 02: +30 orders → Slow ON → Start → xem lag → Slow OFF và thêm worker.</p>
        </section>
        <section id="operations" className="lesson">
          <header>
            <small>05 / OPERATE WITH SIGNALS</small>
            <h2>Kafka for DevOps</h2>
            <p>Chỉ những tín hiệu cần nhìn. Số liệu lấy từ cùng simulator; dung lượng và throughput là giá trị mô phỏng.</p>
          </header>
          <div className="metrics">
            {[
              ["Broker health", `${s.up.filter(Boolean).length}/3`],
              ["Under-replicated", String(s.up.every(Boolean) ? 0 : 3)],
              [
                "Offline partitions",
                String(s.leaders.filter((x) => x === null).length),
              ],
              ["Consumer lag", String(lag)],
              ["Disk (demo)", `${sum(s.ends.map(sum))} KiB`],
              ["Throughput", `${s.logs.flat().length} / ${s.success.length}`],
            ].map(([a, b]) => (
              <article key={a}>
                <small>{a}</small>
                <strong>{b}</strong>
                <small>{a === "Broker health" ? "Mất broker → kiểm tra khả dụng." : a === "Under-replicated" ? "Partitions có ISR < RF 3." : a === "Offline partitions" ? "Không có leader → không đọc/ghi." : a === "Consumer lag" ? "Payment group · log end − committed." : a === "Disk (demo)" ? "1 KiB/replica record · budget 1 MiB; không xóa khi commit." : "In / processed · records mỗi 10 nhịp."}</small>
              </article>
            ))}
          </div>
          <div className="signal-table"><h3>Đọc tín hiệu → biết vấn đề ở đâu</h3><table><thead><tr><th>Tín hiệu</th><th>Cần chú ý</th><th>Ý nghĩa</th></tr></thead><tbody><tr><td>Broker health</td><td>Broker mất heartbeat</td><td>Mất capacity / giảm redundancy</td></tr><tr><td>URP / Offline partitions</td><td>URP kéo dài / offline &gt; 0</td><td>Replica thiếu / partition không phục vụ</td></tr><tr><td>Consumer lag</td><td>Tăng liên tục theo group + partition</td><td>Xử lý không theo kịp, hoặc chưa commit</td></tr><tr><td>Disk</td><td>Dung lượng trống &amp; thời gian tới đầy</td><td>Log tồn tại dù consumer đã đọc</td></tr><tr><td>Throughput</td><td>Ingress vượt processing dài hạn</td><td>Backlog tăng; kiểm tra key nóng / consumer</td></tr></tbody></table></div>
          <div className="downstream">
            {(["inventory", "notification"] as const).map((name) => (
              <article key={name}>
                <b>{name[0].toUpperCase() + name.slice(1)} group</b>
                <select
                  value={s.groups[name].mode}
                  onChange={(e) => setGroup(name, e.target.value as Mode)}
                >
                  <option value="normal">normal</option>
                  <option value="slow">slow</option>
                  <option value="failed">failed</option>
                </select>
                <code>
                  {s.groups[name].last} | read {s.groups[name].pos} · commit{" "}
                  {s.groups[name].commit} · lag{" "}
                  {s.success.length - s.groups[name].commit}
                </code>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
function Traffic({ s }: { s: State }) {
  const coords = {
    api: [110, 45],
    b0: [110, 145],
    b1: [370, 145],
    b2: [630, 145],
    payment: [370, 245],
    result: [370, 335],
    inventory: [110, 425],
    notification: [630, 425],
  } as const;
  const nodes = [
    ["api", "Payment API · producer"],
    ["b0", `B1 ${s.up[0] ? "ONLINE" : "DOWN"}`],
    ["b1", "B2 ONLINE"],
    ["b2", "B3 ONLINE"],
    ["payment", `Payment group · ${s.workers} worker${s.workers === 1 ? "" : "s"}`],
    ["result", "payment.succeeded"],
    ["inventory", `Inventory · ${s.groups.inventory.done}`],
    ["notification", `Notification · ${s.groups.notification.done}`],
  ] as const;
  const links = [
    ["api", "b0"], ["api", "b1"], ["api", "b2"],
    ["b0", "b1"], ["b1", "b2"], ["b0", "b2"],
    ["b0", "payment"], ["b1", "payment"], ["b2", "payment"],
    ["payment", "result"], ["result", "inventory"], ["result", "notification"],
  ] as const;
  return (
    <>
      <div className="live-map">
        <svg id="trafficSvg" viewBox="0 0 740 470" role="img" aria-label="Event traffic: producer, brokers, payment và hai group độc lập">
          <defs>
            {links.map(([from, to]) => {
              const [x1, y1] = coords[from];
              const [x2, y2] = coords[to];
              return <path id={`route-${from}-${to}`} d={`M${x1} ${y1} L${x2} ${y2}`} key={`${from}-${to}`} />;
            })}
          </defs>
          {links.map(([from, to]) => {
            const [x1, y1] = coords[from];
            const [x2, y2] = coords[to];
            return <path className="traffic-edge" d={`M${x1} ${y1} L${x2} ${y2}`} key={`${from}-${to}-visible`} />;
          })}
          {nodes.map(([id, name]) => {
            const [x, y] = coords[id];
              const nodeWidth = id === "inventory" || id === "notification" ? 150 : 196;
              return <g key={id} className="traffic-node">
              <rect x={x - nodeWidth / 2} y={y - 23} width={nodeWidth} height="46" rx="10" className={id === "b0" && !s.up[0] ? "offline" : ""} />
              <text x={x} y={y + 4}>{name}</text>
              <text className="sub" x={x} y={y + 18}>{id.startsWith("b") ? `partition replicas · log end ${s.logs.flat().length}` : ""}</text>
            </g>;
          })}
          {s.moves.map((move, i) => {
            const [x1, y1] = coords[move.from];
            const [x2, y2] = coords[move.to];
            const delayed = move.label === "payment.succeeded" || move.label === "ACK 1";
            const commit = move.label.includes("commit");
            return <g transform={`translate(${x1} ${y1})`} key={`${move.from}-${move.to}-${move.id}-${i}`}>
              <g className="event-packet">
                <rect x="-35" y="-12" width="70" height="24" rx="7" fill={commit ? "#fbbf24" : "#67e8f9"} />
                <text textAnchor="middle" y="4">evt-{move.id}</text>
                <animateTransform attributeName="transform" type="translate" from="0 0" to={`${x2 - x1} ${y2 - y1}`} dur=".48s" begin={delayed ? ".12s" : "0s"} fill="freeze" />
              </g>
            </g>;
          })}
        </svg>
      </div>
      <div className="packet-trace" aria-live="polite">{s.moves.map((move) => `evt-${move.id} [${move.key}] ${move.from} → ${move.to} · ${move.label}`).join(" | ") || "Không có record di chuyển ở nhịp này."}</div>
    </>
  );
}
