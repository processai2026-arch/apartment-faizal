import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UISettings,
  PageSettings,
  CardConfig,
  ColumnConfig,
  ButtonConfig,
  SectionConfig,
} from '@/types/uiSettings';
import { getDefaultUISettings } from '@/types/uiSettings';

type PageKey = keyof UISettings;

interface UISettingsState {
  settings: UISettings;
  isCustomizing: boolean;
  currentPage: PageKey | null;
  
  // Actions
  setCustomizing: (isCustomizing: boolean, page?: PageKey) => void;
  
  // Card actions
  updateCardVisibility: (page: PageKey, cardId: string, visible: boolean) => void;
  updateCardOrder: (page: PageKey, cards: CardConfig[]) => void;
  updateCardSize: (page: PageKey, cardId: string, size: CardConfig['size']) => void;
  updateCardCollapsed: (page: PageKey, cardId: string, collapsed: boolean) => void;
  
  // Column actions
  updateColumnVisibility: (page: PageKey, columnId: string, visible: boolean) => void;
  updateColumnOrder: (page: PageKey, columns: ColumnConfig[]) => void;
  updateColumnWidth: (page: PageKey, columnId: string, width: number) => void;
  
  // Button actions
  updateButtonVisibility: (page: PageKey, buttonId: string, visible: boolean) => void;
  updateButtonOrder: (page: PageKey, buttons: ButtonConfig[]) => void;
  
  // Section actions
  updateSectionVisibility: (page: PageKey, sectionId: string, visible: boolean) => void;
  updateSectionOrder: (page: PageKey, sections: SectionConfig[]) => void;
  updateSectionCollapsed: (page: PageKey, sectionId: string, collapsed: boolean) => void;
  
  // Bulk actions
  updatePageSettings: (page: PageKey, settings: Partial<PageSettings>) => void;
  resetPageSettings: (page: PageKey) => void;
  resetAllSettings: () => void;
  
  // Getters
  getPageSettings: (page: PageKey) => PageSettings;
  getVisibleCards: (page: PageKey) => CardConfig[];
  getVisibleColumns: (page: PageKey) => ColumnConfig[];
  getVisibleButtons: (page: PageKey) => ButtonConfig[];
  getVisibleSections: (page: PageKey) => SectionConfig[];
}

const defaultSettings = getDefaultUISettings();

