const ROLE_ORDER = ["TOP", "JGL", "MID", "ADC", "SUPP"];

const legacyRoleFromIndex = (index) => ROLE_ORDER[index] ?? `P${index + 1}`;

const ensureUpper = (value) => (typeof value === "string" ? value.toUpperCase() : undefined);

export const normalizeTokens = (tokens) => {
  if (!Array.isArray(tokens)) return [];
  const usedIds = new Set();

  return tokens
    .map((token) => {
      if (!token || typeof token !== "object") return null;

      const normalized = { ...token };
      let { id } = normalized;
      let team = normalized.team;
      let role = ensureUpper(normalized.role);

      const legacyMatch =
        typeof id === "string" ? id.trim().match(/^([BR])(\d)$/i) : null;

      if (legacyMatch) {
        const [, letter, idxStr] = legacyMatch;
        const legacyTeam = letter.toUpperCase() === "B" ? "blue" : "red";
        const legacyIdx = Number.parseInt(idxStr, 10) - 1;
        team = legacyTeam;
        role = legacyRoleFromIndex(Number.isNaN(legacyIdx) ? 0 : legacyIdx);
        id = `${team}-${role.toLowerCase()}`;
      } else if (team && role) {
        id = `${team}-${role.toLowerCase()}`;
      } else if (typeof id === "string") {
        const parts = id.split("-");
        if (parts.length >= 2) {
          const [maybeTeam, ...rest] = parts;
          const guessTeam = maybeTeam === "blue" || maybeTeam === "red" ? maybeTeam : team;
          const guessRole = rest.join("-");
          team = team ?? guessTeam;
          role = role ?? ensureUpper(guessRole);
          if (team && role) id = `${team}-${role.toLowerCase()}`;
        }
      }

      if (!role) {
        role = ensureUpper(normalized.id) ?? "TOKEN";
      }
      if (!team) {
        team = normalized.team ?? "neutral";
      }

      const baseId = id ?? `${team}-${role.toLowerCase()}`;
      let finalId = baseId;
      let suffix = 2;
      while (usedIds.has(finalId)) {
        finalId = `${baseId}-${suffix}`;
        suffix += 1;
      }
      usedIds.add(finalId);

      return { ...normalized, id: finalId, team, role };
    })
    .filter(Boolean);
};
