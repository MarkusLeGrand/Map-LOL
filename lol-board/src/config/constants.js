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
export const DEFAULT_TOWER_RADIUS = 750;

export const unitsToPx = (units, boardSize) => (boardSize * units) / OFFICIAL_UNITS.mapWidth;
