// Headless unit/integration smoke test. Stubs browser globals, imports the whole
// module graph, then exercises game logic + save migration. No browser required.

const noop = () => {};
function makeEl() {
  return {
    style: {},
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    appendChild: noop, setAttribute: noop, addEventListener: noop, remove: noop,
    querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    children: [], childElementCount: 0, innerHTML: '', textContent: '',
  };
}

globalThis.window = { addEventListener: noop, removeEventListener: noop, scrollTo: noop, location: { href: '' }, devicePixelRatio: 1 };
globalThis.document = {
  getElementById: () => null, addEventListener: noop, querySelector: () => null,
  querySelectorAll: () => [], createElement: makeEl, body: { appendChild: noop },
};
globalThis.performance = { now: () => 0 };
globalThis.requestAnimationFrame = () => 0;
globalThis.setTimeout = globalThis.setTimeout || noop;
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.THREE = {
  Vector3: function Vector3() { return { set() { return this; }, project() { return this; } }; },
  Group: function () { this.children = []; this.add = noop; this.remove = noop; },
  Scene: function () { this.add = noop; },
  Vector2: function () {},
  Raycaster: function () { this.setFromCamera = noop; this.intersectObject = () => []; },
};

const failed = [];
let passed = 0;
function check(name, cond) {
  if (cond) { passed++; } else { failed.push(name); }
}

// 1. Import the full graph (catches import-time errors, undefined bindings, cycles).
await import('../src/main.js');
check('import full module graph', true);

const utils = await import('../src/utils.js');
check('clamp', utils.clamp(5, 0, 3) === 3);
check('lanePosFromS midpoint', Math.abs(utils.lanePosFromS(0.5, 0).x) < 1e-6);
check('sFromWorld inverse', Math.abs(utils.sFromWorld(0, 0) - 0.5) < 1e-6);
check('distXZ', utils.distXZ({ x: 0, z: 0 }, { x: 3, z: 4 }) === 5);
check('formatTime', utils.formatTime(65) === '01:05');

const config = await import('../src/config.js');
check('APP_VERSION defined', typeof config.APP_VERSION === 'string' && config.APP_VERSION.length > 0);
check('default speed is 0.5x', config.SPEED_STEPS[config.DEFAULT_SPEED_INDEX].mult === 0.5);

// 2. Meta / storage
const storage = await import('../src/storage.js');
const profile = storage.defaultProfile();
check('default profile free champs = 5', profile.unlocked.length === 5);
check('free champ unlocked', storage.isUnlocked(profile, 'wildfire'));
check('locked champ locked', !storage.isUnlocked(profile, 'aetherblade'));
check('unlock fails without gold', storage.unlockChampion(profile, 'aetherblade') === false);

profile.gold = 9999;
check('unlock succeeds with gold', storage.unlockChampion(profile, 'aetherblade') === true);
check('unlocked now owned', storage.isUnlocked(profile, 'aetherblade'));

const res = storage.recordMatchResult(profile, {
  victory: true, kills: 10, deaths: 3, assists: 8, duration: 600,
  mvpChampionId: 'wildfire',
  championResults: [{ id: 'wildfire', kills: 10, deaths: 3, assists: 8 }],
}, 'aram');
check('rewards gold > 0', res.rewards.gold > 0);
check('rewards xp > 0', res.rewards.xp > 0);
check('stats match recorded', profile.stats.matches === 1 && profile.stats.wins === 1);
check('mastery recorded', !!profile.mastery.wildfire);

// 3. Save migration: an old/garbage save must be repaired, not crash.
localStorage.setItem(config.SAVE_KEY, JSON.stringify({ version: 1, level: 7, gold: 1234, unlocked: ['wildfire'] }));
const migrated = storage.loadProfile();
check('migration keeps level', migrated.level === 7);
check('migration keeps gold', migrated.gold === 1234);
check('migration re-adds free champs', migrated.unlocked.length === 5);
check('migration adds settings', !!migrated.settings && typeof migrated.settings.haptic === 'boolean');
check('migration adds stats', !!migrated.stats && migrated.stats.matches === 0);
check('v1 save nudge to easy', migrated.settings.difficulty === 'easy');

localStorage.setItem(config.SAVE_KEY, 'not json {');
const recovered = storage.loadProfile();
check('corrupt save recovers to default', recovered.level === 1 && recovered.unlocked.length === 5);

// 4. Progression
const prog = await import('../src/data/progression.js');
check('accountXpToNext increases', prog.accountXpToNext(2) > prog.accountXpToNext(1));
const lvlProfile = storage.defaultProfile();
const gained = prog.applyAccountXp(lvlProfile, 100000);
check('account levels up on big xp', gained > 0 && lvlProfile.level > 1);
check('computeRewards finite', Number.isFinite(prog.computeRewards({ victory: false, kills: 1, deaths: 5, assists: 0, duration: 120 }, { rewardMult: 1 }).gold));

// 4c. Missions (daily + achievements)
const missions = await import('../src/core/missions.js');
const mp = storage.defaultProfile();
const beforeGold = mp.gold;
const dl = missions.ensureDaily(mp);
check('daily login grants gold', dl.granted > 0 && mp.gold === beforeGold + dl.granted);
check('daily quests picked (4)', mp.daily.quests.length === 4);
check('second ensureDaily no grant', missions.ensureDaily(mp).granted === 0);
storage.recordMatchResult(mp, {
  victory: true, kills: 5, deaths: 1, assists: 3, duration: 300, mvpChampionId: 'wildfire',
  championResults: [{ id: 'wildfire', role: 'Marksman', kills: 5, deaths: 1, assists: 3 }],
}, 'aram');
check('daily matches counter', mp.daily.counters.matches === 1);
check('daily kills counter', mp.daily.counters.kills === 5);
check('lifetime nexus counter', (mp.counters.nexus || 0) >= 1);
check('achievement first_win unlocked', missions.evaluateAchievements(mp).find((a) => a.id === 'first_win').unlocked);
check('claim achievement rewards', missions.claimAchievement(mp, 'first_win') === 200);
check('achievement cannot double-claim', missions.claimAchievement(mp, 'first_win') === 0);

