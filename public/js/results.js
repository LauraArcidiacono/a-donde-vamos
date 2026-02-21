// ============================================================
// Results Screen
// ============================================================

import { state, $ } from './state.js';
import { MSG, PHASES, CITIES, TAG_LABELS, CITY_INFO } from '../data.js';
import { send } from './ws.js';
import { showScreen } from './screens.js';
import { haptic, copyToClipboard, showToast } from './utils.js';
import { showReadyScreen } from './ready.js';
import {
  requestResultsMusic,
  playCelebration,
  stopTimerWarning,
} from '../audio.js';

export function createResultsTemplate() {
  const section = document.createElement('section');
  section.id = 'screen-results';
  section.className = 'screen';
  section.innerHTML = `
    <div class="screen-content results-content">
      <h2 class="results-title">\u00A1Resultados!</h2>
      <div id="results-tabs" class="results-tabs">
        <button class="tab active" data-tab="p1">Tu top</button>
        <button class="tab" data-tab="p2">Su top</button>
        <button class="tab" data-tab="combined">Combinado</button>
      </div>
      <div id="results-p1" class="results-panel active"></div>
      <div id="results-p2" class="results-panel"></div>
      <div id="results-combined" class="results-panel"></div>
      <div id="results-coincidences" class="results-coincidences"></div>
      <details id="results-penalties" class="results-penalties">
        <summary>Ajustes por tus \u00ABno quiero\u00BB</summary>
        <div class="penalties-content"></div>
      </details>
      <div class="results-actions">
        <button id="btn-rematch" class="btn btn-primary">Revancha</button>
        <button id="btn-share-results" class="btn btn-secondary btn-small">
          <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          Compartir resultado
        </button>
      </div>
    </div>`;
  return section;
}

export function showResults(results) {
  state.currentPhase = PHASES.RESULTS;
  showScreen('screen-results');
  haptic('heavy');

  stopTimerWarning();
  requestResultsMusic();
  playCelebration();

  const p1Cities = (results.player1 && results.player1.top4) || results.player1 || [];
  const p2Cities = (results.player2 && results.player2.top4) || results.player2 || [];
  const combinedCities = (results.combined && results.combined.top5) || results.combined || [];
  renderResultsPanel('results-p1', p1Cities, results.coincidences || []);
  renderResultsPanel('results-p2', p2Cities, results.coincidences || []);
  renderResultsPanel('results-combined', combinedCities, results.coincidences || []);

  renderCoincidences(results.coincidences || []);

  const allPenalties = [
    ...(results.penalties && results.penalties.player1 || []),
    ...(results.penalties && results.penalties.player2 || []),
  ];
  renderPenalties(allPenalties);

  activateTab('p1');
  setupResultsTabs();
}

