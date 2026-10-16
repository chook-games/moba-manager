// Renders the end-of-match summary to a shareable PNG (Web Share API or download).
import { t } from './i18n.js';
import { formatTime } from '../utils.js';
import { getMode } from '../data/modes.js';

export async function shareResult(result) {
  if (!result) return false;
  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  // Background
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0d1117');
  g.addColorStop(1, '#1a1220');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = '#fbbf24';
  ctx.font = '900 46px Inter, sans-serif';
  ctx.fillText('MOBA MANAGER', 70, 130);
  ctx.fillStyle = '#64748b';
  ctx.font = '800 26px Inter, sans-serif';
  ctx.fillText(getMode(result.modeId).name.toUpperCase(), 70, 172);

  // Result
  ctx.fillStyle = result.victory ? '#fbbf24' : '#f43f5e';
  ctx.font = '900 120px Inter, sans-serif';
  ctx.fillText(t(result.victory ? 'go.victory' : 'go.defeat'), 70, 320);

  // Big team line
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '900 64px Inter, sans-serif';
  ctx.fillText(`${result.kills} / ${result.deaths} / ${result.assists}`, 70, 430);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 28px Inter, sans-serif';
  ctx.fillText(`${formatTime(result.duration)}  •  ${t('stats.kda')} K/D/A`, 70, 470);

  // Champion rows
  let y = 570;
  (result.championResults || []).forEach((c) => {
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 34px Inter, sans-serif';
    ctx.fillText(c.name, 70, y);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 28px Inter, sans-serif';
    ctx.fillText(c.role, 430, y);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '800 34px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${c.kills}/${c.deaths}/${c.assists}`, W - 70, y);
    ctx.textAlign = 'left';
    y += 62;
  });

  // MVP + footer
  if (result.mvpName) {
    ctx.fillStyle = '#c084fc';
    ctx.font = '900 36px Inter, sans-serif';
    ctx.fillText(`⭐ MVP  ${result.mvpName}`, 70, y + 20);
  }
  ctx.fillStyle = '#475569';
  ctx.font = '700 26px Inter, sans-serif';
  ctx.fillText('chook-games.github.io/moba-manager', 70, H - 60);

  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  if (!blob) return false;

  const text = `MOBA Manager — ${t(result.victory ? 'go.victory' : 'go.defeat')} · ${result.kills}/${result.deaths}/${result.assists}`;
  try {
    const file = new File([blob], 'moba-manager-result.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'MOBA Manager', text });
      return true;
    }
  } catch (_) { /* fall through to download */ }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'moba-manager-result.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return true;
}
