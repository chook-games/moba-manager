// Stats screen: career totals, per-champion breakdown and recent matches.
import { state } from '../state.js';
import { t } from '../core/i18n.js';
import { aggregateStats, kda, winrate } from '../core/stats.js';
import { formatTime } from '../utils.js';

export function renderStats() {
  const el = document.getElementById('stats-content');
  if (!el || !state.profile) return;
  const { totals, champions, recent } = aggregateStats(state.profile);

  el.innerHTML = `
    <div class="stats-totals">
      <div class="stat"><span class="stat-val">${totals.matches}</span><span class="stat-label">${t('stats.matches')}</span></div>
      <div class="stat"><span class="stat-val">${totals.wins}</span><span class="stat-label">${t('stats.wins')}</span></div>
      <div class="stat"><span class="stat-val">${winrate(totals.wins, totals.matches)}%</span><span class="stat-label">${t('stats.winrate')}</span></div>
      <div class="stat"><span class="stat-val">${kda(totals.kills, totals.deaths, totals.assists)}</span><span class="stat-label">${t('stats.kda')}</span></div>
    </div>

    <div class="mission-head"><span>${t('stats.perChamp')}</span></div>
    <div class="mission-list">
      ${champions.length ? champions.map(champRow).join('') : `<div class="muted-note">${t('stats.noData')}</div>`}
    </div>

    <div class="mission-head"><span>${t('stats.recent')}</span></div>
    <div class="mission-list">
      ${recent.length ? recent.map(recentRow).join('') : `<div class="muted-note">${t('stats.noData')}</div>`}
    </div>`;
}

function champRow(c) {
  return `
    <div class="mission-row">
      <div class="mission-info">
        <div class="mission-name">${c.name} <span class="muted">${t(`role.${c.role}`)}</span></div>
        <div class="mission-desc">${c.games} ${t('stats.games')} · ${winrate(c.wins, c.games)}% ${t('stats.wr')}</div>
      </div>
      <span class="mission-claim" style="border-color:transparent;background:transparent;color:var(--amber)">${kda(c.kills, c.deaths, c.assists)}</span>
    </div>`;
}

function recentRow(m) {
  const cls = m.victory ? 'is-unlocked' : 'is-done';
  return `
    <div class="mission-row ${cls}">
      <div class="mission-info">
        <div class="mission-name">${m.victory ? '🏆 ' : '💀 '}${t(`mode.${m.modeId}.name`)}</div>
        <div class="mission-desc">${formatTime(m.duration)} · ⭐ ${m.mvp || '-'}</div>
      </div>
      <span class="mission-claim" style="border-color:transparent;background:transparent;color:var(--muted)">${m.kills}/${m.deaths}/${m.assists}</span>
    </div>`;
}
