import { COLORS } from '../constants/theme';

export interface Tool {
  name: string;
  description: string;
  status: 'Available' | 'Avalable' | 'Coming Soon';
  color: string;
  onClick?: string;
  category: 'tactics' | 'data' | 'organization';
  displayOnHomePage: boolean;
}

export const ALL_TOOLS: Tool[] = [
  {
    name: 'Tactical Map',
    description: 'Plan strategies with interactive vision control, ward placement, and fog of war simulation',
    status: 'Available',
    color: COLORS.primary,
    onClick: 'tacticalmap',
    category: 'tactics',
    displayOnHomePage: true,
  },
  {
    name: 'Loser Tracker',
    description: 'Track daily performance battles and compete for the crown of ultimate winner (or loser)',
    status: 'Available',
    color: COLORS.danger,
    category: 'data',
    displayOnHomePage: true,
  },
  {
    name: 'Scrim Data Analytics',
    description: 'Analyze scrim performance with detailed stats, charts, and player metrics from Riot API data',
    status: 'Available',
    color: COLORS.blue,
    onClick: 'data-analytics',
    category: 'data',
    displayOnHomePage: true,
  },
  {
    name: 'Draft Planner',
    description: 'Build optimal team compositions and plan counter-picks with real-time draft simulation',
    status: 'Coming Soon',
    color: COLORS.purple,
    category: 'tactics',
    displayOnHomePage: true,
  },
  {
    name: 'Find a Team',
    description: 'Browse and join competitive teams, discover new teammates, and build your roster',
    status: 'Available',
    color: COLORS.gold,
    onClick: 'teams',
    category: 'organization',
    displayOnHomePage: false,
  },
  {
    name: 'Scrim Scheduler',
    description: 'Schedule practice matches, track opponents, and organize team scrimmages efficiently',
    status: 'Available',
    color: COLORS.primary,
    onClick: 'scrim-scheduler',
    category: 'organization',
    displayOnHomePage: false,
  },
  {
    name: 'VOD Review',
    description: 'Annotate replays, share timestamps, and collaborate on game analysis with your team',
    status: 'Coming Soon',
    color: COLORS.purple,
    category: 'tactics',
    displayOnHomePage: false,
  },
  {
    name: 'Meta Insights',
    description: 'Stay updated with patch breakdowns, win rates, pick/ban trends, and champion tier lists',
    status: 'Coming Soon',
    color: COLORS.blue,
    category: 'data',
    displayOnHomePage: false,
  },
  {
    name: 'Champion Pool',
    description: 'Build and optimize your champion pool based on role, meta, and personal performance',
    status: 'Available',
    color: COLORS.primary,
    onClick: 'champion-pool',
    category: 'tactics',
    displayOnHomePage: false,
  },
];

// Helper function to get tools for homepage
export const getHomePageTools = (): Tool[] => {
  return ALL_TOOLS.filter(tool => tool.displayOnHomePage);
};

// Helper function to get all tools
export const getAllTools = (): Tool[] => {
  return ALL_TOOLS;
};

// Helper function to get tools by category
export const getToolsByCategory = (category: string): Tool[] => {
  if (category === 'all') return ALL_TOOLS;
  return ALL_TOOLS.filter(tool => tool.category === category);
};
