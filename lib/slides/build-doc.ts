/**
 * Build a self-contained HTML document for the slide deck.
 *
 * @param html       Raw slide HTML (all sections concatenated)
 * @param css        Marp-generated CSS
 * @param startIndex Which slide to show first (0-based). Default 0.
 */
export function buildSlideDoc(
  html: string,
  css: string,
  startIndex = 0,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://unpkg.com/echarts@6/dist/echarts.min.js"></script>
<style>
${css}
body { margin: 0; padding: 0; background: #070b1f; overflow: hidden; }
#deck {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}
#deck .marpit {
  width: 100%;
  height: 100%;
}
#deck > section,
#deck > svg,
#deck .marpit > section,
#deck .marpit > svg {
  display: none;
  width: 100%;
  height: 100%;
}
#deck > section.active,
#deck > svg.active,
#deck .marpit > section.active,
#deck .marpit > svg.active {
  display: block;
}

@keyframes slide-enter-forward {
  from { opacity: 0; transform: translate3d(36px, 0, 0) scale(0.985); }
  to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}

@keyframes slide-enter-backward {
  from { opacity: 0; transform: translate3d(-36px, 0, 0) scale(0.985); }
  to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}

@keyframes float-glow {
  0% { transform: translateY(0px); filter: drop-shadow(0 0 0 rgba(54,245,255,0)); }
  50% { transform: translateY(-2px); filter: drop-shadow(0 6px 20px rgba(54,245,255,0.12)); }
  100% { transform: translateY(0px); filter: drop-shadow(0 0 0 rgba(54,245,255,0)); }
}

@keyframes list-enter {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}

#deck > section.active,
#deck > svg.active,
#deck .marpit > section.active,
#deck .marpit > svg.active {
  animation: slide-enter-forward 420ms cubic-bezier(.2,.7,.2,1) both;
  will-change: transform, opacity;
}

#deck > section.active.backward,
#deck > svg.active.backward,
#deck .marpit > section.active.backward,
#deck .marpit > svg.active.backward {
  animation-name: slide-enter-backward;
}

#deck .marpit > section.active h1,
#deck .marpit > section.active h2,
#deck .marpit > section.active h3,
#deck .marpit > section.active .kpi,
#deck .marpit > section.active .panel {
  animation: float-glow 2.8s ease-in-out 420ms infinite;
}

.active ul.stagger > li {
  opacity: 0;
  animation: list-enter 0.4s ease forwards;
}
.active ul.stagger > li:nth-child(1) { animation-delay: 0.15s; }
.active ul.stagger > li:nth-child(2) { animation-delay: 0.30s; }
.active ul.stagger > li:nth-child(3) { animation-delay: 0.45s; }
.active ul.stagger > li:nth-child(4) { animation-delay: 0.60s; }
.active ul.stagger > li:nth-child(5) { animation-delay: 0.75s; }

/* ECharts containers */
.echarts-chart {
  width: 100%;
  height: 280px;
  border-radius: 14px;
  background: linear-gradient(160deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
  border: 1px solid rgba(54,245,255,.18);
  box-shadow: 0 4px 20px rgba(0,0,0,.3), inset 0 0 0 1px rgba(255,255,255,.04);
  padding: 6px;
}
.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 12px;
}
.chart-row .echarts-chart {
  height: 250px;
}

@media (prefers-reduced-motion: reduce) {
  #deck > section.active,
  #deck > svg.active,
  #deck .marpit > section.active,
  #deck .marpit > svg.active,
  #deck .marpit > section.active h1,
  #deck .marpit > section.active h2,
  #deck .marpit > section.active h3,
  #deck .marpit > section.active .kpi,
  #deck .marpit > section.active .panel,
  .active ul.stagger > li {
    animation: none !important;
  }
}

