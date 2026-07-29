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
        const assemblyBoard = runtime.querySelector<SVGElement>('#assembly-board');
        const assemblyTitle = runtime.querySelector<SVGTextElement>('#assembly-title');
        const assemblyCurrent = runtime.querySelector<SVGTextElement>('#assembly-current');
        const assemblyNeedCopy = runtime.querySelector<SVGTextElement>('[data-assembly-tier="need"] .row-copy');
        const assemblyGainCopy = runtime.querySelector<SVGTextElement>('[data-assembly-tier="gain"] .row-copy');
        const assemblySystemCopy = runtime.querySelector<SVGTextElement>('[data-assembly-tier="system"] .row-copy');
        const assemblyMessagesCopy = runtime.querySelector<SVGTextElement>('[data-assembly-tier="messages"] .row-copy');
        const assemblyToolsCopy = runtime.querySelector<SVGTextElement>('[data-assembly-tier="tools"] .row-copy');
        const assemblyRows = [...runtime.querySelectorAll<SVGElement>('[data-assembly-tier]')];
        if (!active || !pulse || !stage || !caseHead || !diagramShell || !timeline || !pause || !responseTyping || !responseDots || !assemblyBoard || !assemblyTitle || !assemblyCurrent || !assemblyNeedCopy || !assemblyGainCopy || !assemblySystemCopy || !assemblyMessagesCopy || !assemblyToolsCopy) {
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
        const fastTest = new URLSearchParams(window.location.search).has('testfast');
        const edgeMs = fastTest ? 120 : 2700;
        const holdMs = fastTest ? 30 : 350;
        runtime.style.setProperty('--edge', `${edgeMs}ms`);

        let current = 'gateway';
        let index = 0;
        let running = false;
        let started = false;
        let completed = false;
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
          active.setAttribute('d', '');
          active.style.strokeDasharray = '';
          active.style.strokeDashoffset = '';
          pulse.style.display = 'none';
          currentPath = null;
          pathLength = 0;
          setTyping(false);
          assemblyRows.forEach((row) => row.classList.remove('active', 'loaded'));
          runtime.querySelectorAll('.step').forEach((step) => step.classList.remove('current'));
        };

        const updateAssemblyBoard = (edgeName: string) => {
          const elapsedEdges = edgeName
            ? useCases[current].edges.slice(0, index + 1).map(([name]) => name)
            : [];
          const hasEdge = (name: string) => elapsedEdges.includes(name);
          const hasMcpResult = elapsedEdges.includes('tools-context');
          const hasSkillResult = elapsedEdges.includes('skill-full-context');
          const hasResult = hasMcpResult || hasSkillResult;
          const isResultStep = edgeName === 'tools-context' || edgeName === 'skill-full-context';
          const isReassemblyStep = edgeName === 'context-reassembly';
          const systemEdges = ['soul-pfc', 'skill-index-pfc', 'profile-pfc', 'context-tier', 'memory-pfc', 'user-pfc', 'pfc-context'];
          const messageEdges = ['prompt-channels', 'channels-context', 'prompt-context'];
          const toolEdges = ['model-tools', 'tools-external', 'external-tools', 'model-skill-view', 'skill-view-lookup'];
          const isSystemAssembly = systemEdges.includes(edgeName);
          const isMessageStep = messageEdges.includes(edgeName);
          const isToolStep = toolEdges.includes(edgeName);
          const isToolCallStep = ['model-tools', 'model-skill-view', 'skill-view-lookup'].includes(edgeName);
          const requestNumber = elapsedEdges.filter((name) => name === 'context-model').length;

          const systemParts: string[] = [];
          if (hasEdge('soul-pfc')) systemParts.push('SOUL');
          if (hasEdge('skill-index-pfc')) systemParts.push('Skills');
          if (hasEdge('profile-pfc')) systemParts.push('Profile');
          if (hasEdge('context-tier') || hasEdge('pfc-context')) systemParts.push('Project');
          if (hasEdge('memory-pfc')) systemParts.push('Memory');
          if (hasEdge('user-pfc')) systemParts.push('USER');
          const hasPrompt = elapsedEdges.some((name) => messageEdges.includes(name));
          const hasToolCall = elapsedEdges.some((name) => ['model-tools', 'model-skill-view'].includes(name));
          const hasRequest = requestNumber > 0;

          assemblySystemCopy.textContent = systemParts.length
            ? hasEdge('pfc-context')
              ? systemParts.join(' · ')
              : `Đã nạp: ${systemParts.join(' · ')}`
            : 'Chưa assemble · Start để xem từng nguồn';

          const messageParts = ['History'];
          if (hasPrompt) messageParts.push('Prompt');
          if (hasEdge('model-skill-view')) messageParts.push('skill_view call');
          if (hasSkillResult) messageParts.push('Full Skill');
          if (hasEdge('model-tools')) messageParts.push('MCP call');
          if (hasMcpResult) messageParts.push('MCP Result');
          if (current === 'e2e') {
            const e2eParts = ['History+Prompt'];
            if (hasEdge('model-skill-view')) e2eParts.push(hasSkillResult ? 'skill call/result' : 'skill call');
            if (hasEdge('model-tools')) e2eParts.push(hasMcpResult ? 'MCP call/result' : 'MCP call');
            assemblyMessagesCopy.textContent = e2eParts.join(' · ');
          } else {
            assemblyMessagesCopy.textContent = messageParts.join(' → ');
          }

          assemblyBoard.classList.add('visible');
          assemblyBoard.setAttribute('aria-hidden', 'false');
          assemblyBoard.classList.toggle('mode-tool', current === 'tool');
          assemblyBoard.classList.toggle('mode-skill', current === 'skill');

          if (current === 'tool') {
            assemblyTitle.textContent = 'CONTEXT WINDOW · MCP';
            assemblyToolsCopy.textContent = hasRequest || hasToolCall
              ? 'Đã gửi: MCP schema · chưa phải result'
              : 'Sẽ gửi: MCP schema ở API field riêng';
          } else if (current === 'skill') {
            assemblyTitle.textContent = 'CONTEXT WINDOW · FULL SKILL';
            assemblyToolsCopy.textContent = hasRequest || hasToolCall
              ? 'Đã gửi: skill_view schema · Index ở SYSTEM'
              : 'Sẽ gửi: skill_view schema ở API field riêng';
          } else if (current === 'e2e') {
            assemblyTitle.textContent = 'CONTEXT WINDOW · E2E';
            assemblyToolsCopy.textContent = hasRequest || hasToolCall
              ? 'Đã gửi: skill_view + MCP schemas'
              : 'Sẽ gửi: skill_view + MCP schemas';
          } else {
            assemblyTitle.textContent = 'CONTEXT WINDOW · MESSAGING';
            assemblyToolsCopy.textContent = hasRequest
              ? 'Đã gửi: native · plugin · MCP schemas'
              : 'Sẽ gửi: tool schemas ở API field riêng';
          }

          if (!edgeName) {
            assemblyNeedCopy.textContent = 'Chưa chạy · chưa assemble request';
            assemblyGainCopy.textContent = 'Bấm Start để xem context thay đổi';
          } else if (isSystemAssembly) {
            const source = edgeName === 'soul-pfc' ? 'SOUL.md'
              : edgeName === 'profile-pfc' ? 'Active Profile hint'
                : edgeName === 'memory-pfc' ? 'MEMORY.md'
                  : edgeName === 'user-pfc' ? 'USER.md'
                  : edgeName === 'skill-index-pfc' ? 'Skill Index'
                    : edgeName === 'context-tier' ? 'system sources'
                      : 'SYSTEM hoàn chỉnh';
            assemblyNeedCopy.textContent = `Đang nạp: ${source}`;
            assemblyGainCopy.textContent = edgeName === 'pfc-context'
              ? 'SYSTEM đã cache cho các request sau'
              : `SYSTEM vừa nhận thêm ${source}`;
          } else if (isMessageStep) {
            assemblyNeedCopy.textContent = 'User prompt chưa nằm trong MESSAGES[]';
            assemblyGainCopy.textContent = 'Đã append current user prompt';
          } else if (edgeName === 'context-model') {
            assemblyNeedCopy.textContent = hasResult ? 'Model cần đọc result mới' : 'Model chưa có tool result';
            assemblyGainCopy.textContent = `Request #${Math.max(requestNumber, 1)} đã đủ 3 fields`;
          } else if (isToolCallStep) {
            assemblyNeedCopy.textContent = hasResult ? 'Model cần hành động tiếp' : 'Model cần dữ liệu/quy trình';
            assemblyGainCopy.textContent = edgeName.includes('skill')
              ? 'Đã phát skill_view call'
              : 'Đã phát MCP tool call';
          } else if (edgeName === 'tools-external' || edgeName === 'external-tools') {
            assemblyNeedCopy.textContent = 'Runtime/MCP đang thực thi bên ngoài';
            assemblyGainCopy.textContent = 'Đang chờ Tool Result trả về';
          } else if (isResultStep) {
            assemblyNeedCopy.textContent = 'Tool Result vừa quay về Runtime';
            assemblyGainCopy.textContent = edgeName === 'tools-context'
              ? 'Đã append MCP Result vào MESSAGES[]'
              : 'Đã append Full Skill vào MESSAGES[]';
          } else if (isReassemblyStep) {
            assemblyNeedCopy.textContent = 'Request trước chưa chứa result mới';
            assemblyGainCopy.textContent = 'Request kế tiếp dùng MESSAGES[] mới';
          } else {
            assemblyNeedCopy.textContent = hasResult ? 'Model đang đọc evidence mới' : 'Model đang suy luận request';
            assemblyGainCopy.textContent = hasResult ? 'Có thể trả lời hoặc gọi tool tiếp' : 'Sắp quyết định bước tiếp theo';
          }

          assemblyCurrent.textContent = !edgeName
            ? 'SẴN SÀNG · BẤM START'
            : isSystemAssembly
              ? edgeName === 'pfc-context'
                ? 'FIRST TURN · CACHE SYSTEM PROMPT'
                : 'FIRST TURN · PROMPT BUILDER ĐANG NẠP SYSTEM'
              : isResultStep
                ? edgeName === 'tools-context'
              ? 'APPEND MCP RESULT → MESSAGES[]'
              : 'APPEND FULL SKILL → MESSAGES[]'
            : isReassemblyStep
              ? 'REQUEST KẾ TIẾP · SYSTEM/TOOLS GIỮ NGUYÊN'
              : hasResult
                ? 'MODEL ĐỌC RESULT → TOOL KHÁC HOẶC FINAL'
                : edgeName === 'context-model'
                  ? 'REQUEST #1 · MODEL CHƯA CÓ RESULT'
                  : 'AGENT LOOP · SYSTEM/TOOLS GIỮ NGUYÊN';

          assemblyRows.forEach((row) => {
            const tier = row.dataset.assemblyTier;
            const activeTiers = new Set<string>();
            if (isSystemAssembly) activeTiers.add('system');
            if (isMessageStep || isResultStep || isReassemblyStep) activeTiers.add('messages');
            if (isToolStep) activeTiers.add('tools');
            if (edgeName === 'context-model') ['system', 'messages', 'tools'].forEach((name) => activeTiers.add(name));
            if (edgeName && !isResultStep && edgeName !== 'context-model') activeTiers.add('need');
            if (isResultStep || hasResult) activeTiers.add('gain');
            const activeTier = tier ? activeTiers.has(tier) : false;
            row.classList.toggle('active', activeTier);
            row.classList.toggle('loaded',
              (tier === 'system' && systemParts.length > 0)
              || (tier === 'messages' && (hasPrompt || hasResult))
              || (tier === 'tools' && hasRequest),
            );
          });
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
          if (index >= useCases[current].edges.length - 1) {
            running = false;
            started = false;
            completed = true;
            stopMotion();
            sourceMain.classList.remove('paused');
            pause.textContent = '↻ Chạy lại';
            pause.setAttribute('aria-pressed', 'false');
            runtime.querySelector('#speed-badge')!.textContent = 'ĐÃ XONG · KHÔNG TỰ LẶP';
            return;
          }
          index += 1;
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
          updateAssemblyBoard(edgeName);
          setTyping(edgeName === 'mouth-prompt' || edgeName === 'mouth-channels');
          const currentStep = runtime.querySelectorAll<HTMLElement>('.step')[index];
          currentStep?.classList.add('current');
          currentStep?.scrollIntoView({
            behavior: reduced ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'center',
          });

          if (edgeName === 'context-tier') {
            runtime.querySelector<SVGElement>('#pfc')?.classList.add('active');
            active.dataset.edge = edgeName;
            active.dataset.source = 'prompt-builder';
            active.dataset.target = 'prompt-builder';
            if (running) raf = window.requestAnimationFrame(tick);
            return;
          }

          if (edgeName === 'context-reassembly') {
            runtime.querySelector<SVGElement>('#context')?.classList.add('active');
            active.dataset.edge = edgeName;
            active.dataset.source = 'messages-plus-tool-result';
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
          const color = edgeName.includes('profile') || edgeName.includes('user')
            ? '#fbbf24'
            : edgeName.includes('memory')
              ? '#a78bfa'
              : edgeName.includes('skill-index')
                ? '#67e8f9'
                : edgeName.includes('soul')
                  ? '#fb7185'
                  : edgeName.includes('gateway') || edgeName.includes('channel') || edgeName.includes('bot')
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
          running = false;
          started = false;
          completed = false;
          progress = 0;
          inHold = false;
          sourceMain.classList.remove('paused');
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
          setText('#speed-badge', reduced ? 'SƠ ĐỒ TĨNH · REDUCED MOTION' : 'SẴN SÀNG · TỰ BẤM START');
          pause.textContent = reduced ? 'Chuyển động đã tắt' : '▶ Start';
          pause.setAttribute('aria-pressed', 'false');

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
          ['soul', 'profile', 'memory', 'context', 'pfc', 'model', 'skill-index']
            .forEach((id) => usedActors.add(id));
          if (name === 'skill' || name === 'e2e') {
            ['skill-full', 'skill-view'].forEach((id) => usedActors.add(id));
          }
          actors.forEach((actor) => actor.classList.toggle('hidden-for-case', !usedActors.has(actor.id)));
          const book = runtime.querySelector('#book');
          book?.classList.remove('hidden-for-case', 'index-only');
          clearVisual();
          updateAssemblyBoard('');
          if (reduced) {
            assemblyCurrent.textContent = 'CHUYỂN ĐỘNG ĐÃ TẮT · ĐỌC TIMELINE BÊN DƯỚI';
          }
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
          if (!started) {
            if (completed) index = 0;
            completed = false;
            started = true;
            running = true;
            sourceMain.classList.remove('paused');
            pause.textContent = 'Ⅱ Tạm dừng';
            pause.setAttribute('aria-pressed', 'false');
            runtime.querySelector('#speed-badge')!.textContent = 'ĐANG CHẠY · 2,7S/CHẶNG';
            showEdge();
            return;
          }
          if (running) {
            running = false;
            stopMotion();
            sourceMain.classList.add('paused');
            pause.textContent = '▶ Chạy tiếp';
            pause.setAttribute('aria-pressed', 'true');
            runtime.querySelector('#speed-badge')!.textContent = 'ĐÃ TẠM DỪNG';
          } else {
            running = true;
            sourceMain.classList.remove('paused');
            pause.textContent = 'Ⅱ Tạm dừng';
            pause.setAttribute('aria-pressed', 'false');
            runtime.querySelector('#speed-badge')!.textContent = 'ĐANG CHẠY · 2,7S/CHẶNG';
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
          pause.setAttribute('aria-label', 'Chuyển động đã tắt theo cài đặt hệ thống');
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
          <p>Mỗi user turn tạo một model request mới: Prompt Builder tạo cached SYSTEM từ các nguồn theo tier; AIAgent request assembly kết hợp SYSTEM với MESSAGES[] và trường TOOLS[] riêng. Trong luồng on-demand minh hoạ, Full Skill, RAG hoặc payload ngoài xuất hiện sau tool call; preload, plugin hoặc external-memory overlay có thể chèn sớm hơn.</p>
        </div>
      </header>
      {loadError ? <p role="alert" className="hermesUseCasesError">Không thể tải mô phỏng Usecases.</p> : null}
      <div ref={runtimeRef} className="hermesUseCasesRuntime" aria-live="polite" />
    </section>
  );
}
