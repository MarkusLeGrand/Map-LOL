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
    description: 'Interactive vision control and strategy planning',
    status: 'Available',
    color: COLORS.primary,
    onClick: 'tacticalmap',
    category: 'tactics',
    displayOnHomePage: true,
  },
  {
    name: 'Looser Tracker',
    description: 'Daily battles to crown the ultimate King of Losers.',
    status: 'Avalable',
    color: COLORS.danger,
    category: 'data',
    displayOnHomePage: true,
  },
  {
    name: 'Data Analytics',
    description: 'Performance metrics and trend analysis',
    status: 'Available',
    color: COLORS.blue,
    onClick: 'data-analytics',
    category: 'data',
    displayOnHomePage: true,
  },
  {
    name: 'Drafter',
    description: "A drafting tool that helps teams build optimal compositions and plan counter-picks in real time.",
    status: 'Coming Soon',
    color: COLORS.purple,
    category: 'tactics',
    displayOnHomePage: true,
  },
  {
    name: 'Team Manager',
    description: 'Roster management and scheduling tools',
    status: 'Available',
    color: COLORS.gold,
    onClick: 'teams',
    category: 'organization',
    displayOnHomePage: false,
  },
  {
    name: 'Scrim Organizer',
    description: 'Schedule and manage practice matches',
    status: 'Coming Soon',
    color: COLORS.primary,
    category: 'organization',
    displayOnHomePage: false,
  },
  {
    name: 'VOD Review',
    description: 'Collaborative replay analysis and annotations',
    status: 'Coming Soon',
    color: COLORS.purple,
    category: 'tactics',
    displayOnHomePage: false,
  },
  {
    name: 'Meta Insights',
    description: 'Patch notes breakdown and tier lists',
    status: 'Coming Soon',
    color: COLORS.blue,
    category: 'data',
    displayOnHomePage: false,
  },
  {
    name: 'Champion Pool Builder',
    description: 'Build and optimize your champion pool',
    status: 'Coming Soon',
    color: COLORS.purple,
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
