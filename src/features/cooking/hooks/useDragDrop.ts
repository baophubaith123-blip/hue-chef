import { useCallback, useState, type DragEvent } from 'react';

interface UseDragDropOptions {
  onDropOnPot: (ingredientId: string) => void;
}

interface DragState {
  draggingId: string | null;
  potActive: boolean;
}

export function useDragDrop({ onDropOnPot }: UseDragDropOptions) {
  const [dragState, setDragState] = useState<DragState>({
    draggingId: null,
    potActive: false,
  });

  const handleDragStart = useCallback((ingredientId: string) => {
    setDragState({ draggingId: ingredientId, potActive: false });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({ draggingId: null, potActive: false });
  }, []);

  const handlePotDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragState((prev) => ({ ...prev, potActive: true }));
  }, []);

  const handlePotDragLeave = useCallback(() => {
    setDragState((prev) => ({ ...prev, potActive: false }));
  }, []);

  const handlePotDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      const ingredientId = event.dataTransfer.getData('text/ingredient-id');
      if (ingredientId) {
        onDropOnPot(ingredientId);
      }
      setDragState({ draggingId: null, potActive: false });
    },
    [onDropOnPot],
  );

  const getTrayItemProps = useCallback(
    (ingredientId: string) => ({
      draggable: true,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        event.dataTransfer.setData('text/ingredient-id', ingredientId);
        event.dataTransfer.effectAllowed = 'move';
        handleDragStart(ingredientId);
      },
      onDragEnd: handleDragEnd,
    }),
    [handleDragStart, handleDragEnd],
  );

  const potDropZoneProps = {
    onDragOver: handlePotDragOver,
    onDragLeave: handlePotDragLeave,
    onDrop: handlePotDrop,
  };

  return {
    draggingId: dragState.draggingId,
    potActive: dragState.potActive,
    getTrayItemProps,
    potDropZoneProps,
  };
}
