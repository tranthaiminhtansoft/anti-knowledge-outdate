const workloadConfigurationYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payments-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payments-api
  template:
    metadata:
      labels:
        app: payments-api
    spec:
      terminationGracePeriodSeconds: 75
      tolerations:
        - key: dedicated
          operator: Equal
          value: payments
          effect: NoSchedule
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: nodepool
                    operator: In
                    values: [payments]
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 80
              preference:
                matchExpressions:
                  - key: workload-tier
                    operator: In
                    values: [latency-optimized]
      containers:
        - name: api
          image: example/payments-api:1.4.0
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              memory: 512Mi
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 10"]`;

const probesYaml = `containers:
  - name: api
    image: example/payments-api:1.4.0
    ports:
      - name: http
        containerPort: 8080

    startupProbe:
      httpGet:
        path: /startupz
        port: http
      periodSeconds: 5
      timeoutSeconds: 1
      failureThreshold: 24   # startup budget ≈ 120s

    readinessProbe:
      httpGet:
        path: /readyz
        port: http
      periodSeconds: 5
      timeoutSeconds: 1
      failureThreshold: 3   # remove traffic after ≈ 10–15s
      successThreshold: 1

    livenessProbe:
      httpGet:
        path: /livez
        port: http
      periodSeconds: 10
      timeoutSeconds: 1
      failureThreshold: 3   # restart after ≈ 20–30s persistent failure`;

type DecisionRow = {
  setting: string;
  purpose: string;
  evidence: string;
  decision: string;
};

