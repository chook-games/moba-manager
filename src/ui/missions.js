// Missions screen: daily quests, achievements and login streak.
import { state } from '../state.js';
import { t } from '../core/i18n.js';
import { saveProfile } from '../storage.js';
import {
  ensureDaily, questProgress, isQuestClaimed, claimQuest,
  evaluateAchievements, claimAchievement,
} from '../core/missions.js';
import { sfx } from '../core/audio.js';
import { haptics } from '../core/haptics.js';

let bound = false;

export function renderMissions() {
  const profile = state.profile;
  if (!profile) return;
  const daily = ensureDaily(profile);

  const streakEl = document.getElementById('daily-streak');
  if (streakEl) streakEl.textContent = t('missions.streak', { n: daily.streak });

  const questsEl = document.getElementById('daily-quests-list');
  if (questsEl) {
    questsEl.innerHTML = profile.daily.quests.map((q) => {
      const cur = questProgress(profile, q);
      const claimed = isQuestClaimed(profile, q.id);
      const canClaim = !claimed && cur >= q.target;
      const pct = Math.round((cur / q.target) * 100);
      return `
        <div class="mission-row ${claimed ? 'is-done' : ''}">
          <div class="mission-info">
            <div class="mission-name">${t(`mission.kind.${q.kind}`, { n: q.target })}</div>
            <div class="bar"><div class="bar-fill bar-xp" style="width:${pct}%"></div></div>
            <div class="mission-prog">${cur}/${q.target}</div>
          </div>
          <button class="mission-claim ${canClaim ? 'ready' : ''}" data-quest="${q.id}" ${canClaim ? '' : 'disabled'}>
            ${claimed ? t('missions.claimed') : t('missions.claim')} · 🪙${q.reward}
          </button>
        </div>`;
    }).join('');
  }

  const achEl = document.getElementById('achievements-list');
  if (achEl) {
    achEl.innerHTML = evaluateAchievements(profile).map((a) => {
      const canClaim = a.unlocked && !a.claimed;
      return `
        <div class="mission-row ${a.claimed ? 'is-done' : (a.unlocked ? 'is-unlocked' : '')}">
          <div class="mission-info">
            <div class="mission-name">${t(`ach.${a.id}.name`)}</div>
            <div class="mission-desc">${t(`ach.${a.id}.desc`)}</div>
          </div>
          <button class="mission-claim ${canClaim ? 'ready' : ''}" data-ach="${a.id}" ${canClaim ? '' : 'disabled'}>
            ${a.claimed ? t('missions.claimed') : t('missions.claim')} · 🪙${a.reward}
          </button>
        </div>`;
    }).join('');
  }
}

export function bindMissions() {
  if (bound) return;
  bound = true;

  const screen = document.getElementById('screen-missions');
  screen?.addEventListener('click', (e) => {
    const q = e.target.closest('[data-quest]');
    if (q) {
      const gained = claimQuest(state.profile, q.dataset.quest);
      if (gained) { sfx.kill(); haptics.kill(); saveProfile(state.profile); }
      renderMissions();
      return;
    }
    const a = e.target.closest('[data-ach]');
    if (a) {
      const gained = claimAchievement(state.profile, a.dataset.ach);
      if (gained) { sfx.kill(); haptics.kill(); saveProfile(state.profile); }
      renderMissions();
    }
  });
}
