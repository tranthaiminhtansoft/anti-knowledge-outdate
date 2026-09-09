import React from 'react';

const REFERENCE_URL = `${import.meta.env.BASE_URL}database/database-production-guide.html`;

const frameBridgeStyles = `
:root[data-host-theme="dark"]{color-scheme:dark;--db-page:#08111f;--db-surface:#101d31;--db-surface-strong:#07101d;--db-text:#edf5ff;--db-muted:#b8c9df;--db-border:#31517c;--db-shadow:#0008;--db-accent:#67e8f9;--db-on-white:#15233a;--db-on-cyan:#08222a;--db-on-navy:#f8fbff;--db-arch-tab-bg:#091426;--db-arch-tab-text:#fff;--db-arch-tab-selected-bg:#67e8f9;--db-arch-tab-selected-text:#031225}
:root[data-host-theme="light"]{color-scheme:light;--db-page:#f4f8ff;--db-surface:#ffffff;--db-surface-strong:#edf5ff;--db-text:#15233a;--db-muted:#40536d;--db-border:#a9c1df;--db-shadow:#31517c1f;--db-accent:#0e7490;--db-on-white:#15233a;--db-on-cyan:#08222a;--db-on-navy:#f8fbff;--db-arch-tab-bg:#183555;--db-arch-tab-text:#fff;--db-arch-tab-selected-bg:#0e7490;--db-arch-tab-selected-text:#fff}
body.database-outer-route .side{display:none!important}
body.database-outer-route{overflow-x:hidden;background:radial-gradient(circle at 14% 0,color-mix(in srgb,var(--db-accent) 18%,transparent),transparent 32%),var(--db-page)!important;color:var(--db-text)!important}
body.database-outer-route .layout{grid-template-columns:minmax(0,1fr)!important;max-width:1180px!important;margin:0 auto!important;padding:20px!important}
body.database-outer-route :is(.hero,.must article,.box,.tech,.sim,.query,.mechanism,.incident-panel,.deep-stage,.deep-side,.acid-sim,.nosql-board,.query-path,.race,.code,.result,.runbook,.common article,.metric,.buyer,.health>div,.qa,.answer,.unit,.fact,.node,.shard,.tx-node,.replica-box,.mini-node){background:var(--db-surface)!important;color:var(--db-text)!important;border-color:var(--db-border)!important;box-shadow:0 12px 34px var(--db-shadow)!important}
body.database-outer-route :is(.brand,.scenario,.nav i,.nav button:hover,.acid-console,.log,.acid-queue,.lock-queue,.mode-note,.arch-context,.read-state,.run-status,.queue-stack,.alert-box,.follow-fix,.query-path,.acid-wal,.wal,.sync,.why,.stock){background:var(--db-surface-strong)!important;color:var(--db-text)!important;border-color:var(--db-border)!important}
body.database-outer-route :is(h1,h2,h3,h4,p,small,li,code,summary,.head p,.hero p,.answer,.flow-legend,.mechanism p,.incident-panel p,.deep-side ol){color:var(--db-text)!important}
body.database-outer-route :is(.head p,.hero p,.answer,.flow-legend,.mechanism p,.incident-panel p,.deep-side ol,.unit small,.fact small,.tech-title small,.common ul,.sync small){color:var(--db-muted)!important}
body.database-outer-route .index-example{background:#091426!important;color:var(--db-on-navy)!important;border-color:var(--db-border)!important}
body.database-outer-route .index-example :is(h3,p,small,code){color:var(--db-on-navy)!important}
body.database-outer-route .index-example pre{background:#07101d!important;border-color:var(--db-border)!important}
body.database-outer-route .index-example .index-status.ready{background:#062015!important;color:#86efac!important}
body.database-outer-route :is(.pill,.arr,.qa summary:after){color:var(--db-accent)!important;border-color:var(--db-border)!important}
body.database-outer-route :is(.nav button,.arch-tab,.correct-tab){color:var(--db-text)!important}
body.database-outer-route :is(.nav button[aria-selected=true],.correct-tab[aria-selected=true]){background:var(--db-accent)!important;color:#fff!important}
body.database-outer-route .arch-tab{background:var(--db-arch-tab-bg)!important;color:var(--db-arch-tab-text)!important}
body.database-outer-route .arch-tab[aria-selected=true]{background:var(--db-arch-tab-selected-bg)!important;color:var(--db-arch-tab-selected-text)!important}
:root[data-host-theme="dark"] body.database-outer-route .acid-node small{background:#f8fbff!important;color:#111827!important}
body.database-outer-route :is(.acid-client,.acid-api){background:transparent!important;color:var(--db-text)!important}
body.database-outer-route .btn:not(.good):not(.bad):not(.hot){background:var(--db-surface-strong)!important;color:var(--db-text)!important;border-color:var(--db-border)!important}
/* Surface-semantic contrast for the NoSQL simulator. */
body.database-outer-route .nosql-board.v2 .lb,
body.database-outer-route .nosql-board.v2 .lb :is(b,small){color:var(--db-on-cyan)!important}
body.database-outer-route .cluster-status span{background:#091426!important;color:var(--db-on-navy)!important}
body.database-outer-route .cluster-status span b{color:#86efac!important}
body.database-outer-route .cluster-status span b.no-replica{color:#fde68a!important}
:root[data-host-theme="light"] body.database-outer-route .nosql-board.v2 .users,
:root[data-host-theme="light"] body.database-outer-route .cluster-v2 .node,
:root[data-host-theme="light"] body.database-outer-route .cluster-v2 .node small,
:root[data-host-theme="light"] body.database-outer-route .must article b,
:root[data-host-theme="light"] body.database-outer-route .fact b{color:var(--db-on-white)!important}
:root[data-host-theme="dark"] body.database-outer-route .nosql-board.v2 .users,
:root[data-host-theme="dark"] body.database-outer-route .cluster-v2 .node,
:root[data-host-theme="dark"] body.database-outer-route .cluster-v2 .node small{color:var(--db-on-navy)!important}
/* Correctness tabs follow the same explicit surface contract as architecture tabs. */
body.database-outer-route .correct-tab{background:var(--db-arch-tab-bg)!important;color:var(--db-on-navy)!important}
:root[data-host-theme="dark"] body.database-outer-route .correct-tab[aria-selected=true]{background:var(--db-accent)!important;color:#031225!important}
:root[data-host-theme="light"] body.database-outer-route .correct-tab[aria-selected=true]{background:var(--db-arch-tab-selected-bg)!important;color:var(--db-on-navy)!important}
`;

