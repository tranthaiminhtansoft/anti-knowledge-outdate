import React from 'react';

type DockerLesson = {
  intro: string;
  language: string;
  code: string;
  useCases: string[];
};

const dockerLessons: Record<string, DockerLesson> = {
  'docker-multistage-build': {
    intro: 'Multi-stage dùng nhiều FROM trong một Dockerfile: builder có toolchain để compile, runtime chỉ nhận artifact cần chạy.',
    language: 'Dockerfile',
    code: `FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80`,
    useCases: [
      'Frontend SPA cần Node để build nhưng production chỉ cần Nginx phục vụ dist.',
      'Go/Java/native app cần compiler lớn nhưng runtime chỉ cần binary hoặc JRE.',
      'Muốn giảm kích thước image và không đưa source/dev dependencies vào production.',
    ],
  },
  'docker-build-cache': {
    intro: 'Docker tái sử dụng layer khi instruction và input của layer chưa đổi. Hãy copy lockfile trước source để code change không làm mất cache dependency.',
    language: 'Dockerfile + .dockerignore',
    code: `FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build

# .dockerignore
node_modules
.git
dist
.env*`,
    useCases: [
      'CI build nhiều lần và dependency thay đổi ít hơn source code.',
      'Monorepo hoặc project có bước tải package tốn thời gian.',
      'Muốn giảm build context và tránh COPY nhầm secret/file rác.',
    ],
  },
  'docker-volume': {
    intro: 'Named volume do Docker quản lý và sống ngoài lifecycle container. Bind mount ánh xạ trực tiếp path host, phù hợp development nhưng phụ thuộc filesystem và permission host.',
    language: 'Shell',
    code: `# Named volume: data vẫn còn khi container được tạo lại
: "\${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}"
docker volume create pgdata
docker run --name db \
  -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  -v pgdata:/var/lib/postgresql/data postgres:17

# Bind mount: source trên host xuất hiện trong container
docker run --rm -v "$PWD:/app" -w /app node:22 npm run dev`,
    useCases: [
      'Named volume cho database/data service trong local lab.',
      'Bind mount source code để hot reload khi phát triển.',
      'Chia sẻ file giữa các container có cùng volume được khai báo.',
    ],
  },
  'docker-compose': {
    intro: 'Compose gom build, ports, environment, healthcheck, volume và network của nhiều service vào một file có thể chạy lại bằng docker compose up.',
    language: 'compose.yaml',
    code: `services:
  api:
    build: ./api
    depends_on:
      db:
        condition: service_healthy
    environment:
      PGHOST: db
      PGPORT: 5432
      PGUSER: app
      PGPASSWORD: \${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
      PGDATABASE: app
    ports: ["3000:3000"]

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 3s
      retries: 10
    volumes: ["pgdata:/var/lib/postgresql/data"]

volumes:
  pgdata:`,
    useCases: [
      'Local development cần API, database, cache hoặc queue chạy cùng nhau.',
      'Demo/integration test cần stack tái lập bằng một lệnh.',
      'CI cần database ephemeral on-demand: mỗi job dùng Compose project riêng, chờ healthcheck, chạy migration/test rồi docker compose down -v trong bước cleanup.',
      'Onboarding team: giảm danh sách docker run và cấu hình thủ công.',
    ],
  },
  'docker-network': {
    intro: 'Container trên cùng user-defined network gọi nhau bằng DNS tên container/service. Port publishing chỉ tạo đường từ host vào container.',
    language: 'Shell',
    code: `docker network create app-net

docker run -d --name api --network app-net my-api:latest
docker run -d --name web --network app-net -p 8080:80 my-web:latest

# Bên trong web container:
curl http://api:3000/health
# Host truy cập web:
curl http://localhost:8080`,
    useCases: [
      'Frontend/proxy gọi API nội bộ bằng service name thay vì IP động.',
      'Giữ database chỉ trong internal network, không publish port ra host.',
      'Publish duy nhất entrypoint web/gateway cho người dùng bên ngoài.',
    ],
  },
};

