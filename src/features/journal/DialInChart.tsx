/**
 * Dial-in chart: the learner's own attempts at one drink, time (x) vs ratio (y), connected oldest → newest,
 * latest highlighted, with an illustrative "common starting zone". Every point links to its journal entry.
 * A data table carries the same information for screen readers and anyone who prefers numbers.
 * Original inline SVG (no chart library).
 */
import { useId, useState } from 'react';
import { Link, useHref, useNavigate } from 'react-router';
import type { BrewLogEntry, Locale } from '../../domain/contracts';
import { formatRatio } from '../../domain/brew';
import { useI18n } from '../../i18n';
import { Button, Callout, EvidenceBadge, Tag } from '../../ui';
import { entryDrinkLabel, getDrink } from '../practice/catalog';
import { formatClock } from '../practice/timer';
import { dialInScales, dialInSeries, MIN_POINTS, zoneFor, type ChartBox, type DialInPoint } from './dialIn';
import { formatWhen } from './format';

const S = {
  title: (drink: string) => ({ zh: `调校轨迹：${drink}`, en: `Dial-in path: ${drink}` }),
  lead: {
    zh: '你自己记录的每一次尝试：横轴是时间，纵轴是比例，按记录顺序连线，最新一次突出显示。点一个点打开那条记录。',
    en: 'Each attempt you logged: time across, ratio up, joined in the order you logged them, latest highlighted. Tap a point to open that cup.',
  },
  followFilter: { zh: '用上面的“按饮品筛选”可以切换饮品。', en: 'Use “Filter by drink” above to switch drinks.' },
  emptyTitle: { zh: '再记录一次，就能看到你的调校轨迹', en: 'One more attempt and your dial-in path appears' },
  empty: (n: number) => ({
    zh: `需要至少两次同一款饮品、同时记录了粉量、出液/水量和时间的尝试。目前可绘制：${n} 次。`,
    en: `It needs at least two attempts of the same drink with dose, output and time logged. Plottable so far: ${n}.`,
  }),
  logOne: { zh: '记录一杯', en: 'Log a cup' },
  xEspresso: { zh: '萃取时间', en: 'Shot time' },
  xBrew: { zh: '总时间', en: 'Total time' },
  yEspresso: { zh: '比例（出液 ÷ 粉量）', en: 'Ratio (yield ÷ dose)' },
  yBrew: { zh: '比例（水 ÷ 粉量）', en: 'Ratio (water ÷ coffee)' },
  zone: { zh: '常见起点（示意）', en: 'Common starting zone (illustrative)' },
  noZone: { zh: '这款饮品没有显示常见起点范围。', en: 'No common starting zone is shown for this drink.' },
  latest: { zh: '最新', en: 'Latest' },
  keyOlder: { zh: '更早的尝试（按顺序连线）', en: 'Earlier attempts (joined in order)' },
  first: { zh: '第 1 次', en: '#1' },
  point: (n: number, time: string, ratio: string, when: string, latest: boolean) => ({
    zh: `第 ${n} 次${latest ? '（最新）' : ''}：${time}，${ratio}，${when}。打开这条记录`,
    en: `Attempt ${n}${latest ? ' (latest)' : ''}: ${time}, ${ratio}, ${when}. Open this cup`,
  }),
  summary: (n: number, time: string, ratio: string) => ({
    zh: `共绘制 ${n} 次尝试（从早到晚连线）。最新一次：${time}，${ratio}。`,
    en: `${n} attempts plotted, joined oldest to newest. Latest: ${time} at ${ratio}.`,
  }),
  unplotted: (n: number) => ({ zh: `另有 ${n} 杯缺少时间或粉量/出液，没有绘制（不会替你估算）。`, en: `${n} more cup${n === 1 ? '' : 's'} missing time or dose/output — not plotted (never estimated).` }),
  showTable: { zh: '以表格显示数据', en: 'Show the data as a table' },
  hideTable: { zh: '隐藏表格', en: 'Hide the table' },
  caption: (drink: string) => ({ zh: `${drink}：每次尝试的时间和比例`, en: `${drink}: time and ratio of each attempt` }),
  colN: { zh: '尝试', en: 'Attempt' },
  colWhen: { zh: '记录于', en: 'Logged' },
  colTime: { zh: '时间', en: 'Time' },
  colRatio: { zh: '比例', en: 'Ratio' },
  colInOut: { zh: '粉量 → 出液/水', en: 'Dose → output' },
  attempt: (n: number) => ({ zh: `第 ${n} 次`, en: `Attempt ${n}` }),
  timed: { zh: '应用计时', en: 'Timed in app' },
  honest: {
    zh: '数据全部来自你的记录（时间若标注“应用计时”，则是应用在你点按之间测得的）。阴影区域只是常见经验，不是评分。',
    en: 'All data are your own logs (a time marked “Timed in app” was measured between your taps). The shaded zone is a rule of thumb, not a score.',
  },
};

const BOX: ChartBox = { width: 360, height: 240, left: 54, right: 16, top: 18, bottom: 40 };

