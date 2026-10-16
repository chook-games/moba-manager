import { state } from '../state.js';
import { t } from '../core/i18n.js';
import { getMode } from '../data/modes.js';
import { recordMatchResult } from '../storage.js';
import { formatTime } from '../utils.js';
import { refreshHome } from './menu.js';
import { onMatchEnd } from '../game/feedback.js';

export function endMatch(isVictory) {
  if (state.matchEnded) return;
  state.matchEnded = true;
  state.isGameRunning = false;
  onMatchEnd(isVictory);

  const blue = state.blueChampions;
  const totals = blue.reduce((acc, c) => {
    acc.kills += c.kills; acc.deaths += c.deaths; acc.assists += c.assists;
    return acc;
  }, { kills: 0, deaths: 0, assists: 0 });

  const mvp = [...blue].sort((a, b) =>
    (b.kills * 3 + b.assists - b.deaths) - (a.kills * 3 + a.assists - a.deaths)
  )[0];

  const result = {
    victory: isVictory,
    kills: totals.kills,
    deaths: totals.deaths,
    assists: totals.assists,
    duration: state.matchTimeSeconds,
    modeId: state.currentModeId,
    mvpChampionId: mvp ? mvp.id : null,
    mvpName: mvp ? mvp.name : '',
    championResults: blue.map((c) => ({ id: c.id, name: c.name, role: c.role, kills: c.kills, deaths: c.deaths, assists: c.assists, level: c.level })),
  };

  const mode = getMode(state.currentModeId);
  let rewards = { gold: 0, xp: 0 };
  let accountLevelsGained = 0;
  let masteryLevelsGained = 0;

  if (state.profile) {
    const res = recordMatchResult(state.profile, result, state.currentModeId);
    rewards = res.rewards;
    accountLevelsGained = res.accountLevelsGained;
    masteryLevelsGained = res.masteryLevelsGained;
    refreshHome();
  }

  state.lastResult = { ...result, rewards, accountLevelsGained, masteryLevelsGained };
  renderGameOver(result, rewards, accountLevelsGained, masteryLevelsGained, mode);
}

function renderGameOver(result, rewards, accountLevels, masteryLevels, mode) {
  const modal = document.getElementById('modal-gameover');
  const badge = document.getElementById('gameover-badge');
  const title = document.getElementById('gameover-title');
  const desc = document.getElementById('gameover-desc');
  const stats = document.getElementById('gameover-stats');
  const rewardsEl = document.getElementById('gameover-rewards');
  if (!modal) return;

  modal.classList.remove('hidden');

  if (result.victory) {
    badge.textContent = '🏆';
    badge.className = 'go-badge win';
    title.textContent = t('go.victory');
    title.className = 'go-title win';
    desc.textContent = t(mode.id === 'blitz' ? 'go.blitzWin' : 'go.winDesc');
  } else {
    badge.textContent = '💀';
    badge.className = 'go-badge lose';
    title.textContent = t('go.defeat');
    title.className = 'go-title lose';
    desc.textContent = t(mode.id === 'blitz' ? 'go.blitzLose' : 'go.loseDesc');
  }

  stats.innerHTML = result.championResults.map((c) => `
    <div class="go-stat-row">
      <span class="go-stat-name">${c.name} <span class="muted">(${c.role})</span></span>
      <span class="go-stat-val">${c.kills}/${c.deaths}/${c.assists} • Lv.${c.level}</span>
    </div>`).join('');

  if (rewardsEl) {
    const levelUps = [];
    if (accountLevels > 0) levelUps.push(t('go.accountLevels', { n: accountLevels }));
    if (masteryLevels > 0) levelUps.push(t('go.masteryLevels', { name: result.mvpName, n: masteryLevels }));
    rewardsEl.innerHTML = `
      <div class="go-rewards-title">${t('go.rewards', { mode: t(`mode.${mode.id}.name`), time: formatTime(result.duration) })}</div>
      <div class="go-rewards-row">
        <span class="reward-chip gold">🪙 +${rewards.gold}</span>
        <span class="reward-chip xp">✨ +${rewards.xp} XP</span>
        <span class="reward-chip mvp">${t('go.mvp', { name: result.mvpName })}</span>
      </div>
      ${levelUps.length ? `<div class="go-levelup">${levelUps.join(' ')}</div>` : ''}`;
  }
}
