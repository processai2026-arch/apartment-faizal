import { motion, useDragControls, Reorder } from 'framer-motion';
import { GripVertical, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CardConfig } from '@/types/uiSettings';

interface DraggableCardProps {
  card: CardConfig;
  isEditMode: boolean;
  onVisibilityToggle?: (cardId: string) => void;
  onSizeChange?: (cardId: string, size: CardConfig['size']) => void;
  children: React.ReactNode;
  className?: string;
}

export function DraggableCard({
  card,
  isEditMode,
  onVisibilityToggle,
  onSizeChange,
  children,
  className,
}: DraggableCardProps) {
  const dragControls = useDragControls();

  if (!card.visible && !isEditMode) {
    return null;
  }

  return (
    <motion.div
      layout
      className={cn(
        'relative',
        isEditMode && 'ring-2 ring-indigo-500/50 ring-offset-2 rounded-2xl',
        !card.visible && isEditMode && 'opacity-40',
        className
      )}
    >
      {/* Edit Mode Overlay */}
      {isEditMode && (
        <div className="absolute -top-3 -right-3 z-20 flex items-center gap-1">
          {/* Size Toggle */}
          <button
            onClick={() => {
              const sizes: CardConfig['size'][] = ['small', 'medium', 'large', 'full'];
              const currentIndex = sizes.indexOf(card.size);
              const nextSize = sizes[(currentIndex + 1) % sizes.length];
              onSizeChange?.(card.id, nextSize);
            }}
            className="p-1.5 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
            title={`Size: ${card.size}`}
          >
            {card.size === 'small' || card.size === 'medium' ? (
              <Maximize2 className="w-3.5 h-3.5" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5" />
            )}
          </button>
          
          {/* Visibility Toggle */}
          <button
            onClick={() => onVisibilityToggle?.(card.id)}
            className={cn(
              'p-1.5 rounded-lg shadow-lg transition-colors',
              card.visible
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-slate-400 text-white hover:bg-slate-500'
            )}
            title={card.visible ? 'Hide' : 'Show'}
          >
            {card.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Drag Handle */}
      {isEditMode && (
        <div
          className="absolute top-1/2 -left-3 -translate-y-1/2 z-20 p-1.5 bg-indigo-500 text-white rounded-lg shadow-lg cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Card Content */}
      <div className={cn(!card.visible && isEditMode && 'pointer-events-none')}>
        {children}
      </div>
    </motion.div>
  );
}

// Wrapper for the entire draggable grid
interface DraggableGridProps {
  cards: CardConfig[];
  isEditMode: boolean;
  onReorder: (cards: CardConfig[]) => void;
  renderCard: (card: CardConfig) => React.ReactNode;
  className?: string;
}

export function DraggableGrid({
  cards,
  isEditMode,
  onReorder,
  renderCard,
  className,
}: DraggableGridProps) {
  const sortedCards = [...cards].sort((a, b) => a.order - b.order);

  if (!isEditMode) {
    return (
      <div className={className}>
        {sortedCards.filter(c => c.visible).map((card) => renderCard(card))}
      </div>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={sortedCards}
      onReorder={(newOrder) => {
        const updatedCards = newOrder.map((card, index) => ({
          ...card,
          order: index,
        }));
        onReorder(updatedCards);
      }}
      className={className}
    >
      {sortedCards.map((card) => (
        <Reorder.Item
          key={card.id}
          value={card}
          className="mb-4"
        >
          {renderCard(card)}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}