// 4e. Difficulty + stats
const diffMod = await import('../src/data/difficulty.js');
check('difficulty default easy', storage.defaultProfile().settings.difficulty === 'easy');
check('difficulty easy < hard', diffMod.getDifficulty('easy').redMult < diffMod.getDifficulty('hard').redMult);
check('difficulty tunables', diffMod.getDifficulty('easy').redSearch < diffMod.getDifficulty('hard').redSearch && typeof diffMod.BLUE_RETREAT_AT === 'number');
const statsAgg = await import('../src/core/stats.js');
const agg = statsAgg.aggregateStats(mp);
check('stats totals reflect a match', agg.totals.matches >= 1);
check('stats per-champion aggregates', agg.champions.length >= 1 && agg.champions[0].games >= 1);
check('kda helper', statsAgg.kda(5, 1, 3) === '8.00');

// 4d. Save transfer codes
const code = storage.exportSaveCode(profile);
check('save code format', typeof code === 'string' && code.startsWith('MOBA1.'));
const restored = storage.importSaveCode(code);
check('save code round-trip', !!restored && restored.level === profile.level && restored.gold === profile.gold);
check('save code rejects garbage', storage.importSaveCode('@@not-a-code@@') === null);

// 4b. i18n
const i18n = await import('../src/core/i18n.js');
i18n.setLang('en');
check('i18n EN lookup', i18n.t('order.FARM') === 'Farm');
check('i18n vars', i18n.t('mode.lock', { lv: 3 }) === '🔒 Lv.3');
i18n.setLang('el');
check('i18n EL lookup', i18n.t('home.gold') === '🪙 Χρυσός');
check('i18n fallback to key', i18n.t('does.not.exist') === 'does.not.exist');
i18n.setLang('en');

// 5. Data integrity
const champs = await import('../src/data/champions.js');
const abilities = await import('../src/data/abilities.js');
const modes = await import('../src/data/modes.js');
check('18 champions', champs.CHAMPION_POOL.length === 18);
check('every champion has a valid ability', champs.CHAMPION_POOL.every((c) => abilities.ABILITIES[c.ability]));
check('every champion has unlock data', champs.CHAMPION_POOL.every((c) => typeof c.unlockCost === 'number'));
check('default squad ids valid', champs.DEFAULT_SQUAD_IDS.every((id) => champs.getChampion(id)));
check('4 modes', modes.MODE_LIST.length === 4);
check('sudden death halves structures', modes.getMode('sudden').structHpMult < 1);
check('unknown mode falls back to aram', modes.getMode('nope').id === 'aram');
check('blitz has kill target', modes.getMode('blitz').killTarget === 25);

// 5b. Abilities (2nd slot) + perks
const abil = await import('../src/game/abilities.js');
check('ROLE_SECOND maps valid abilities', Object.values(abilities.ROLE_SECOND).every((id) => abilities.ABILITIES[id]));
check('PERKS defined', abilities.PERKS.length >= 3);
const perkChamp = { dead: false, perkPoints: 1, x: 0, z: 0, ad: 100, ap: 50, maxHp: 1000, hp: 500, armor: 20, as: 1.0 };
const perkRes = abil.castPerk(perkChamp);
check('castPerk consumes a point', perkRes.ok && perkChamp.perkPoints === 0);
const slot2Champ = { dead: false, x: 0, z: 0, armor: 20, hp: 100, maxHp: 200, shieldTimer: 0, ability2: 'fortify', ability2Timer: 0 };
const slot2Res = abil.castAbility(slot2Champ, 2);
check('castAbility slot 2 works', slot2Res.ok && slot2Champ.ability2Timer > 0);
check('ability2 on cooldown blocked', abil.castAbility(slot2Champ, 2).ok === false);

// 5c. Cosmetics + share
const cos = await import('../src/data/cosmetics.js');
check('unlockedTitles gates by level', cos.unlockedTitles(5).some((x) => x.id === 'commander') && !cos.unlockedTitles(1).some((x) => x.id === 'commander'));
check('getSkin falls back to default', cos.getSkin('nope').id === 'default');
check('profile has cosmetics', !!storage.defaultProfile().cosmetics && Array.isArray(storage.defaultProfile().cosmetics.unlockedSkins));
const shareMod = await import('../src/core/share.js');
check('share module loads', typeof shareMod.shareResult === 'function');

// 6. Combat / AI math + level cap
const combat = await import('../src/game/combat.js');
check('effectiveAttackInterval positive', combat.effectiveAttackInterval({ as: 0.9, asBonus: 0 }) > 0);
check('attack speed buff shortens interval', combat.effectiveAttackInterval({ as: 0.9, asBonus: 1 }) < combat.effectiveAttackInterval({ as: 0.9, asBonus: 0 }));
const unit = { level: 1, xp: 0, maxHp: 100, hp: 100, ad: 10, armor: 10 };
combat.addChampionXp(unit, 1e9);
check('level caps at MAX_LEVEL', unit.level === config.CONFIG.MAX_LEVEL);

console.log(`smoke: ${passed} passed, ${failed.length} failed`);
if (failed.length) { console.error('FAILED:\n - ' + failed.join('\n - ')); process.exit(1); }
