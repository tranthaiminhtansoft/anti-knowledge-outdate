import { useEffect, useRef, useState } from 'react';
import useCasesJson from './hermes-usecases-data.json';

type UseCase = {
  kicker: string;
  title: string;
  desc: string;
  analogy: string;
  edges: [string, string][];
};

const useCases = useCasesJson as unknown as Record<string, UseCase>;

function scopeArtifactCss(css: string) {
  const scoped = css
    .replace(/:root\s*\{/g, ':scope{')
    .replace(/html\s*\{/g, ':scope{')
    .replace(/body\.paused/g, '.hermesUseCasesBody.paused')
    .replace(/body\s*\{/g, '.hermesUseCasesBody{')
    .replace(/\.wrap/g, '.hermesUseCasesBody');

  return `@scope (.hermesUseCasesRuntime) { ${scoped} }`;
}

export function HermesUseCases() {
  const runtimeRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    const controller = new AbortController();
    const cleanups: Array<() => void> = [];
    let cancelled = false;
    let timer: number | undefined;
    let raf: number | undefined;

    const stopMotion = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      if (raf !== undefined) window.cancelAnimationFrame(raf);
      timer = undefined;
      raf = undefined;
    };
    cleanups.push(stopMotion);

    fetch(`${import.meta.env.BASE_URL}hermes-agent-human-body.html`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((source) => {
        if (cancelled) return;

        const parsed = new DOMParser().parseFromString(source, 'text/html');
        const sourceMain = parsed.querySelector('main.wrap');
        const sourceStyles = [...parsed.querySelectorAll('style')];
        if (!sourceMain || sourceStyles.length === 0) throw new Error('Artifact không hợp lệ');

        sourceMain.querySelector('.hero')?.remove();
        sourceMain.querySelector('footer')?.remove();
        sourceMain.querySelectorAll('script').forEach((script) => script.remove());
        sourceMain.querySelectorAll<SVGImageElement>('image[href]').forEach((image) => {
          const href = image.getAttribute('href');
          if (!href || /^(?:[a-z]+:|\/\/|#|data:)/i.test(href)) return;
          image.setAttribute(
            'href',
            `${import.meta.env.BASE_URL}${href.replace(/^\.\//, '')}`,
          );
        });
        sourceMain.className = 'hermesUseCasesBody';

        const style = document.createElement('style');
        style.dataset.hermesUseCasesStyle = 'true';
        style.textContent = scopeArtifactCss(
          sourceStyles.map((sourceStyle) => sourceStyle.textContent ?? '').join('\n'),
        );

        runtime.replaceChildren(style, sourceMain);

        const tabs = [...runtime.querySelectorAll<HTMLButtonElement>('.tab')];
        const paths = [...runtime.querySelectorAll<SVGPathElement>('.route')];
        const actors = [...runtime.querySelectorAll<SVGElement>('.actor')];
        const active = runtime.querySelector<SVGPathElement>('#active-route');
        const pulse = runtime.querySelector<SVGGElement>('#traffic');
        const stage = runtime.querySelector<SVGSVGElement>('#stage');
        const caseHead = runtime.querySelector<HTMLElement>('.case-head');
        const diagramShell = runtime.querySelector<HTMLElement>('.diagram-shell');
        const timeline = runtime.querySelector<HTMLElement>('#timeline');
        const pause = runtime.querySelector<HTMLButtonElement>('#pause');
        const responseTyping = runtime.querySelector<SVGElement>('#response-typing');
        const responseDots = runtime.querySelector<SVGTextElement>('#response-dots');
        const contextContract = runtime.querySelector<HTMLElement>('#context-contract');
        if (!active || !pulse || !stage || !caseHead || !diagramShell || !timeline || !pause || !responseTyping || !responseDots || !contextContract) {
          throw new Error('Thiếu thành phần tương tác');
        }

        const tabPanel = document.createElement('div');
        tabPanel.className = 'case-panel';
        tabPanel.id = 'hermes-usecase-panel';
        tabPanel.setAttribute('role', 'tabpanel');
        caseHead.before(tabPanel);
        tabPanel.append(caseHead, diagramShell, timeline);
        tabs.forEach((tab) => {
          const caseId = tab.dataset.case ?? 'gateway';
          tab.id = `hermes-usecase-tab-${caseId}`;
          tab.setAttribute('aria-controls', tabPanel.id);
        });

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const edgeMs = 2700;
        const holdMs = 350;
        runtime.style.setProperty('--edge', `${edgeMs}ms`);

        let current = 'gateway';
        let index = 0;
        let running = !reduced;
        let progress = 0;
        let lastTs: number | null = null;
        let inHold = false;
        let currentPath: SVGPathElement | null = null;
        let pathLength = 0;
        let speaking = false;

        const actorGeometries = (actor: SVGElement) => [
          ...actor.querySelectorAll<SVGGeometryElement>('.surface, .channel-panel, .person-outline'),
        ];

        const isInsideActor = (actor: SVGElement, point: DOMPoint) => {
          const stageMatrix = stage.getScreenCTM();
          if (!stageMatrix) return false;
          const screenPoint = point.matrixTransform(stageMatrix);
          return actorGeometries(actor).some((shape) => {
            const shapeMatrix = shape.getScreenCTM();
            if (!shapeMatrix) return false;
            const localPoint = screenPoint.matrixTransform(shapeMatrix.inverse());
            return shape.isPointInFill(localPoint) || shape.isPointInStroke(localPoint);
          });
        };

        const nearestGeometryAnchor = (actor: SVGElement, reference: DOMPoint) => {
          if (isInsideActor(actor, reference)) return reference;
          const stageMatrix = stage.getScreenCTM();
          if (!stageMatrix) return reference;
          const inverseStageMatrix = stageMatrix.inverse();
          const anchors = actorGeometries(actor).map((shape) => {
            const rect = shape.getBoundingClientRect();
            return new DOMPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
              .matrixTransform(inverseStageMatrix);
          });
          return anchors.reduce((nearest, anchor) => (
            Math.hypot(anchor.x - reference.x, anchor.y - reference.y)
              < Math.hypot(nearest.x - reference.x, nearest.y - reference.y)
              ? anchor
              : nearest
          ), anchors[0] ?? reference);
        };


        const refineBoundary = (
          actor: SVGElement,
          insidePoint: DOMPoint,
          outsidePoint: DOMPoint,
        ) => {
          let inside = insidePoint;
          let outside = outsidePoint;
          for (let pass = 0; pass < 10; pass += 1) {
            const midpoint = new DOMPoint((inside.x + outside.x) / 2, (inside.y + outside.y) / 2);
            if (isInsideActor(actor, midpoint)) inside = midpoint;
            else outside = midpoint;
          }
          return outside;
        };

        const connectedPath = (path: SVGPathElement, source: SVGElement, target: SVGElement) => {
          const length = path.getTotalLength();
          const sampleCount = Math.max(32, Math.ceil(length / 3));
          const basePoints = Array.from({ length: sampleCount + 1 }, (_, sampleIndex) => {
            const point = path.getPointAtLength((length * sampleIndex) / sampleCount);
            return new DOMPoint(point.x, point.y);
          });
          const sourceAnchor = nearestGeometryAnchor(source, basePoints[0]);
          const targetAnchor = nearestGeometryAnchor(target, basePoints.at(-1)!);
          const overlappingActors = isInsideActor(target, sourceAnchor);
          const baseStart = basePoints[0];
          const baseEnd = basePoints.at(-1)!;
          const points = basePoints.map((point, pointIndex) => {
            const ratio = pointIndex / (basePoints.length - 1);
            const targetWeight = overlappingActors ? 0 : ratio;
            return new DOMPoint(
              point.x
                + (1 - ratio) * (sourceAnchor.x - baseStart.x)
                + targetWeight * (targetAnchor.x - baseEnd.x),
              point.y
                + (1 - ratio) * (sourceAnchor.y - baseStart.y)
                + targetWeight * (targetAnchor.y - baseEnd.y),
            );
          });

          const firstOutsideSource = points.findIndex((point, pointIndex) => (
            pointIndex > 0 && !isInsideActor(source, point)
          ));
          const visibleStartIndex = firstOutsideSource > 0 ? firstOutsideSource : 0;
          const visibleStart = firstOutsideSource > 0
            ? refineBoundary(source, points[firstOutsideSource - 1], points[firstOutsideSource])
            : points[0];
          const visiblePoints = [visibleStart, ...points.slice(visibleStartIndex)];

          if (!overlappingActors) {
            const firstInsideTarget = visiblePoints.findIndex((point, pointIndex) => (
              pointIndex > 0 && isInsideActor(target, point)
            ));
            if (firstInsideTarget > 0) {
              const targetBoundary = refineBoundary(
                target,
                visiblePoints[firstInsideTarget],
                visiblePoints[firstInsideTarget - 1],
              );
              visiblePoints.splice(firstInsideTarget, visiblePoints.length, targetBoundary);
            }
          }

          return visiblePoints
            .map((point, pointIndex) => `${pointIndex ? 'L' : 'M'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
            .join('');
        };

        const setTyping = (visible: boolean) => {
          speaking = visible;
          responseTyping.classList.toggle('is-speaking', visible);
          responseTyping.setAttribute('aria-hidden', String(!visible));
          responseDots.textContent = visible ? '•' : '';
        };

        const clearVisual = () => {
          actors.forEach((actor) => actor.classList.remove('active', 'lookup-active'));
          contextContract.classList.remove('is-assembling', 'is-reassembling');
          active.setAttribute('d', '');
          active.style.strokeDasharray = '';
          active.style.strokeDashoffset = '';
          pulse.style.display = 'none';
          currentPath = null;
          pathLength = 0;
          setTyping(false);
          runtime.querySelectorAll('.step').forEach((step) => step.classList.remove('current'));
        };

        const renderMotion = () => {
          if (!currentPath) return;
          const distance = pathLength * progress;
          const point = currentPath.getPointAtLength(distance);
          pulse.setAttribute('transform', `translate(${point.x} ${point.y})`);
          if (speaking) {
            const dotCount = 1 + (Math.floor((progress * edgeMs) / 420) % 3);
            responseDots.textContent = Array(dotCount).fill('•').join('  ');
          }
        };

        const next = () => {
          index = (index + 1) % useCases[current].edges.length;
          showEdge();
        };

        const tick = (timestamp: number) => {
          if (!running) return;
          if (lastTs === null) lastTs = timestamp;
          else {
            progress = Math.min(1, progress + (timestamp - lastTs) / edgeMs);
            lastTs = timestamp;
          }
          renderMotion();
          if (progress < 1) raf = window.requestAnimationFrame(tick);
          else {
            setTyping(false);
            inHold = true;
            timer = window.setTimeout(next, holdMs);
          }
        };

        const showEdge = () => {
          stopMotion();
          const edge = useCases[current].edges[index];
          clearVisual();
          progress = 0;
          lastTs = null;
          inHold = false;
          const edgeName = edge[0];
          const path = runtime.querySelector<SVGPathElement>(`[data-edge="${edgeName}"]`);
          setTyping(edgeName === 'mouth-prompt' || edgeName === 'mouth-channels');
          runtime.querySelectorAll('.step')[index]?.classList.add('current');

          if (edgeName === 'context-assembly' || edgeName === 'context-reassembly') {
            const reassembling = edgeName === 'context-reassembly';
            contextContract.classList.add(reassembling ? 'is-reassembling' : 'is-assembling');
            ['soul', 'profile', 'memory', 'skill-index', 'pfc', 'context'].forEach((id) => {
              runtime.querySelector<SVGElement>(`#${id}`)?.classList.add('active');
            });
            active.dataset.edge = edgeName;
            active.dataset.source = reassembling ? 'tool-result' : 'parallel-context-sources';
            active.dataset.target = 'context';
            if (running) raf = window.requestAnimationFrame(tick);
            return;
          }

          if (edgeName === 'skill-view-lookup') {
            const lookup = runtime.querySelector<SVGElement>('#skill-view');
            lookup?.classList.add('active', 'lookup-active');
            active.dataset.edge = edgeName;
            active.dataset.source = 'skill-view';
            active.dataset.target = 'skill-view';
            if (running) raf = window.requestAnimationFrame(tick);
            return;
          }

          if (!path) return;
          const color = edgeName.includes('gateway') || edgeName.includes('channel') || edgeName.includes('bot')
            ? '#fb923c'
            : edgeName.includes('tool') || edgeName.includes('external')
              ? '#34d399'
              : '#fef08a';
          runtime.style.setProperty('--flow', color);
          active.style.setProperty('--flow', color);
          pulse.style.setProperty('--flow', color);
          [path.dataset.from, path.dataset.to].forEach((id) => {
            if (id) runtime.querySelector<SVGElement>(`#${CSS.escape(id)}`)?.classList.add('active');
          });
          const source = path.dataset.from
            ? runtime.querySelector<SVGElement>(`#${CSS.escape(path.dataset.from)}`)
            : null;
          const target = path.dataset.to
            ? runtime.querySelector<SVGElement>(`#${CSS.escape(path.dataset.to)}`)
            : null;
          active.dataset.edge = edgeName;
          active.dataset.source = path.dataset.from ?? '';
          active.dataset.target = path.dataset.to ?? '';
          active.setAttribute(
            'd',
            source && target ? connectedPath(path, source, target) : (path.getAttribute('d') ?? ''),
          );
          active.style.strokeDasharray = '';
          active.style.strokeDashoffset = '';
          currentPath = active;
          pathLength = active.getTotalLength();
          pulse.style.display = reduced ? 'none' : 'block';
          renderMotion();
          if (running) raf = window.requestAnimationFrame(tick);
        };

        const select = (name: string) => {
          stopMotion();
          current = name;
          index = 0;
          const selected = useCases[name];
          tabs.forEach((tab) => {
            const selectedTab = tab.dataset.case === name;
            tab.setAttribute('aria-selected', String(selectedTab));
            tab.tabIndex = selectedTab ? 0 : -1;
          });
          tabPanel.setAttribute('aria-labelledby', `hermes-usecase-tab-${name}`);
          const setText = (selector: string, text: string) => {
            const element = runtime.querySelector(selector);
            if (element) element.textContent = text;
          };
          setText('#case-kicker', selected.kicker);
          setText('#case-title', selected.title);
          setText('#case-desc', selected.desc);
          setText('#case-analogy', selected.analogy);
          setText('#speed-badge', reduced ? 'SƠ ĐỒ TĨNH · REDUCED MOTION' : 'TỰ ĐỘNG · 2,7S/CHẶNG');

          timeline.replaceChildren(...selected.edges.map((edge, stepIndex) => {
            const step = document.createElement('span');
            step.className = 'step';
            const number = document.createElement('b');
            number.textContent = String(stepIndex + 1);
            step.append(number, document.createTextNode(edge[1]));
            return step;
          }));

          const usedEdges = new Set(selected.edges.map((edge) => edge[0]));
          const usedActors = new Set(['person']);
          paths.forEach((path) => {
            const used = usedEdges.has(path.dataset.edge ?? '');
            path.classList.toggle('used', used);
            if (used) {
              if (path.dataset.from) usedActors.add(path.dataset.from);
              if (path.dataset.to) usedActors.add(path.dataset.to);
            }
          });
          ['soul', 'profile', 'memory', 'context', 'pfc', 'model', 'skill-index', 'skill-full', 'skill-view']
            .forEach((id) => usedActors.add(id));
          actors.forEach((actor) => actor.classList.toggle('hidden-for-case', !usedActors.has(actor.id)));
          const book = runtime.querySelector('#book');
          book?.classList.remove('hidden-for-case', 'index-only');
          showEdge();
        };

        tabs.forEach((tab) => {
          const onClick = () => select(tab.dataset.case ?? 'direct');
          const onKeyDown = (event: KeyboardEvent) => {
            const currentIndex = tabs.indexOf(tab);
            let targetIndex: number | undefined;
            if (event.key === 'ArrowRight') targetIndex = (currentIndex + 1) % tabs.length;
            if (event.key === 'ArrowLeft') targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            if (event.key === 'Home') targetIndex = 0;
            if (event.key === 'End') targetIndex = tabs.length - 1;
            if (targetIndex === undefined) return;
            event.preventDefault();
            const target = tabs[targetIndex];
            target.focus();
            select(target.dataset.case ?? 'gateway');
          };
          tab.addEventListener('click', onClick);
          tab.addEventListener('keydown', onKeyDown);
          cleanups.push(() => tab.removeEventListener('click', onClick));
          cleanups.push(() => tab.removeEventListener('keydown', onKeyDown));
        });

        const onPause = () => {
          if (reduced) return;
          if (running) {
            running = false;
            stopMotion();
            sourceMain.classList.add('paused');
            pause.textContent = '▶ Chạy tiếp';
            pause.setAttribute('aria-pressed', 'true');
          } else {
            running = true;
            sourceMain.classList.remove('paused');
            pause.textContent = 'Ⅱ Tạm dừng';
            pause.setAttribute('aria-pressed', 'false');
            lastTs = null;
            if (inHold || progress >= 1) timer = window.setTimeout(next, holdMs);
            else raf = window.requestAnimationFrame(tick);
          }
        };
        pause.addEventListener('click', onPause);
        cleanups.push(() => pause.removeEventListener('click', onPause));

        if (reduced) {
          pause.disabled = true;
          pause.textContent = 'Chuyển động đã tắt';
        }
        select('gateway');
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error('Không thể tải Usecases:', error);
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
      cleanups.forEach((cleanup) => cleanup());
      runtime.replaceChildren();
    };
  }, []);

  return (
    <section className="hermesHumanBody" aria-labelledby="hermes-human-body-title">
      <header className="hermesHumanBodyHeader">
        <div>
          <span className="badge">Hermes Agent · mô hình cơ thể người</span>
          <h2 id="hermes-human-body-title">Usecases</h2>
          <p>Mỗi user turn tạo một model request mới: Prompt Builder ghép các nguồn system độc lập theo tier cùng chat history và current prompt; Tool Schemas đi trong trường API riêng. Trong luồng on-demand minh hoạ, Full Skill, RAG hoặc payload ngoài xuất hiện sau tool call; preload, plugin hoặc external-memory overlay có thể chèn sớm hơn.</p>
        </div>
      </header>
      {loadError ? <p role="alert" className="hermesUseCasesError">Không thể tải mô phỏng Usecases.</p> : null}
      <div ref={runtimeRef} className="hermesUseCasesRuntime" aria-live="polite" />
    </section>
  );
}
