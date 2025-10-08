export const MAX_BOARD = 1100;
export const LSK_TOWERS = "lolboard_towers_v1";
export const LSK_TOKENS = "lolboard_tokens_v1";
export const GRID = 384; // 256 (rapide), 384 (reco), 512 (qualité)

export const OFFICIAL_UNITS = {
  mapWidth: 14820,
  champSight: 1200,
  wardSight: 900,
  controlTrue: 660,
};

export const wardRadiusDefault = { stealth: 260, control: 300, trap: 220 };

export const OFFICIAL_TOWER_UNITS = {
  outer: 1250,
  inner: 1350,
  inhibitor: 1400,
  nexus: 1375,
};

export const TOWER_TYPE_LABELS = {
  outer: "Tour extérieure (T1)",
  inner: "Tour intermédiaire (T2)",
  inhibitor: "Tour intérieure (T3)",
  nexus: "Tour du Nexus (T4)",
};

export const unitsToPx = (units, boardSize) => (boardSize * units) / OFFICIAL_UNITS.mapWidth;