function renderResultsPanel(panelId, cities, coincidences) {
  const panel = $(panelId);
  if (!panel) return;
  panel.innerHTML = '';

  const coincidenceIds = coincidences.map((c) => (typeof c === 'string' ? c : c.id));

  cities.forEach((entry, index) => {
    const city = CITIES.find((c) => c.id === entry.cityId) || {};
    const isCoincidence = coincidenceIds.includes(entry.cityId);
    const scorePercent = Math.round((entry.score || 0) * 100);

    const card = document.createElement('div');
    card.className = `result-card${isCoincidence ? ' coincidence' : ''}`;

    const rank = document.createElement('span');
    rank.className = 'result-rank';
    rank.textContent = `${index + 1}`;

    const info = document.createElement('div');
    info.className = 'result-info';

    const nameEl = document.createElement('h4');
    nameEl.className = 'result-city-name';
    nameEl.textContent = `${city.name || entry.cityId}`;

    const country = document.createElement('span');
    country.className = 'result-country';
    country.textContent = city.country || '';

    const scoreBar = document.createElement('div');
    scoreBar.className = 'result-score-bar';
    const scoreFill = document.createElement('div');
    scoreFill.className = 'result-score-fill';
    scoreFill.style.width = `${scorePercent}%`;
    scoreBar.appendChild(scoreFill);

    const scoreLabel = document.createElement('span');
    scoreLabel.className = 'result-score-label';
    scoreLabel.textContent = `${scorePercent}%`;

    const tagsRow = document.createElement('div');
    tagsRow.className = 'result-tags';
    const topTags = (entry.topTags || []).slice(0, 3);
    topTags.forEach((t) => {
      const tagChip = document.createElement('span');
      tagChip.className = 'tag-chip';
      const tagId = typeof t === 'string' ? t : t.tag;
      const label = typeof t === 'string' ? (TAG_LABELS[t] || t) : (t.label || TAG_LABELS[t.tag] || t.tag);
      tagChip.textContent = label;
      tagsRow.appendChild(tagChip);
    });

    if (isCoincidence) {
      const badge = document.createElement('span');
      badge.className = 'coincidence-badge';
      badge.textContent = 'Coincidencia';
      info.appendChild(badge);
    }

    info.appendChild(nameEl);
    info.appendChild(country);
    info.appendChild(scoreBar);
    info.appendChild(scoreLabel);
    info.appendChild(tagsRow);

    const inner = document.createElement('div');
    inner.className = 'result-card-inner';

    const front = document.createElement('div');
    front.className = 'result-card-front';
    front.appendChild(rank);
    front.appendChild(info);

    const back = document.createElement('div');
    back.className = 'result-card-back';

    const cityInfo = CITY_INFO[entry.cityId];
    if (cityInfo) {
      const sections = [
        { key: 'pros', title: '\u{1F44D} Lo mejor', cssClass: 'pros' },
        { key: 'cons', title: '\u{1F44E} Lo peor', cssClass: 'cons' },
        { key: 'nature', title: '\u{1F33F} Naturaleza cerca', cssClass: 'nature' },
        { key: 'dishes', title: '\u{1F37D}\uFE0F Platos t\u00EDpicos', cssClass: 'dishes' },
      ];

      sections.forEach(({ key, title, cssClass }) => {
        const items = cityInfo[key];
        if (items && items.length > 0) {
          const section = document.createElement('div');
          section.className = `city-info-section ${cssClass}`;
          const h5 = document.createElement('h5');
          h5.textContent = title;
          section.appendChild(h5);
          items.forEach(item => {
            const p = document.createElement('div');
            p.className = 'city-info-item';
            p.textContent = item;
            section.appendChild(p);
          });
          back.appendChild(section);
        }
      });
      if (cityInfo.flights) {
        const flightLink = document.createElement('a');
        flightLink.className = 'city-flight-link';
        flightLink.href = cityInfo.flights;
        flightLink.target = '_blank';
        flightLink.rel = 'noopener noreferrer';
        flightLink.innerHTML = '\u2708\uFE0F Ver vuelos';
        flightLink.addEventListener('click', (e) => e.stopPropagation());
        back.appendChild(flightLink);
      }
    } else {
      const noInfo = document.createElement('p');
      noInfo.textContent = 'Info no disponible';
      noInfo.style.color = 'rgba(255,255,255,0.5)';
      back.appendChild(noInfo);
    }

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    const hint = document.createElement('div');
    hint.className = 'flip-hint';
    hint.innerHTML = 'Toca para ver m\u00E1s info <span class="flip-hint-icon">\u2192</span>';
    front.appendChild(hint);

    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });

    panel.appendChild(card);
  });
}

function renderCoincidences(coincidences) {
  const container = $('results-coincidences');
  if (!container) return;
  container.innerHTML = '';

  if (coincidences.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'no-coincidences';
    msg.textContent = 'No hay coincidencias directas, pero aqui va el top combinado';
    container.appendChild(msg);
    return;
  }

  const heading = document.createElement('h3');
  heading.className = 'coincidences-heading';
  heading.textContent = 'Coincidencias';
  container.appendChild(heading);

  const list = document.createElement('div');
  list.className = 'coincidence-list';

  coincidences.forEach((c) => {
    const cityId = typeof c === 'string' ? c : c.id;
    const city = CITIES.find((ci) => ci.id === cityId);

    const badge = document.createElement('div');
    badge.className = 'coincidence-item';
    badge.innerHTML = `<span class="coincidence-icon">&#127942;</span><span class="coincidence-name">${city ? city.name : cityId}</span>`;
    list.appendChild(badge);
  });

  container.appendChild(list);
}

