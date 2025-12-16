import { COLORS } from '../../constants/theme';

interface Tab {
    id: string;
    label: string;
    color?: string;
    content: React.ReactNode;
}

interface TabPanelProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
    className?: string;
}

export function TabPanel({ tabs, activeTab, onChange, className = '' }: TabPanelProps) {
    const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

    return (
        <div className={`flex flex-col ${className}`}>
            {/* Tab Headers */}
            <div className="border-b border-[#F5F5F5]/10 flex">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const tabColor = tab.color || COLORS.blue;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                                isActive
                                    ? `text-[#F5F5F5] border-b-2`
                                    : 'text-[#F5F5F5]/50 hover:text-[#F5F5F5]'
                            }`}
                            style={
                                isActive
                                    ? {
                                          backgroundColor: tabColor,
                                          borderBottomColor: tabColor,
                                      }
                                    : undefined
                            }
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">{activeTabContent}</div>
        </div>
    );
}