export type DatabaseGuideSection = 'architecture' | 'design' | 'correctness' | 'operations';

const sectionTitles: Record<DatabaseGuideSection, string> = {
  architecture: 'Architecture & Scaling',
  design: 'Design & Performance',
  correctness: 'Correctness & Reliability',
  operations: 'Production Operations',
};

/**
 * The source guide owns complex SQL/NoSQL simulators. The React shell mounts a
 * fresh, route-scoped frame so only the selected chapter is visible; the source
 * navigation is removed inside the frame and the app sidebar remains canonical.
 */
export function DatabaseProductionGuide({ section }: { section: DatabaseGuideSection }) {
  const frameRef = React.useRef<HTMLIFrameElement>(null);

  const applyFrameBridge = React.useCallback(() => {
    const frameDocument = frameRef.current?.contentDocument;
    if (!frameDocument?.documentElement || !frameDocument.body || !frameDocument.head) return;

    const theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    frameDocument.documentElement.dataset.hostTheme = theme;
    frameDocument.body.classList.add('database-outer-route');
    frameDocument.querySelectorAll('.side-toggle').forEach((toggle) => toggle.remove());

    let style = frameDocument.getElementById('database-host-bridge') as HTMLStyleElement | null;
    if (!style) {
      style = frameDocument.createElement('style');
      style.id = 'database-host-bridge';
      frameDocument.body.append(style);
    }
    style.textContent = frameBridgeStyles;

    const applyArchitectureTabColors = () => {
      const isLight = frameDocument.documentElement.dataset.hostTheme === 'light';
      frameDocument.querySelectorAll<HTMLButtonElement>('.arch-tab').forEach((tab) => {
        const selected = tab.getAttribute('aria-selected') === 'true';
        const background = selected
          ? isLight
            ? '#0e7490'
            : '#67e8f9'
          : isLight
            ? '#183555'
            : '#091426';
        tab.style.setProperty('background', background, 'important');
        tab.style.setProperty('color', selected && !isLight ? '#031225' : '#fff', 'important');
      });
    };
    applyArchitectureTabColors();

    if (frameDocument.body.dataset.databaseArchitectureTabsBound !== 'true') {
      frameDocument.body.dataset.databaseArchitectureTabsBound = 'true';
      frameDocument.addEventListener('click', (event) => {
        if ((event.target as Element | null)?.closest('.arch-tab')) {
          window.setTimeout(applyArchitectureTabColors, 0);
        }
      });
    }
  }, []);

  const syncTheme = React.useCallback(() => {
    applyFrameBridge();
    const theme = document.documentElement.dataset.theme;
    if (theme === 'light' || theme === 'dark') {
      frameRef.current?.contentWindow?.postMessage({ type: 'database-guide-theme', theme }, '*');
    }
  }, [applyFrameBridge]);

  React.useEffect(() => {
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [syncTheme]);

  React.useEffect(() => {
    const destinationBySection: Record<DatabaseGuideSection, string> = {
      architecture: 'architecture-scaling',
      design: 'design-performance',
      correctness: 'correctness-reliability',
      operations: 'production-operations',
    };
    const onGuideNavigate = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const destination = event.data?.type === 'database-guide-navigate' ? event.data.section : undefined;
      if (destination && destination in destinationBySection) {
        window.location.hash = `#/article/database/${destinationBySection[destination as DatabaseGuideSection]}`;
      }
    };
    window.addEventListener('message', onGuideNavigate);
    return () => window.removeEventListener('message', onGuideNavigate);
  }, []);

  const title = `Database Production Essentials: ${sectionTitles[section]}`;
  return (
    <section className="databaseProductionGuide" aria-label={title}>
      <iframe
        key={section}
        ref={frameRef}
        className="databaseProductionGuideFrame"
        title={title}
        data-section={section}
        src={`${REFERENCE_URL}?section=${section}`}
        onLoad={syncTheme}
      />
    </section>
  );
}
