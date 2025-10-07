export const defaultTowersNormalized = [
  { id: "B_t1_bot", team: "blue", x: 0.18, y: 0.88, enabled: true },
  { id: "B_t2_bot", team: "blue", x: 0.26, y: 0.80, enabled: true },
  { id: "B_t3_bot", team: "blue", x: 0.33, y: 0.73, enabled: true },
  { id: "B_nexus_1", team: "blue", x: 0.08, y: 0.93, enabled: true },
  { id: "B_nexus_2", team: "blue", x: 0.12, y: 0.90, enabled: true },

  { id: "B_t1_mid", team: "blue", x: 0.20, y: 0.74, enabled: true },
  { id: "B_t2_mid", team: "blue", x: 0.28, y: 0.66, enabled: true },
  { id: "B_t3_mid", team: "blue", x: 0.36, y: 0.58, enabled: true },

  { id: "B_t1_top", team: "blue", x: 0.12, y: 0.68, enabled: true },
  { id: "B_t2_top", team: "blue", x: 0.19, y: 0.60, enabled: true },
  { id: "B_t3_top", team: "blue", x: 0.27, y: 0.52, enabled: true },

  { id: "R_t1_bot", team: "red", x: 0.72, y: 0.27, enabled: true },
  { id: "R_t2_bot", team: "red", x: 0.79, y: 0.19, enabled: true },
  { id: "R_t3_bot", team: "red", x: 0.87, y: 0.12, enabled: true },
  { id: "R_nexus_1", team: "red", x: 0.92, y: 0.08, enabled: true },
  { id: "R_nexus_2", team: "red", x: 0.90, y: 0.12, enabled: true },

  { id: "R_t1_mid", team: "red", x: 0.66, y: 0.20, enabled: true },
  { id: "R_t2_mid", team: "red", x: 0.74, y: 0.28, enabled: true },
  { id: "R_t3_mid", team: "red", x: 0.82, y: 0.36, enabled: true },

  { id: "R_t1_top", team: "red", x: 0.60, y: 0.12, enabled: true },
  { id: "R_t2_top", team: "red", x: 0.68, y: 0.19, enabled: true },
  { id: "R_t3_top", team: "red", x: 0.76, y: 0.27, enabled: true },
];

export const defaultTokens = (size) => {
  const pad = 0.07 * size;
  const blue = [
    { x: pad, y: size - pad },
    { x: pad + 60, y: size - pad - 60 },
    { x: pad + 120, y: size - pad - 10 },
    { x: pad + 30, y: size - pad - 120 },
    { x: pad + 90, y: size - pad - 180 },
  ];
  const red = [
    { x: size - pad, y: pad },
    { x: size - pad - 60, y: pad + 60 },
    { x: size - pad - 120, y: pad + 10 },
    { x: size - pad - 30, y: pad + 120 },
    { x: size - pad - 90, y: pad + 180 },
  ];
  return [
    ...blue.map((p, i) => ({ id: `B${i + 1}`, team: "blue", ...p })),
    ...red.map((p, i) => ({ id: `R${i + 1}`, team: "red", ...p })),
  ];
};