.nav-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  border-radius: 9999px;
  padding: 8px 20px;
  z-index: 100;
  transition: opacity 0.3s;
  opacity: 0;
  pointer-events: none;
}
.nav-bar.visible {
  opacity: 1;
  pointer-events: auto;
}
.nav-btn {
  background: none; border: none; color: rgba(255,255,255,0.8);
  font-size: 14px; cursor: pointer; padding: 4px 8px;
}
.nav-btn:disabled { color: rgba(255,255,255,0.3); cursor: not-allowed; }
.nav-btn:hover:not(:disabled) { color: #00FFFF; }
.page-info { color: rgba(255,255,255,0.6); font-size: 12px; }
</style>
</head>
<body>
<div id="deck">${html}</div>

<div class="nav-bar visible" id="navBar">
  <button class="nav-btn" id="prevBtn" onclick="go(-1)">&larr; Prev</button>
  <span class="page-info" id="pageInfo"></span>
  <button class="nav-btn" id="nextBtn" onclick="go(1)">Next &rarr;</button>
</div>

<script>
(function() {
  var deck = document.getElementById('deck');
  var slides = deck
    ? Array.from(deck.querySelectorAll(':scope > section, :scope > svg, :scope > .marpit > section, :scope > .marpit > svg'))
    : [];
  var total = slides.length;
  var idx = 0;
  var lastIdx = 0;
  var hideTimer;
  var chartMap = {};

  /* ---- ECharts lazy init + replay animation on every visit ---- */
  function initCharts(slideEl) {
    if (typeof echarts === 'undefined') {
      console.warn('[slides] ECharts not loaded, will retry');
      return false;
    }
    var containers = slideEl.querySelectorAll('.echarts-chart');
    if (containers.length === 0) return true;
    containers.forEach(function(el) {
      var raw = el.getAttribute('data-option');
      if (!raw) { console.warn('[slides] No data-option on', el.id); return; }
      try {
        var opt = JSON.parse(raw);
        opt.backgroundColor = opt.backgroundColor || 'transparent';
        if (el._echInst) {
          el._echInst.clear();
          el._echInst.setOption(opt);
        } else {
          var w = el.getAttribute('data-width');
          var h = el.getAttribute('data-height');
          var iW = w ? parseInt(w, 10) : Math.max(el.offsetWidth || 0, 900);
          var iH = h ? parseInt(h, 10) : Math.max(el.offsetHeight || 0, 268);
          var chart = echarts.init(el, null, { width: iW, height: iH });
          chart.setOption(opt);
          el._echInst = chart;
          chartMap[el.id] = chart;
        }
      } catch(e) { console.error('[slides] Chart error:', e.message, '\\nraw:', raw.substring(0, 120)); }
    });
    return true;
  }

  function show(i) {
    if (total === 0) return;
    lastIdx = idx;
    idx = Math.max(0, Math.min(total - 1, i));
    slides.forEach(function(s, j) {
      if (j === idx) {
        s.classList.add('active');
        s.classList.toggle('backward', idx < lastIdx);
      } else {
        s.classList.remove('active');
        s.classList.remove('backward');
      }
    });
    document.getElementById('pageInfo').textContent = (idx + 1) + ' / ' + total;
    document.getElementById('prevBtn').disabled = idx === 0;
    document.getElementById('nextBtn').disabled = idx === total - 1;
    window.parent.postMessage({ type: 'slide-change', index: idx }, '*');
    var retries = 0;
    function tryInit() {
      var ok = initCharts(slides[idx]);
      if (!ok && retries < 8) { retries++; setTimeout(tryInit, 600); }
    }
    setTimeout(tryInit, 200);
  }

  window.go = function(d) { show(idx + d); };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault(); show(idx + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault(); show(idx - 1);
    }
  });

  window.addEventListener('message', function(e) {
    if (
      e.data &&
      e.data.type === 'slide-goto' &&
      Number.isInteger(e.data.index) &&
      e.data.index >= 0 &&
      e.data.index < total
    ) {
      show(e.data.index);
    }
  });

  var nav = document.getElementById('navBar');
  function resetTimer() {
    nav.classList.add('visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function() { nav.classList.remove('visible'); }, 2000);
  }
  document.addEventListener('mousemove', resetTimer);
  resetTimer();

  window.addEventListener('resize', function() {
    Object.keys(chartMap).forEach(function(k) {
      if (chartMap[k]) chartMap[k].resize();
    });
  });

  if (total === 0) {
    document.getElementById('pageInfo').textContent = '1 / 1';
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
    return;
  }

  show(${startIndex});
})();
</script>
</body>
</html>`;
}
