/**
 * Riot API Service
 * Handles Riot account verification and OAuth flow
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Cache for DDragon version
let cachedDDragonVersion: string | null = null;
let versionFetchPromise: Promise<string> | null = null;

/**
 * Get the latest Data Dragon version (cached)
 */
export const getLatestDDragonVersion = async (): Promise<string> => {
  // Return cached version if available
  if (cachedDDragonVersion) {
    return cachedDDragonVersion;
  }

  // If already fetching, wait for that promise
  if (versionFetchPromise) {
    return versionFetchPromise;
  }

  // Fetch latest version
  versionFetchPromise = fetch('https://ddragon.leagueoflegends.com/api/versions.json')
    .then(res => res.json())
    .then(versions => {
      cachedDDragonVersion = versions[0];
      return cachedDDragonVersion!;
    })
    .catch(() => {
      // Fallback to a recent version if fetch fails
      return '14.24.1';
    })
    .finally(() => {
      versionFetchPromise = null;
    });

  return versionFetchPromise;
};

/**
 * Get DDragon version synchronously (returns cached or fallback)
 */
export const getDDragonVersionSync = (): string => {
  return cachedDDragonVersion || '14.24.1';
};

/**
 * Preload DDragon version (call this on app init)
 */
export const preloadDDragonVersion = (): void => {
  getLatestDDragonVersion();
};

export interface SummonerData {
  profile_icon_id: string;
  summoner_level: string;
  solo_tier: string | null;
  solo_rank: string | null;
  solo_lp: string | null;
  solo_wins: string | null;
  solo_losses: string | null;
  flex_tier: string | null;
  flex_rank: string | null;
  top_champions: ChampionMastery[];
  preferred_lane: string | null;
  last_synced: string;
}

export interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
}

export interface RiotAccount {
  game_name: string;
  tag_line: string;
  verified: boolean;
}

export interface GetSummonerResponse {
  summoner: SummonerData | null;
  riot_account: RiotAccount;
}

/**
 * Get Riot OAuth authorization URL
 */
export const getRiotAuthUrl = async (token: string): Promise<{ authorization_url: string; state: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/riot/auth/authorize`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get authorization URL');
  }

  return response.json();
};

/**
 * Verify Riot account manually (without OAuth)
 */
export const verifyRiotAccount = async (
  token: string,
  gameName: string,
  tagLine: string,
  platform: string = 'EUW1',
  region: string = 'europe'
): Promise<{ success: boolean; message: string; summoner: any }> => {
  const response = await fetch(`${API_BASE_URL}/api/riot/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      game_name: gameName,
      tag_line: tagLine,
      platform,
      region,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to verify Riot account');
  }

  return response.json();
};

/**
 * Sync summoner data from Riot API
 */
export const syncRiotData = async (token: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/riot/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to sync Riot data');
  }

  return response.json();
};

/**
 * Get current user's summoner data
 */
export const getSummonerData = async (token: string): Promise<GetSummonerResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/riot/summoner`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get summoner data');
  }

  return response.json();
};

/**
 * Update preferred lane/role
 */
export const updatePreferredLane = async (
  token: string,
  lane: string
): Promise<{ success: boolean; message: string; preferred_lane: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/riot/summoner/update-lane`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ lane }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update lane');
  }

  return response.json();
};

/**
 * Get Data Dragon URLs for assets (uses cached version)
 */
export const getDataDragonUrls = (version?: string) => {
  const v = version || getDDragonVersionSync();
  const baseUrl = `https://ddragon.leagueoflegends.com/cdn/${v}`;

  return {
    championImage: (championId: number) => `${baseUrl}/img/champion/${getChampionKey(championId)}.png`,
    profileIcon: (iconId: string) => `${baseUrl}/img/profileicon/${iconId}.png`,
    rankEmblem: (tier: string) => `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${tier.toLowerCase()}.png`,
  };
};

/**
 * Get champion image URL by champion key (name)
 */
export const getChampionImageUrl = (championKey: string, version?: string): string => {
  const v = version || getDDragonVersionSync();
  return `https://ddragon.leagueoflegends.com/cdn/${v}/img/champion/${championKey}.png`;
};

/**
 * Get profile icon URL
 */
export const getProfileIconUrl = (iconId: string | number, version?: string): string => {
  const v = version || getDDragonVersionSync();
  return `https://ddragon.leagueoflegends.com/cdn/${v}/img/profileicon/${iconId}.png`;
};

/**
 * Map champion ID to champion key (name)
 * Note: This is a simplified mapping. In production, you'd fetch this from Data Dragon
 */