function renderPenalties(penalties) {
  const container = $('results-penalties');
  if (!container) return;

  const content = container.querySelector('.penalties-content');
  if (!content) return;
  content.innerHTML = '';

  if (!penalties || penalties.length === 0) {
    const msg = document.createElement('p');
    msg.textContent = 'No se aplicaron ajustes.';
    content.appendChild(msg);
    return;
  }

  penalties.forEach((p) => {
    const item = document.createElement('div');
    item.className = 'penalty-item';

    const reason = document.createElement('span');
    reason.className = 'penalty-reason';
    reason.textContent = p.reason || p.label || '';

    const effect = document.createElement('span');
    effect.className = 'penalty-effect';
    effect.textContent = p.effect || '';

    item.appendChild(reason);
    item.appendChild(effect);
    content.appendChild(item);
  });
}

function setupResultsTabs() {
  const tabContainer = $('results-tabs');
  if (!tabContainer) return;

  const tabs = tabContainer.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      haptic();
      activateTab(tab.dataset.tab);
    });
  });
}

function activateTab(tabName) {
  const tabs = $('results-tabs').querySelectorAll('.tab');
  tabs.forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });

  const panelMap = { p1: 'results-p1', p2: 'results-p2', combined: 'results-combined' };
  Object.entries(panelMap).forEach(([key, panelId]) => {
    const panel = $(panelId);
    if (panel) {
      panel.classList.toggle('active', key === tabName);
    }
  });
}

export function setupShareResults() {
  $('btn-share-results').addEventListener('click', async () => {
    haptic();

    const combinedPanel = $('results-combined');
    const cards = combinedPanel ? combinedPanel.querySelectorAll('.result-card') : [];

    let text = '\u{1F3AF} \u00BFA Donde Vamos? \u2014 Resultados\n\n\u{1F3C6} Top combinado:\n';

    cards.forEach((card, i) => {
      const name = card.querySelector('.result-city-name');
      const country = card.querySelector('.result-country');
      const score = card.querySelector('.result-score-label');
      const tags = card.querySelectorAll('.tag-chip');

      const cityStr = name ? name.textContent : '';
      const countryStr = country ? ` (${country.textContent})` : '';
      const scoreStr = score ? ` \u2014 ${score.textContent}` : '';
      const tagStrs = Array.from(tags).map((t) => t.textContent).join(', ');

      text += `${i + 1}. ${cityStr}${countryStr}${scoreStr}\n`;
      if (tagStrs) {
        text += `   \u2728 ${tagStrs}\n`;
      }
    });

    const coincItems = $('results-coincidences') ? $('results-coincidences').querySelectorAll('.coincidence-name') : [];
    if (coincItems.length > 0) {
      const names = Array.from(coincItems).map((el) => el.textContent);
      text += `\n\u{1F91D} Coincidencias: ${names.join(', ')}\n`;
    }

    text += `\n\u00A1Juega tu tambien! ${location.origin}${location.pathname}`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled
      }
    } else {
      await copyToClipboard(text);
      showToast('Resultado copiado al portapapeles');
    }
  });
}

export function setupRematch() {
  $('btn-rematch').addEventListener('click', () => {
    haptic();
    send({ type: MSG.REMATCH });
    $('btn-rematch').disabled = true;
    $('btn-rematch').textContent = 'Esperando...';
  });
}

export function resetForRematch() {
  state.mg1ExtendUsed = {};
  state.currentSelections = [];
  state.partnerAnswered = false;
  state.currentQuestionId = null;
  state.answered = false;

  $('btn-rematch').disabled = false;
  $('btn-rematch').textContent = 'Revancha';

  showReadyScreen();
  $('btn-ready').disabled = false;
  $('btn-ready').textContent = '\u00A1Estoy listo!';
}