export function DockerCoreDiagram() {
  return (
    <section className="dockerCoreDiagram" aria-label="Kiến trúc core của Docker">
      <header className="staticDiagramHeader">
        <span className="badge">Docker Core</span>
        <h3>Build path và Run path là hai luồng khác nhau</h3>
        <p>Linux container chia sẻ kernel Linux host. Trên macOS/Windows, Docker Desktop chạy Linux container trong một Linux VM, nên container chia sẻ kernel của VM — không phải kernel macOS/Windows. Image cung cấp userspace/filesystem; namespaces và cgroups tạo isolation cùng resource control.</p>
      </header>

      <div className="dockerCoreEntry">
        <div className="dockerCoreNode cli"><strong>Docker CLI / API client</strong><small>docker build · run · pull · push</small></div>
        <span>→</span>
        <div className="dockerCoreNode engine"><strong>Docker Engine API / daemon</strong><small>nhận request và quản lý image, container, network, volume</small></div>
      </div>

      <div className="dockerPathGrid">
        <article>
          <span className="pathLabel">Build path</span>
          <div className="dockerPathSequence"><div><strong>BuildKit</strong><small>Dockerfile · layers · cache · secret mounts</small></div><b>→</b><div><strong>Image</strong><small>artifact bất biến gồm nhiều layers</small></div><b>↔</b><div><strong>Registry</strong><small>pull/push image: GHCR, Docker Hub…</small></div></div>
        </article>
        <article>
          <span className="pathLabel run">Run path</span>
          <div className="dockerPathSequence"><div><strong>containerd</strong><small>quản lý container lifecycle</small></div><b>→</b><div><strong>containerd-shim + runc</strong><small>tạo namespaces/cgroups và start process</small></div><b>→</b><div><strong>Container process</strong><small>process chạy từ image</small></div></div>
        </article>
      </div>

      <div className="dockerResourceGrid">
        <div><strong>Image</strong><small>Template userspace/filesystem bất biến</small></div>
        <div><strong>Registry</strong><small>Nơi Engine pull/push image</small></div>
        <div><strong>Network</strong><small>Tài nguyên Engine gắn cho container</small></div>
        <div><strong>Volume</strong><small>Dữ liệu nằm ngoài writable layer</small></div>
      </div>

      <div className="whyDocker">
        <strong>Tại sao cần Docker?</strong>
        <ul>
          <li>Đóng gói cùng runtime dependencies để giảm “máy tôi chạy được”.</li>
          <li>Tạo artifact image có version, có thể scan, ký và triển khai nhất quán.</li>
          <li>Cô lập process/resource tốt hơn chạy trực tiếp, nhưng không phải security boundary tuyệt đối như VM.</li>
        </ul>
      </div>

      <div className="dockerBuildChoices">
        <article>
          <span className="exampleTag">Mặc định nên chọn</span>
          <h4>Build trong Docker bằng multi-stage</h4>
          <p>Source → builder stage → artifact → runtime image</p>
          <ul><li>Toolchain được pin trong builder image.</li><li>Hợp native dependency và yêu cầu reproducibility.</li><li>Chỉ COPY artifact cần thiết; secret lúc build dùng BuildKit secret mount, không dùng ARG/ENV.</li></ul>
        </article>
        <article>
          <span className="exampleTag assistant">Khi CI đã kiểm soát chặt</span>
          <h4>Build ngoài rồi COPY artifact</h4>
          <p>CI/host build + test → artifact → Docker COPY → runtime image</p>
          <ul><li>Hợp pipeline có artifact signing/promotion riêng.</li><li>Phải khớp OS/architecture, glibc/musl và native libs.</li><li>Phải clean workspace, verify checksum và không copy secret.</li></ul>
        </article>
      </div>
    </section>
  );
}

const composeEphemeralCiScript = `# CI injects POSTGRES_PASSWORD as a masked secret
: "\${POSTGRES_PASSWORD:?inject POSTGRES_PASSWORD from CI}"
export COMPOSE_PROJECT_NAME="ci-\${CI_JOB_ID:-local}"

cleanup() {
  docker compose down -v --remove-orphans
}
trap cleanup EXIT INT TERM

docker compose up -d --wait db
npm run db:migrate
npm run test:integration`;

export function DockerLessonDetails({ articleId }: { articleId: string }) {
  const lesson = dockerLessons[articleId];
  if (!lesson) return null;
  return (
    <section className="dockerLessonDetails" aria-label="Code mẫu và use cases">
      <div className="dockerLessonIntro"><span className="badge">Sơ lược</span><p>{lesson.intro}</p></div>
      <div className="dockerLessonGrid">
        <article>
          <span className="codeLanguage">{lesson.language}</span>
          <pre><code>{lesson.code}</code></pre>
        </article>
        <article>
          <h3>Use cases</h3>
          <ul>{lesson.useCases.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </div>
      {articleId === 'docker-compose' && (
        <article className="ephemeralCiExample">
          <div>
            <span className="badge">CI on-demand</span>
            <h3>Ephemeral database cho test job</h3>
            <p>Mỗi job tạo Compose project riêng, đợi database healthy rồi luôn xóa container và volume khi job kết thúc. Test dùng database thật chính xác hơn nên gọi là integration/component test, không phải pure unit test.</p>
          </div>
          <pre><code>{composeEphemeralCiScript}</code></pre>
        </article>
      )}
    </section>
  );
}