const championIdToKey: Record<number, string> = {
  1: 'Annie',
  2: 'Olaf',
  3: 'Galio',
  4: 'TwistedFate',
  5: 'XinZhao',
  6: 'Urgot',
  7: 'LeBlanc',
  8: 'Vladimir',
  9: 'Fiddlesticks',
  10: 'Kayle',
  11: 'MasterYi',
  12: 'Alistar',
  13: 'Ryze',
  14: 'Sion',
  15: 'Sivir',
  16: 'Soraka',
  17: 'Teemo',
  18: 'Tristana',
  19: 'Warwick',
  20: 'Nunu',
  21: 'MissFortune',
  22: 'Ashe',
  23: 'Tryndamere',
  24: 'Jax',
  25: 'Morgana',
  26: 'Zilean',
  27: 'Singed',
  28: 'Evelynn',
  29: 'Twitch',
  30: 'Karthus',
  31: 'Chogath',
  32: 'Amumu',
  33: 'Rammus',
  34: 'Anivia',
  35: 'Shaco',
  36: 'DrMundo',
  37: 'Sona',
  38: 'Kassadin',
  39: 'Irelia',
  40: 'Janna',
  41: 'Gangplank',
  42: 'Corki',
  43: 'Karma',
  44: 'Taric',
  45: 'Veigar',
  48: 'Trundle',
  50: 'Swain',
  51: 'Caitlyn',
  53: 'Blitzcrank',
  54: 'Malphite',
  55: 'Katarina',
  56: 'Nocturne',
  57: 'Maokai',
  58: 'Renekton',
  59: 'JarvanIV',
  60: 'Elise',
  61: 'Orianna',
  62: 'MonkeyKing',
  63: 'Brand',
  64: 'LeeSin',
  67: 'Vayne',
  68: 'Rumble',
  69: 'Cassiopeia',
  72: 'Skarner',
  74: 'Heimerdinger',
  75: 'Nasus',
  76: 'Nidalee',
  77: 'Udyr',
  78: 'Poppy',
  79: 'Gragas',
  80: 'Pantheon',
  81: 'Ezreal',
  82: 'Mordekaiser',
  83: 'Yorick',
  84: 'Akali',
  85: 'Kennen',
  86: 'Garen',
  89: 'Leona',
  90: 'Malzahar',
  91: 'Talon',
  92: 'Riven',
  96: 'KogMaw',
  98: 'Shen',
  99: 'Lux',
  101: 'Xerath',
  102: 'Shyvana',
  103: 'Ahri',
  104: 'Graves',
  105: 'Fizz',
  106: 'Volibear',
  107: 'Rengar',
  110: 'Varus',
  111: 'Nautilus',
  112: 'Viktor',
  113: 'Sejuani',
  114: 'Fiora',
  115: 'Ziggs',
  117: 'Lulu',
  119: 'Draven',
  120: 'Hecarim',
  121: 'Khazix',
  122: 'Darius',
  126: 'Jayce',
  127: 'Lissandra',
  131: 'Diana',
  133: 'Quinn',
  134: 'Syndra',
  136: 'AurelionSol',
  141: 'Kayn',
  142: 'Zoe',
  143: 'Zyra',
  145: 'Kaisa',
  147: 'Seraphine',
  150: 'Gnar',
  154: 'Zac',
  157: 'Yasuo',
  161: 'Velkoz',
  163: 'Taliyah',
  164: 'Camille',
  166: 'Akshan',
  200: 'Belveth',
  201: 'Braum',
  202: 'Jhin',
  203: 'Kindred',
  221: 'Zeri',
  222: 'Jinx',
  223: 'TahmKench',
  234: 'Viego',
  235: 'Senna',
  236: 'Lucian',
  238: 'Zed',
  240: 'Kled',
  245: 'Ekko',
  246: 'Qiyana',
  254: 'Vi',
  266: 'Aatrox',
  267: 'Nami',
  268: 'Azir',
  350: 'Yuumi',
  360: 'Samira',
  412: 'Thresh',
  420: 'Illaoi',
  421: 'RekSai',
  427: 'Ivern',
  429: 'Kalista',
  432: 'Bard',
  497: 'Rakan',
  498: 'Xayah',
  516: 'Ornn',
  517: 'Sylas',
  518: 'Neeko',
  523: 'Aphelios',
  526: 'Rell',
  555: 'Pyke',
  711: 'Vex',
  777: 'Yone',
  875: 'Sett',
  876: 'Lillia',
  887: 'Gwen',
  888: 'Renata',
  895: 'Nilah',
  897: 'KSante',
  901: 'Smolder',
  902: 'Milio',
  910: 'Hwei',
  950: 'Naafiri',
};

function getChampionKey(championId: number): string {
  return championIdToKey[championId] || 'Unknown';
}
