export const MAX_BOARD = 1100;
export const LSK_TOWERS = "lolboard_towers_v1";
export const GRID = 384; // 256 (rapide), 384 (reco), 512 (qualité)

export const OFFICIAL_UNITS = {
  mapWidth: 14820,
  champSight: 1200,
  wardSight: 900,
  controlTrue: 660,
};

export const wardRadiusDefault = { stealth: 260, control: 300, trap: 220 };

export const OFFICIAL_TOWER_UNITS = {
  outer: 775,
  inner: 800,
  inhibitor: 850,
  nexus: 875,
};

export const TOWER_TYPE_LABELS = {
  outer: "Tour extérieure (T1)",
  inner: "Tour intermédiaire (T2)",
  inhibitor: "Tour inhibiteur (T3)",
  nexus: "Tour du Nexus",
};

export const unitsToPx = (units, boardSize) => (boardSize * units) / OFFICIAL_UNITS.mapWidth;