function DecisionTable({ rows, label }: { rows: DecisionRow[]; label: string }) {
  return (
    <div className="k8sDecisionTableWrap" role="region" aria-label={`${label} — cuộn ngang khi cần`} tabIndex={0}>
      <table className="k8sDecisionTable" aria-label={label}>
        <thead><tr><th>Cấu hình</th><th>Tại sao cần?</th><th>Lấy số liệu ở đâu?</th><th>Cách đặt value</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.setting}>
              <th scope="row">{row.setting}</th>
              <td>{row.purpose}</td>
              <td>{row.evidence}</td>
              <td>{row.decision}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KubernetesConfigurationGuide() {
  const rows: DecisionRow[] = [
    {
      setting: 'CPU request',
      purpose: 'Scheduler dùng CPU request để xét capacity; runtime dùng request làm trọng số chia CPU khi tranh chấp. Đây không phải lượng CPU tối thiểu luôn được cấp.',
      evidence: 'Đo CPU usage khi load test và production ở mức traffic mục tiêu; xem p50/p95, throttling, queue latency và thời gian xử lý request.',
      decision: 'Khởi đầu gần p95 CPU ổn định của một replica rồi canary. Tăng nếu latency tăng khi node bận; giảm nếu request luôn dư lớn. 250m = 0.25 core.',
    },
    {
      setting: 'Memory request / limit',
      purpose: 'Request phục vụ scheduling/eviction; vượt memory limit khiến container bị OOMKilled. Memory không throttling mềm như CPU.',
      evidence: 'Đo working set, startup peak, heap sau GC, p95/p99 và leak trend trong load test dài đủ lâu.',
      decision: 'Dùng high-watermark theo cửa sổ đủ dài, bao gồm startup/traffic peak, hành vi GC/leak và uncertainty đã đo. Headroom 10–30% chỉ là baseline minh họa để canary, không phải mặc định; limit phải chứa peak hợp lệ nhưng vẫn bảo vệ node.',
    },
    {
      setting: 'CPU limit',
      purpose: 'Giới hạn một container chiếm CPU, nhưng limit thấp có thể tạo CFS throttling và tăng tail latency dù node còn CPU.',
      evidence: 'Theo dõi container_cpu_cfs_throttled_* cùng p95/p99 latency dưới burst thực tế.',
      decision: 'Latency-sensitive workload thường chỉ đặt CPU request và để node chia phần CPU dư; chỉ đặt limit khi cần hard fairness/compliance, sau đó load test ngưỡng đó.',
    },
    {
      setting: 'Taint / toleration',
      purpose: 'Taint đẩy workload không phù hợp khỏi node; toleration chỉ cho phép Pod vào, không bảo đảm Pod sẽ chọn node đó.',
      evidence: 'Phân loại node theo dedicated pool, GPU, spot, security hoặc trạng thái; xác định workload nào được phép và interruption budget.',
      decision: 'Dùng NoSchedule cho ranh giới cứng, PreferNoSchedule cho ưu tiên mềm, NoExecute khi cần evict. tolerationSeconds phải bám RTO và thời gian workload chịu mất node.',
    },
    {
      setting: 'Node affinity',
      purpose: 'Thu hút/ép Pod tới node có label phù hợp: kiến trúc CPU, zone, hardware hoặc node pool. Nó bổ sung cho taint, không thay thế toleration.',
      evidence: 'Dùng label được quản trị ổn định; kiểm tra số node thỏa điều kiện, capacity và khả năng sống sót khi một zone/node pool lỗi.',
      decision: 'required chỉ dành cho constraint thật sự bắt buộc; preferred cho tối ưu. Weight 1–100 là điểm tương đối giữa preference, không phải phần trăm traffic.',
    },
    {
      setting: 'terminationGracePeriodSeconds',
      purpose: 'Cho app ngừng nhận traffic, xử lý request đang chạy, flush state rồi thoát sau SIGTERM trước khi kubelet gửi SIGKILL.',
      evidence: 'Đo p99 shutdown/drain time, max request duration, preStop time, queue flush và thời gian endpoint/LB ngừng route.',
      decision: 'Grace ≥ preStop + p99 graceful shutdown + 20–30% margin. Nếu app cần 55s và preStop 10s, 75s là baseline hợp lý rồi kiểm chứng bằng rollout/chaos test.',
    },
  ];

  return (
    <section className="k8sOpsGuide configurationGuide" aria-label="Kubernetes workload configuration guide">
      <div className="k8sOpsHeader">
        <span className="badge">Configuration</span>
        <h2>Cấu hình để scheduler đặt đúng chỗ và workload dừng an toàn</h2>
        <p>Không copy một con số “best practice” sang mọi service. Value tốt phải xuất phát từ traffic và concurrency mục tiêu, telemetry, load test, failure budget và giới hạn hạ tầng. Hãy lấy percentile theo từng container/replica thay vì snapshot hoặc trung bình toàn Deployment.</p>
      </div>

      <div className="configurationPurposeFlow" aria-label="Luồng quyết định cấu hình workload">
        <div><span>1</span><strong>Đo workload</strong><small>CPU, memory, latency, startup và shutdown.</small></div><b>→</b>
        <div><span>2</span><strong>Đặt scheduling intent</strong><small>Request, taint/toleration và affinity.</small></div><b>→</b>
        <div><span>3</span><strong>Đặt safety boundary</strong><small>Memory limit và termination grace.</small></div><b>→</b>
        <div><span>4</span><strong>Canary rồi hiệu chỉnh</strong><small>Quan sát throttling, OOM, pending và rollout.</small></div>
      </div>

      <DecisionTable rows={rows} label="Tiêu chí chọn giá trị cho Kubernetes workload configuration" />

      <div className="k8sOpsExampleGrid">
        <article>
          <span className="codeLanguage">deployment.yaml — số liệu minh họa</span>
          <pre><code>{workloadConfigurationYaml}</code></pre>
        </article>
        <article className="configurationRules">
          <h3>Cách đọc ví dụ</h3>
          <ul>
            <li><strong>250m/256Mi/512Mi không phải đáp án mặc định.</strong> Đây là baseline cần được thay bằng số đo của service.</li>
            <li>Toleration <code>dedicated=payments</code> cho phép scheduling; required affinity mới kéo Pod vào đúng <code>nodepool=payments</code>.</li>
            <li>Không đặt CPU limit trong ví dụ để tránh throttle workload nhạy latency; memory vẫn có limit để bảo vệ node.</li>
            <li><code>preStop</code> chạy trước khi kubelet gửi SIGTERM và cùng tiêu thụ grace period. App vẫn phải bắt SIGTERM và tự graceful shutdown; sleep không thay thế logic shutdown.</li>
          </ul>
        </article>
      </div>

      <div className="measurementLoop">
        <strong>Vòng lặp tìm con số:</strong>
        <span>Instrument</span><b>→</b><span>Load test traffic mục tiêu</span><b>→</b><span>Lấy p95/p99 + peak</span><b>→</b><span>Thêm headroom có lý do</span><b>→</b><span>Canary</span><b>↺</b><span>Điều chỉnh từ telemetry</span>
      </div>
    </section>
  );
}

export function KubernetesObservabilityGuide() {
  const rows: DecisionRow[] = [
    {
      setting: 'Readiness probe',
      purpose: 'Quyết định Pod có được nhận traffic qua Service hay không. Fail readiness không restart container.',
      evidence: 'Đo startup/warm-up, p99 endpoint latency, lỗi khi dependency thiết yếu mất và khoảng gián đoạn mà SLO cho phép.',
      decision: 'Probe phải trả lời “Pod có phục vụ request mới đúng không?”. period × failureThreshold gần với detection window; timeout > p99 probe latency nhưng phải ngắn.',
    },
    {
      setting: 'Liveness probe',
      purpose: 'Phát hiện process còn chạy nhưng đã deadlock/mất khả năng tự hồi phục để kubelet restart container.',
      evidence: 'Dựa trên failure mode thực, thời gian tự hồi phục tối đa và restart cost. Theo dõi restart count, events và false-positive khi CPU/IO spike.',
      decision: 'Probe chỉ kiểm tra sức khỏe nội tại; không phụ thuộc DB/API bên ngoài. Window phải dài hơn transient spike nhưng ngắn hơn recovery objective.',
    },
    {
      setting: 'Startup probe',
      purpose: 'Chặn readiness/liveness cho đến khi app khởi động xong, tránh liveness giết nhầm service khởi động chậm.',
      evidence: 'Đo p99 cold start gồm image init, app init, cache warm-up và JIT. Schema migration dùng Job hoặc bước deploy có coordination; không để mỗi replica tự migrate trừ khi thao tác cục bộ thật sự idempotent.',
      decision: 'failureThreshold × periodSeconds phải lớn hơn p99 startup + margin. Sau khi startup thành công, readiness/liveness mới bắt đầu điều khiển.',
    },
    {
      setting: 'timeout / thresholds',
      purpose: 'Cân bằng phát hiện nhanh với false positive. Probe quá gắt có thể tạo restart storm; quá lỏng kéo dài thời gian route traffic vào Pod lỗi.',
      evidence: 'Histogram latency của chính probe, CPU throttling, network jitter và SLO/RTO của workload.',
      decision: 'timeout > p99 probe latency + margin nhỏ; failureThreshold hấp thụ spike ngắn; successThreshold của readiness có thể tăng nếu trạng thái hay flap.',
    },
  ];

  return (
    <section className="k8sOpsGuide observabilityGuide" aria-label="Kubernetes readiness and liveness probe guide">
      <div className="k8sOpsHeader">
        <span className="badge">Observability & health management</span>
        <h2>Readiness bảo vệ traffic; Liveness kích hoạt restart</h2>
        <p>Probe không thay thế metrics, logs và traces. Probe biến một phần health signal thành hành động của Kubernetes: route hoặc ngừng route traffic, và chỉ restart khi process thực sự không thể tự hồi phục.</p>
      </div>

      <div className="probeTrafficFlow" aria-label="Luồng health probe quyết định traffic và restart">
        <div className="probeSource"><strong>Kubelet</strong><small>chạy probe định kỳ</small></div>
        <div className="probeBranch readinessBranch"><span>Readiness</span><strong>PASS → endpoint Ready, được route</strong><small>FAIL → ready=false, ngừng route; container vẫn chạy</small></div>
        <div className="probeBranch livenessBranch"><span>Liveness</span><strong>PASS → giữ container</strong><small>FAIL liên tiếp → kubelet restart</small></div>
        <div className="probeBranch startupBranch"><span>Startup</span><strong>Chưa PASS → chưa chạy hai probe còn lại</strong><small>Bảo vệ cold start chậm</small></div>
      </div>

      <DecisionTable rows={rows} label="Tiêu chí chọn giá trị cho readiness, liveness và startup probe" />

      <div className="probeFormulaGrid">
        <article><strong>Startup budget</strong><code>periodSeconds × failureThreshold</code><span>5s × 24 ≈ 120s để app cold-start.</span></article>
        <article><strong>Readiness detection</strong><code>failureThreshold × periodSeconds</code><span>3 × 5s: thường rút traffic sau khoảng 10–15s lỗi liên tục.</span></article>
        <article><strong>Liveness detection</strong><code>failureThreshold × periodSeconds</code><span>3 × 10s: restart sau khoảng 20–30s lỗi kéo dài.</span></article>
      </div>

      <div className="k8sOpsExampleGrid">
        <article>
          <span className="codeLanguage">container probes — số liệu minh họa</span>
          <pre><code>{probesYaml}</code></pre>
        </article>
        <article className="configurationRules">
          <h3>Thiết kế endpoint đúng</h3>
          <ul>
            <li><code>/livez</code> nên rẻ, cục bộ và không gọi database; DB outage không được tạo restart storm cho toàn bộ app.</li>
            <li><code>/readyz</code> chỉ kiểm tra dependency nếu thiếu dependency đó khiến Pod thật sự không thể phục vụ request mới.</li>
            <li>Không dùng cùng một endpoint nặng cho cả readiness và liveness.</li>
            <li>Kiểm chứng bằng kill process, deadlock giả lập, dependency outage, CPU pressure và rollout — không chỉ nhìn YAML hợp lệ.</li>
          </ul>
        </article>
      </div>

      <div className="keyConcept"><strong>Cách lấy con số:</strong> đo p99 startup/probe latency và transient failure duration; đặt detection window theo SLO/RTO; chạy failure injection; sau đó theo dõi <code>Ready</code>, endpoint changes, Kubernetes Events và container restart count để điều chỉnh.</div>
    </section>
  );
}