export const useUISettingsStore = create<UISettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isCustomizing: false,
      currentPage: null,
      
      setCustomizing: (isCustomizing, page) => set({ 
        isCustomizing, 
        currentPage: page || null 
      }),
      
      // Card actions
      updateCardVisibility: (page, cardId, visible) => set((state) => ({
        settings: {
          ...state.settings,
          [page]: {
            ...state.settings[page],
            cards: state.settings[page].cards.map((card) =>
              card.id === cardId ? { ...card, visible } : card
            ),
          },
        },
      })),
      
  updateCardOrder: (page, cards) => set((state) => {
    // Create a map of the new order
    const orderMap = new Map(cards.map((card, index) => [card.id, index]));
    
    // Update all cards with their new order
    const updatedCards = state.settings[page].cards.map(card => ({
      ...card,
      order: orderMap.has(card.id) ? orderMap.get(card.id)! : card.order,
      // Also update visibility and size from the passed cards
      visible: cards.find(c => c.id === card.id)?.visible ?? card.visible,
      size: cards.find(c => c.id === card.id)?.size ?? card.size,
    }));
    
    return {
      settings: {
        ...state.settings,
        [page]: {
          ...state.settings[page],
          cards: updatedCards,
        },
      },
    };
  }),
      
      updateCardSize: (page, cardId, size) => set((state) => ({
        settings: {
          ...state.settings,
          [page]: {
            ...state.settings[page],
            cards: state.settings[page].cards.map((card) =>
              card.id === cardId ? { ...card, size } : card
            ),
          },
        },
      })),
      
      updateCardCollapsed: (page, cardId, collapsed) => set((state) => ({
        settings: {
          ...state.settings,
          [page]: {
            ...state.settings[page],
            cards: state.settings[page].cards.map((card) =>
              card.id === cardId ? { ...card, collapsed } : card
            ),
          },
        },
      })),
      
      // Column actions
      updateColumnVisibility: (page, columnId, visible) => set((state) => ({
        settings: {
          ...state.settings,
          [page]: {
            ...state.settings[page],
            columns: state.settings[page].columns.map((col) =>
              col.id === columnId ? { ...col, visible } : col
            ),
          },
        },
      })),
      
  updateColumnOrder: (page, columns) => set((state) => {
    const orderMap = new Map(columns.map((col, index) => [col.id, index]));
    
    const updatedColumns = state.settings[page].columns.map(col => ({
      ...col,
      order: orderMap.has(col.id) ? orderMap.get(col.id)! : col.order,
      visible: columns.find(c => c.id === col.id)?.visible ?? col.visible,
    }));
    
    return {
      settings: {
        ...state.settings,
        [page]: {
          ...state.settings[page],
          columns: updatedColumns,
        },
      },
    };
  }),
      
      updateColumnWidth: (page, columnId, width) => set((state) => ({
        settings: {
          ...state.settings,
          [page]: {
            ...state.settings[page],
            columns: state.settings[page].columns.map((col) =>
              col.id === columnId ? { ...col, width } : col
            ),
          },
        },
      })),
      
      // Button actions
      updateButtonVisibility: (page, buttonId, visible) => set((state) => ({
        settings: {
          ...state.settings,
          [page]: {
            ...state.settings[page],
            buttons: state.settings[page].buttons.map((btn) =>
              btn.id === buttonId ? { ...btn, visible } : btn
            ),
          },
        },
      })),
      
  updateButtonOrder: (page, buttons) => set((state) => {
    const orderMap = new Map(buttons.map((btn, index) => [btn.id, index]));
    
    const updatedButtons = state.settings[page].buttons.map(btn => ({
      ...btn,
      order: orderMap.has(btn.id) ? orderMap.get(btn.id)! : btn.order,
      visible: buttons.find(b => b.id === btn.id)?.visible ?? btn.visible,
    }));
    
    return {
      settings: {
        ...state.settings,
        [page]: {
          ...state.settings[page],
          buttons: updatedButtons,
        },
      },
    };
  }),
      
      // Section actions
      updateSectionVisibility: (page, sectionId, visible) => set((state) => ({
        settings: {
          ...state.settings,
          [page]: {
            ...state.settings[page],
            sections: state.settings[page].sections.map((sec) =>
              sec.id === sectionId ? { ...sec, visible } : sec
            ),
          },
        },
      })),
      
  updateSectionOrder: (page, sections) => set((state) => {
    const orderMap = new Map(sections.map((sec, index) => [sec.id, index]));
    
    const updatedSections = state.settings[page].sections.map(sec => ({
      ...sec,
      order: orderMap.has(sec.id) ? orderMap.get(sec.id)! : sec.order,
      visible: sections.find(s => s.id === sec.id)?.visible ?? sec.visible,
    }));
    
    return {
      settings: {
        ...state.settings,
        [page]: {
          ...state.settings[page],
          sections: updatedSections,
        },
      },
    };
  }),
      
      updateSectionCollapsed: (page, sectionId, collapsed) => set((state) => ({
        settings: {
          ...state.settings,
          [page]: {
            ...state.settings[page],
            sections: state.settings[page].sections.map((sec) =>
              sec.id === sectionId ? { ...sec, collapsed } : sec
            ),
          },
        },
      })),
      
      // Bulk actions
      updatePageSettings: (page, newSettings) => set((state) => ({
        settings: {
          ...state.settings,
          [page]: {
            ...state.settings[page],
            ...newSettings,
          },
        },
      })),
      
      resetPageSettings: (page) => set((state) => ({
        settings: {
          ...state.settings,
          [page]: defaultSettings[page],
        },
      })),
      
      resetAllSettings: () => set({ settings: defaultSettings }),
      
      // Getters
      getPageSettings: (page) => get().settings[page],
      
      getVisibleCards: (page) => {
        const pageSettings = get().settings[page];
        return [...pageSettings.cards]
          .filter((card) => card.visible)
          .sort((a, b) => a.order - b.order);
      },
      
      getVisibleColumns: (page) => {
        const pageSettings = get().settings[page];
        return [...pageSettings.columns]
          .filter((col) => col.visible)
          .sort((a, b) => a.order - b.order);
      },
      
      getVisibleButtons: (page) => {
        const pageSettings = get().settings[page];
        return [...pageSettings.buttons]
          .filter((btn) => btn.visible)
          .sort((a, b) => a.order - b.order);
      },
      
      getVisibleSections: (page) => {
        const pageSettings = get().settings[page];
        return [...pageSettings.sections]
          .filter((sec) => sec.visible)
          .sort((a, b) => a.order - b.order);
      },
    }),
    {
      name: 'ui-settings-storage',
      version: 2,
      merge: (persistedState: unknown, currentState: UISettingsState) => {
        const persisted = persistedState as Partial<UISettingsState> | undefined;
        if (!persisted || !persisted.settings) {
          return currentState;
        }
        // Merge persisted settings with defaults to ensure all pages exist
        const mergedSettings = { ...defaultSettings };
        for (const key of Object.keys(defaultSettings) as PageKey[]) {
          if (persisted.settings[key]) {
            mergedSettings[key] = {
              cards: persisted.settings[key].cards || defaultSettings[key].cards,
              columns: persisted.settings[key].columns || defaultSettings[key].columns,
              buttons: persisted.settings[key].buttons || defaultSettings[key].buttons,
              sections: persisted.settings[key].sections || defaultSettings[key].sections,
            };
          }
        }
        return {
          ...currentState,
          ...persisted,
          settings: mergedSettings,
        };
      },
    }
  )
);

// Helper hook for getting sorted items
export const useSortedCards = (page: PageKey) => {
  const settings = useUISettingsStore((state) => state.settings[page]);
  return [...settings.cards].sort((a, b) => a.order - b.order);
};

export const useSortedColumns = (page: PageKey) => {
  const settings = useUISettingsStore((state) => state.settings[page]);
  return [...settings.columns].sort((a, b) => a.order - b.order);
};

export const useSortedButtons = (page: PageKey) => {
  const settings = useUISettingsStore((state) => state.settings[page]);
  return [...settings.buttons].sort((a, b) => a.order - b.order);
};

export const useSortedSections = (page: PageKey) => {
  const settings = useUISettingsStore((state) => state.settings[page]);
  return [...settings.sections].sort((a, b) => a.order - b.order);
};