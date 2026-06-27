import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  X, Settings, Eye, EyeOff, GripVertical, RotateCcw,
  LayoutGrid, Columns, MousePointer, Save
} from 'lucide-react';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import type { UISettings, CardConfig, ColumnConfig, ButtonConfig, SectionConfig } from '@/types/uiSettings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type PageKey = keyof UISettings;

interface UICustomizerProps {
  page: PageKey;
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
}

type TabType = 'cards' | 'columns' | 'buttons' | 'sections';

export default function UICustomizer({ page, isOpen, onClose, pageTitle }: UICustomizerProps) {
  const {
    settings,
    updateCardVisibility,
    updateCardOrder,
    updateCardSize,
    updateColumnVisibility,
    updateColumnOrder,
    updateButtonVisibility,
    updateButtonOrder,
    updateSectionVisibility,
    updateSectionOrder,
    resetPageSettings,
  } = useUISettingsStore();

  const pageSettings = settings[page];
  const [activeTab, setActiveTab] = useState<TabType>('cards');
  const [localCards, setLocalCards] = useState<CardConfig[]>([]);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([]);
  const [localButtons, setLocalButtons] = useState<ButtonConfig[]>([]);
  const [localSections, setLocalSections] = useState<SectionConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state when modal opens or page settings change
  useEffect(() => {
    if (isOpen) {
      setLocalCards([...pageSettings.cards].sort((a, b) => a.order - b.order));
      setLocalColumns([...pageSettings.columns].sort((a, b) => a.order - b.order));
      setLocalButtons([...pageSettings.buttons].sort((a, b) => a.order - b.order));
      setLocalSections([...pageSettings.sections].sort((a, b) => a.order - b.order));
      setHasChanges(false);
    }
  }, [isOpen, page]);

  // Determine which tabs to show based on available settings
  const availableTabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [];
  if (pageSettings.cards.length > 0) {
    availableTabs.push({ id: 'cards', label: 'Cards', icon: <LayoutGrid className="w-4 h-4" />, count: pageSettings.cards.length });
  }
  if (pageSettings.columns.length > 0) {
    availableTabs.push({ id: 'columns', label: 'Columns', icon: <Columns className="w-4 h-4" />, count: pageSettings.columns.length });
  }
  if (pageSettings.buttons.length > 0) {
    availableTabs.push({ id: 'buttons', label: 'Buttons', icon: <MousePointer className="w-4 h-4" />, count: pageSettings.buttons.length });
  }
  if (pageSettings.sections.length > 0) {
    availableTabs.push({ id: 'sections', label: 'Sections', icon: <LayoutGrid className="w-4 h-4" />, count: pageSettings.sections.length });
  }

  // Set default active tab to first available
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(t => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  const handleCardVisibilityToggle = (cardId: string) => {
    setLocalCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, visible: !card.visible } : card
    ));
    setHasChanges(true);
  };

  const handleCardSizeChange = (cardId: string, size: CardConfig['size']) => {
    setLocalCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, size } : card
    ));
    setHasChanges(true);
  };

  const handleColumnVisibilityToggle = (columnId: string) => {
    setLocalColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
    setHasChanges(true);
  };

  const handleButtonVisibilityToggle = (buttonId: string) => {
    setLocalButtons(prev => prev.map(btn => 
      btn.id === buttonId ? { ...btn, visible: !btn.visible } : btn
    ));
    setHasChanges(true);
  };

  const handleSectionVisibilityToggle = (sectionId: string) => {
    setLocalSections(prev => prev.map(sec => 
      sec.id === sectionId ? { ...sec, visible: !sec.visible } : sec
    ));
    setHasChanges(true);
  };

  const handleCardsReorder = (newOrder: CardConfig[]) => {
    // Update order property based on new position
    const updatedCards = newOrder.map((card, index) => ({
      ...card,
      order: index
    }));
    setLocalCards(updatedCards);
    setHasChanges(true);
  };

  const handleColumnsReorder = (newOrder: ColumnConfig[]) => {
    const updatedColumns = newOrder.map((col, index) => ({
      ...col,
      order: index
    }));
    setLocalColumns(updatedColumns);
    setHasChanges(true);
  };

  const handleButtonsReorder = (newOrder: ButtonConfig[]) => {
    const updatedButtons = newOrder.map((btn, index) => ({
      ...btn,
      order: index
    }));
    setLocalButtons(updatedButtons);
    setHasChanges(true);
  };

  const handleSectionsReorder = (newOrder: SectionConfig[]) => {
    const updatedSections = newOrder.map((sec, index) => ({
      ...sec,
      order: index
    }));
    setLocalSections(updatedSections);
    setHasChanges(true);
  };

  const handleSave = () => {
    // Save cards - update visibility, size, and order
    localCards.forEach((card) => {
      const originalCard = pageSettings.cards.find(c => c.id === card.id);
      if (originalCard) {
        if (originalCard.visible !== card.visible) {
          updateCardVisibility(page, card.id, card.visible);
        }
        if (originalCard.size !== card.size) {
          updateCardSize(page, card.id, card.size);
        }
      }
    });
    // Update card order
    updateCardOrder(page, localCards);

    // Save columns
    localColumns.forEach((col) => {
      const originalCol = pageSettings.columns.find(c => c.id === col.id);
      if (originalCol && originalCol.visible !== col.visible) {
        updateColumnVisibility(page, col.id, col.visible);
      }
    });
    updateColumnOrder(page, localColumns);

    // Save buttons
    localButtons.forEach((btn) => {
      const originalBtn = pageSettings.buttons.find(b => b.id === btn.id);
      if (originalBtn && originalBtn.visible !== btn.visible) {
        updateButtonVisibility(page, btn.id, btn.visible);
      }
    });
    updateButtonOrder(page, localButtons);

    // Save sections
    localSections.forEach((sec) => {
      const originalSec = pageSettings.sections.find(s => s.id === sec.id);
      if (originalSec && originalSec.visible !== sec.visible) {
        updateSectionVisibility(page, sec.id, sec.visible);
      }
    });
    updateSectionOrder(page, localSections);

    setHasChanges(false);
    toast.success('Settings saved successfully!');
    onClose();
  };

  const handleReset = () => {
    resetPageSettings(page);
    // Refresh local state from store
    setTimeout(() => {
      const newSettings = useUISettingsStore.getState().settings[page];
      setLocalCards([...newSettings.cards].sort((a, b) => a.order - b.order));
      setLocalColumns([...newSettings.columns].sort((a, b) => a.order - b.order));
      setLocalButtons([...newSettings.buttons].sort((a, b) => a.order - b.order));
      setLocalSections([...newSettings.sections].sort((a, b) => a.order - b.order));
      setHasChanges(false);
    }, 0);
    toast.success('Settings reset to default!');
  };

  const handleShowAll = () => {
    if (activeTab === 'cards') {
      setLocalCards(prev => prev.map(card => ({ ...card, visible: true })));
    } else if (activeTab === 'columns') {
      setLocalColumns(prev => prev.map(col => ({ ...col, visible: true })));
    } else if (activeTab === 'buttons') {
      setLocalButtons(prev => prev.map(btn => ({ ...btn, visible: true })));
    } else if (activeTab === 'sections') {
      setLocalSections(prev => prev.map(sec => ({ ...sec, visible: true })));
    }
    setHasChanges(true);
  };

  const handleHideAll = () => {
    if (activeTab === 'cards') {
      setLocalCards(prev => prev.map(card => ({ ...card, visible: false })));
    } else if (activeTab === 'columns') {
      setLocalColumns(prev => prev.map(col => ({ ...col, visible: false })));
    } else if (activeTab === 'buttons') {
      setLocalButtons(prev => prev.map(btn => ({ ...btn, visible: false })));
    } else if (activeTab === 'sections') {
      setLocalSections(prev => prev.map(sec => ({ ...sec, visible: false })));
    }
    setHasChanges(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-500 to-purple-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-[Outfit]">Customize {pageTitle}</h2>
                  <p className="text-sm text-white/80">Drag to reorder, toggle to show/hide</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          {availableTabs.length > 1 && (
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex gap-2">
                {availableTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      activeTab === tab.id
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-xs',
                      activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100'
                    )}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleShowAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Show All
              </button>
              <button
                onClick={handleHideAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <EyeOff className="w-3.5 h-3.5" />
                Hide All
              </button>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Default
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-280px)]">
            {/* Cards Tab */}
            {activeTab === 'cards' && localCards.length > 0 && (
              <Reorder.Group
                axis="y"
                values={localCards}
                onReorder={handleCardsReorder}
                className="space-y-2"
              >
                {localCards.map((card) => (
                  <Reorder.Item
                    key={card.id}
                    value={card}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none',
                      card.visible
                        ? 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    )}
                    whileDrag={{ scale: 1.02, boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
                  >
                    <GripVertical className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium text-sm',
                        card.visible ? 'text-slate-900' : 'text-slate-500'
                      )}>
                        {card.title}
                      </p>
                      <p className="text-xs text-slate-400">Size: {card.size}</p>
                    </div>
                    <select
                      value={card.size}
                      onChange={(e) => handleCardSizeChange(card.id, e.target.value as CardConfig['size'])}
                      className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="full">Full Width</option>
                    </select>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardVisibilityToggle(card.id);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        card.visible
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      )}
                    >
                      {card.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}

            {/* Columns Tab */}
            {activeTab === 'columns' && localColumns.length > 0 && (
              <Reorder.Group
                axis="y"
                values={localColumns}
                onReorder={handleColumnsReorder}
                className="space-y-2"
              >
                {localColumns.map((column) => (
                  <Reorder.Item
                    key={column.id}
                    value={column}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none',
                      column.visible
                        ? 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    )}
                    whileDrag={{ scale: 1.02, boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
                  >
                    <GripVertical className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium text-sm',
                        column.visible ? 'text-slate-900' : 'text-slate-500'
                      )}>
                        {column.label}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleColumnVisibilityToggle(column.id);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        column.visible
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      )}
                    >
                      {column.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}

            {/* Buttons Tab */}
            {activeTab === 'buttons' && localButtons.length > 0 && (
              <Reorder.Group
                axis="y"
                values={localButtons}
                onReorder={handleButtonsReorder}
                className="space-y-2"
              >
                {localButtons.map((button) => (
                  <Reorder.Item
                    key={button.id}
                    value={button}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none',
                      button.visible
                        ? 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    )}
                    whileDrag={{ scale: 1.02, boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
                  >
                    <GripVertical className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium text-sm',
                        button.visible ? 'text-slate-900' : 'text-slate-500'
                      )}>
                        {button.label}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleButtonVisibilityToggle(button.id);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        button.visible
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      )}
                    >
                      {button.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}

            {/* Sections Tab */}
            {activeTab === 'sections' && localSections.length > 0 && (
              <Reorder.Group
                axis="y"
                values={localSections}
                onReorder={handleSectionsReorder}
                className="space-y-2"
              >
                {localSections.map((section) => (
                  <Reorder.Item
                    key={section.id}
                    value={section}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none',
                      section.visible
                        ? 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    )}
                    whileDrag={{ scale: 1.02, boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
                  >
                    <GripVertical className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium text-sm',
                        section.visible ? 'text-slate-900' : 'text-slate-500'
                      )}>
                        {section.title}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSectionVisibilityToggle(section.id);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        section.visible
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      )}
                    >
                      {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}

            {/* Empty State */}
            {availableTabs.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No customizable elements on this page</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {hasChanges ? (
                <span className="text-amber-600 font-medium">• Unsaved changes</span>
              ) : (
                'All changes saved'
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors',
                  hasChanges
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Floating customize button component
export function CustomizeButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
    >
      <Settings className="w-5 h-5" />
      <span className="font-medium text-sm">Customize</span>
    </motion.button>
  );
}