/** Compact date for the table (fits a phone row); falls back to the full format. */
function shortWhen(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return formatWhen(iso, locale);
  }
}

function fmtTime(sec: number, mmss: boolean): string {
  return mmss ? formatClock(sec * 1000) : `${Math.round(sec)} s`;
}

export interface DialInChartProps {
  entries: readonly BrewLogEntry[];
  drinkId: string;
  /** True when the drink was chosen automatically (no filter set) — explain how to switch. */
  auto?: boolean;
}

export function DialInChart({ entries, drinkId, auto }: DialInChartProps) {
  const { t, locale } = useI18n();
  const uid = useId();
  const navigate = useNavigate();
  const journalHref = useHref('/journal');
  const [showTable, setShowTable] = useState(false);
  const drink = getDrink(drinkId);
  const drinkName = t(entryDrinkLabel({ drinkId }));
  const espresso = drink ? drink.category === 'espresso' || drink.category === 'espresso-milk' : false;
  const { points, unplotted } = dialInSeries(entries, drinkId);
  const zone = zoneFor({ drinkId, category: drink?.category });
  const headingId = `${uid}-h`;
  const tableId = `${uid}-table`;

  const head = (
    <>
      <h3 id={headingId} className="jr-h3">
        {t(S.title(drinkName))}
      </h3>
      <p className="jr-small cl-muted">
        {t(S.lead)} {auto && t(S.followFilter)}
      </p>
    </>
  );

  if (points.length < MIN_POINTS) {
    return (
      <section className="jr-dialin jr-dialin--empty" aria-labelledby={headingId} data-testid="dialin-empty">
        {head}
        <p className="jr-dialin__empty-title">
          <strong>{t(S.emptyTitle)}</strong>
        </p>
        <p className="jr-small">{t(S.empty(points.length))}</p>
        <div>
          <Link className="cl-btn cl-btn--secondary cl-btn--md" to={drink ? `/journal?log=1&drink=${encodeURIComponent(drinkId)}` : '/journal?log=1'}>
            {t(S.logOne)}
          </Link>
        </div>
      </section>
    );
  }

  const latest = points[points.length - 1]!;
  const mmss = !espresso && Math.max(...points.map((p) => p.timeSec), zone?.timeSec[1] ?? 0) >= 90;
  const sc = dialInScales(points, zone, BOX);
  const plotRight = BOX.width - BOX.right;
  const plotBottom = BOX.height - BOX.bottom;
  const pathD = points.map((p) => `${sc.x(p.timeSec).toFixed(1)},${sc.y(p.ratio).toFixed(1)}`).join(' ');
  const when = (p: DialInPoint) => formatWhen(p.createdAt, locale as Locale);
  const label = (p: DialInPoint) => t(S.point(p.n, fmtTime(p.timeSec, mmss), formatRatio(p.ratio), when(p), p.latest));
  const go = (id: string) => navigate(`/journal?entry=${encodeURIComponent(id)}`);

  return (
    <section className="jr-dialin" aria-labelledby={headingId} data-testid="dialin">
      {head}
      <figure className="jr-dialin__figure">
        <svg
          className="jr-dialin__svg"
          viewBox={`0 0 ${BOX.width} ${BOX.height}`}
          role="group"
          aria-labelledby={headingId}
          aria-describedby={`${uid}-sum`}
          data-testid="dialin-svg"
        >
          {/* grid + axes (recessive hairlines) */}
          {sc.yTicks.map((v) => (
            <g key={`y${v}`} className="jr-dialin__tick">
              <line x1={BOX.left} x2={plotRight} y1={sc.y(v)} y2={sc.y(v)} className="jr-dialin__grid" />
              <text x={BOX.left - 6} y={sc.y(v)} dy="0.32em" textAnchor="end" aria-hidden="true">
                1:{Number.isInteger(v) ? v : v.toFixed(1)}
              </text>
            </g>
          ))}
          {sc.xTicks.map((v) => (
            <g key={`x${v}`} className="jr-dialin__tick">
              <line x1={sc.x(v)} x2={sc.x(v)} y1={BOX.top} y2={plotBottom} className="jr-dialin__grid" />
              <text x={sc.x(v)} y={plotBottom + 14} textAnchor="middle" aria-hidden="true">
                {fmtTime(v, mmss)}
              </text>
            </g>
          ))}
          <line x1={BOX.left} x2={plotRight} y1={plotBottom} y2={plotBottom} className="jr-dialin__axis" />
          <line x1={BOX.left} x2={BOX.left} y1={BOX.top} y2={plotBottom} className="jr-dialin__axis" />
          <text className="jr-dialin__axis-label" x={(BOX.left + plotRight) / 2} y={BOX.height - 6} textAnchor="middle" aria-hidden="true">
            {t(espresso ? S.xEspresso : S.xBrew)}
          </text>
          <text className="jr-dialin__axis-label" transform={`translate(11 ${(BOX.top + plotBottom) / 2}) rotate(-90)`} textAnchor="middle" aria-hidden="true">
            {t(espresso ? S.yEspresso : S.yBrew)}
          </text>

          {zone && (
            <g className="jr-dialin__zone" data-testid="dialin-zone">
              <rect
                x={sc.x(zone.timeSec[0])}
                y={sc.y(zone.ratio[1])}
                width={sc.x(zone.timeSec[1]) - sc.x(zone.timeSec[0])}
                height={sc.y(zone.ratio[0]) - sc.y(zone.ratio[1])}
                rx={4}
              />
            </g>
          )}

          <polyline className="jr-dialin__path" points={pathD} />

          {points.map((p) => {
            const cx = sc.x(p.timeSec);
            const cy = sc.y(p.ratio);
            const href = `${journalHref}?entry=${encodeURIComponent(p.id)}`;
            return (
              <a
                key={p.id}
                href={href}
                className={`jr-dialin__pt${p.latest ? ' is-latest' : ''}`}
                aria-label={label(p)}
                data-testid={`dialin-point-${p.n}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(p.id);
                }}
              >
                <title>{label(p)}</title>
                <circle className="jr-dialin__hit" cx={cx} cy={cy} r={24} />
                {p.latest && <circle className="jr-dialin__halo" cx={cx} cy={cy} r={11} />}
                <circle className="jr-dialin__dot" cx={cx} cy={cy} r={p.latest ? 7 : 5} />
              </a>
            );
          })}
          {/* Selective direct labels (first + latest), outside the links so each link's name stays its aria-label. */}
          {points
            .filter((p) => p.latest || p.n === 1)
            .map((p) => (
              <text key={`l-${p.id}`} className="jr-dialin__pt-label" x={sc.x(p.timeSec)} y={sc.y(p.ratio) - (p.latest ? 15 : 10)} textAnchor="middle" aria-hidden="true">
                {p.latest ? t(S.latest) : t(S.first)}
              </text>
            ))}
        </svg>
        <ul className="jr-dialin__legend jr-small" aria-hidden="true">
          <li>
            <span className="jr-dialin__key jr-dialin__key--older" /> {t(S.keyOlder)}
          </li>
          <li>
            <span className="jr-dialin__key jr-dialin__key--latest" /> {t(S.latest)}
          </li>
          {zone && (
            <li>
              <span className="jr-dialin__key jr-dialin__key--zone" /> {t(S.zone)}
            </li>
          )}
        </ul>
        <figcaption id={`${uid}-sum`} className="jr-small">
          {t(S.summary(points.length, fmtTime(latest.timeSec, mmss), formatRatio(latest.ratio)))}
        </figcaption>
      </figure>

      {zone ? (
        <Callout kind="illustrative" locale={locale}>
          {t(zone.basis)}
        </Callout>
      ) : (
        <p className="jr-small cl-muted">{t(S.noZone)}</p>
      )}
      {unplotted.length > 0 && <p className="jr-small cl-muted">{t(S.unplotted(unplotted.length))}</p>}
      <p className="jr-small cl-muted">
        <EvidenceBadge kind="self_report" locale={locale} /> {t(S.honest)}
      </p>

      <div>
        <Button variant="secondary" size="md" icon={showTable ? 'chevron-up' : 'chevron-down'} aria-expanded={showTable} aria-controls={tableId} onClick={() => setShowTable((v) => !v)} data-testid="dialin-table-toggle">
          {t(showTable ? S.hideTable : S.showTable)}
        </Button>
      </div>
      <div id={tableId} className="jr-table-wrap" hidden={!showTable}>
        {showTable && (
          <table className="jr-table" data-testid="dialin-table">
            <caption className="jr-dialin__caption">{t(S.caption(drinkName))}</caption>
            <thead>
              <tr>
                <th scope="col">{t(S.colN)}</th>
                <th scope="col">{t(S.colWhen)}</th>
                <th scope="col">{t(S.colTime)}</th>
                <th scope="col">{t(S.colRatio)}</th>
                <th scope="col">{t(S.colInOut)}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.id} data-latest={p.latest || undefined}>
                  <th scope="row">
                    <Link className="jr-dialin__rowlink" to={`/journal?entry=${encodeURIComponent(p.id)}`}>
                      {t(S.attempt(p.n))}
                    </Link>
                    {p.latest && (
                      <>
                        {' '}
                        <Tag tone="accent">{t(S.latest)}</Tag>
                      </>
                    )}
                  </th>
                  <td className="jr-dialin__nowrap">
                    <time dateTime={p.createdAt}>{shortWhen(p.createdAt, locale as Locale)}</time>
                  </td>
                  <td className="cl-num">
                    {fmtTime(p.timeSec, mmss)}
                    {p.timedInApp && (
                      <>
                        {' '}
                        <Tag tone="info" icon="clock">
                          {t(S.timed)}
                        </Tag>
                      </>
                    )}
                  </td>
                  <td className="cl-num jr-dialin__nowrap">{formatRatio(p.ratio)}</td>
                  <td className="cl-num">
                    {p.doseG != null ? `${p.doseG} g` : '—'} → {p.outG != null ? `${p.outG} g` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
