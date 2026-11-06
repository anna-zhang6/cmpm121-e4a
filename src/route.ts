/**
 * The route: the sectors the player flies through and every wave each one
 * spawns. Ticks are 1/60 s and count from the moment a sector's banner
 * appears. The Warden waits after the last sector. To add a sector, add an
 * entry to SECTORS; the banners, route list and timing all follow.
 */

export type EnemyKind = "drone" | "dart" | "turret" | "lancer";

export interface EnemyStats {
  hp: number;
  score: number;
  radius: number;
  dropChance: number;
  canShoot: boolean;
}

export const ENEMY_STATS: Record<EnemyKind, EnemyStats> = {
  drone: { hp: 2, score: 100, radius: 13, dropChance: 0.015, canShoot: true },
  dart: { hp: 1, score: 150, radius: 12, dropChance: 0.015, canShoot: false },
  turret: { hp: 12, score: 400, radius: 19, dropChance: 0.3, canShoot: true },
  lancer: { hp: 4, score: 250, radius: 15, dropChance: 0.06, canShoot: true },
};

/**
 * How a wave is laid out:
 * - line: everyone at once, side by side around x
 * - vee: a line whose middle enemies arrive first and ends last
 * - column: one after another straight down x
 * - pincer: pairs sweeping in from both edges, each pair lower and later
 */
export type Formation = "line" | "vee" | "column" | "pincer";

export interface Wave {
  kind: EnemyKind;
  count: number;
  formation: Formation;
  /** Tick, from the start of the sector, of the first enemy. */
  at: number;
  /** Centre of the formation; defaults to the middle of the screen. */
  x?: number;
}

export interface Sector {
  name: string;
  subtitle: string;
  /** Ticks before the next sector may begin. */
  length: number;
  waves: Wave[];
}

/** Extra ticks a sector may run past its length while enemies remain. */
export const SECTOR_GRACE_TICKS = 240;

export const SECTORS: Sector[] = [
  {
    name: "Outer Drift",
    subtitle: "Scouts ahead",
    length: 1560,
    waves: [
      { kind: "drone", count: 4, formation: "line", at: 60 },
      { kind: "drone", count: 5, formation: "vee", at: 360, x: 168 },
      { kind: "drone", count: 5, formation: "vee", at: 660, x: 312 },
      { kind: "drone", count: 6, formation: "line", at: 960 },
      { kind: "drone", count: 4, formation: "column", at: 1200, x: 120 },
      { kind: "drone", count: 4, formation: "column", at: 1260, x: 360 },
    ],
  },
  {
    name: "Shatter Belt",
    subtitle: "Divers incoming",
    length: 1800,
    waves: [
      { kind: "drone", count: 6, formation: "vee", at: 60 },
      { kind: "dart", count: 4, formation: "line", at: 300 },
      { kind: "dart", count: 5, formation: "column", at: 600, x: 144 },
      { kind: "dart", count: 5, formation: "column", at: 720, x: 336 },
      { kind: "drone", count: 7, formation: "line", at: 1020 },
      { kind: "dart", count: 5, formation: "vee", at: 1140 },
      { kind: "dart", count: 6, formation: "line", at: 1440 },
    ],
  },
  {
    name: "Gun Lanes",
    subtitle: "Turrets online",
    length: 1920,
    waves: [
      { kind: "turret", count: 1, formation: "line", at: 60 },
      { kind: "drone", count: 6, formation: "vee", at: 240 },
      { kind: "turret", count: 2, formation: "line", at: 540 },
      { kind: "dart", count: 6, formation: "column", at: 840 },
      { kind: "turret", count: 2, formation: "line", at: 1080 },
      { kind: "drone", count: 6, formation: "line", at: 1140 },
      { kind: "turret", count: 3, formation: "line", at: 1500 },
    ],
  },
  {
    name: "Lancer Gate",
    subtitle: "Crossfire",
    length: 1920,
    waves: [
      { kind: "lancer", count: 4, formation: "pincer", at: 60 },
      { kind: "dart", count: 6, formation: "vee", at: 360 },
      { kind: "lancer", count: 6, formation: "pincer", at: 600 },
      { kind: "turret", count: 2, formation: "line", at: 780 },
      { kind: "lancer", count: 6, formation: "pincer", at: 1140 },
      { kind: "drone", count: 8, formation: "vee", at: 1260 },
      { kind: "dart", count: 8, formation: "line", at: 1560 },
    ],
  },
  {
    name: "Last Approach",
    subtitle: "Everything they have",
    length: 2040,
    waves: [
      { kind: "turret", count: 3, formation: "line", at: 60 },
      { kind: "lancer", count: 6, formation: "pincer", at: 180 },
      { kind: "dart", count: 6, formation: "column", at: 540, x: 120 },
      { kind: "dart", count: 6, formation: "column", at: 540, x: 360 },
      { kind: "drone", count: 9, formation: "vee", at: 900 },
      { kind: "turret", count: 2, formation: "line", at: 1020 },
      { kind: "lancer", count: 8, formation: "pincer", at: 1320 },
      { kind: "dart", count: 8, formation: "vee", at: 1560 },
    ],
  },
];

/** The stop after the last sector. */
export const BOSS_STOP = "The Warden";

/** Every stop on the HUD's route list, in order. */
export const ROUTE_NAMES: readonly string[] = [
  ...SECTORS.map((sector) => sector.name),
  BOSS_STOP,
];

export interface Spawn {
  kind: EnemyKind;
  x: number;
  y: number;
  /** Which way the enemy first sways or flies (1 or -1). */
  side: number;
}

const CENTER = 240;
const TOP = -30;
const LEFT_EDGE = -30;
const RIGHT_EDGE = 510;

interface Slot {
  delay: number;
  x: number;
  y: number;
}

const SLOTS: Record<Formation, (wave: Wave, i: number) => Slot> = {
  line: (wave, i) => ({
    delay: 0,
    x: (wave.x ?? CENTER) + (i - middle(wave)) * 64,
    y: TOP,
  }),
  vee: (wave, i) => ({
    delay: Math.abs(i - middle(wave)) * 10,
    x: (wave.x ?? CENTER) + (i - middle(wave)) * 44,
    y: TOP,
  }),
  column: (wave, i) => ({
    delay: i * 24,
    x: wave.x ?? CENTER,
    y: TOP,
  }),
  pincer: (_wave, i) => ({
    delay: Math.floor(i / 2) * 30,
    x: i % 2 === 0 ? LEFT_EDGE : RIGHT_EDGE,
    y: 70 + Math.floor(i / 2) * 50,
  }),
};

function middle(wave: Wave): number {
  return (wave.count - 1) / 2;
}

/**
 * The enemies a sector spawns on tick t, in the order they must be created
 * (wave by wave, then left to right). Creation order matters: enemies draw
 * from the shared random generator in the order they appear.
 */
export function spawnsAt(sector: Sector, t: number): Spawn[] {
  const spawns: Spawn[] = [];
  for (const wave of sector.waves) {
    for (let i = 0; i < wave.count; i++) {
      const slot = SLOTS[wave.formation](wave, i);
      if (t === wave.at + slot.delay) {
        spawns.push({
          kind: wave.kind,
          x: slot.x,
          y: slot.y,
          side: i % 2 === 0 ? 1 : -1,
        });
      }
    }
  }
  return spawns;
}
