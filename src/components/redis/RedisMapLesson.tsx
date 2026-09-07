import React from 'react';

const REFERENCE_URL = '/redis/redis-map-reference.html';

/**
 * The Redis Map is a source-faithful standalone visual artifact. Keep it in an
 * iframe instead of re-implementing the generated interactive document in a
 * second React tree; that prevents the app and the design reference drifting
 * apart again.
 */
export function RedisMapLesson() {
  const frameRef = React.useRef<HTMLIFrameElement>(null);

  const syncTheme = React.useCallback(() => {
    const theme = document.documentElement.dataset.theme;
    if (theme === 'light' || theme === 'dark') {
      frameRef.current?.contentWindow?.postMessage({ type: 'redis-map-theme', theme }, '*');
    }
  }, []);

  React.useEffect(() => {
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [syncTheme]);

  return (
    <section className="redisMapLesson" aria-label="Redis Map lesson">
      <header className="redisMapHead">
        <h2>Redis Map</h2>
        <span>Mô hình triển khai → bên trong từng node</span>
      </header>
      <iframe
        ref={frameRef}
        className="redisMapReference"
        title="Redis Map interactive lesson"
        src={REFERENCE_URL}
        onLoad={syncTheme}
      />
    </section>
  );
}
