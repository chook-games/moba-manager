// Aggregates the local match history into totals + per-champion career stats.
export function aggregateStats(profile) {
  const totals = { matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
  const perChamp = {};

  (profile.history || []).forEach((m) => {
    totals.matches++;
    if (m.victory) totals.wins++;
    totals.kills += m.kills || 0;
    totals.deaths += m.deaths || 0;
    totals.assists += m.assists || 0;

    (m.champs || []).forEach((c) => {
      const e = perChamp[c.id] || (perChamp[c.id] = {
        id: c.id, name: c.name, role: c.role, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0,
      });
      e.games++;
      if (m.victory) e.wins++;
      e.kills += c.kills || 0;
      e.deaths += c.deaths || 0;
      e.assists += c.assists || 0;
    });
  });

  const champions = Object.values(perChamp).sort((a, b) => b.games - a.games);
  return { totals, champions, recent: (profile.history || []).slice(0, 10) };
}

export function kda(k, d, a) {
  return ((k + a) / Math.max(1, d)).toFixed(2);
}

export function winrate(wins, games) {
  return games ? Math.round((wins / games) * 100) : 0;
}
