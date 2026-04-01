import type { Id } from '@thisbeyond/solid-dnd';
import { useDragDropContext } from '@thisbeyond/solid-dnd';
import type { ParentComponent } from 'solid-js';
import { onCleanup, onMount } from 'solid-js';

const createPointerSensor = (id: Id = 'pointer-sensor'): void => {
  const [state, { addSensor, removeSensor, sensorStart, sensorMove, sensorEnd, dragStart, dragEnd }] =
    useDragDropContext()!;
  const activationDistance = 21; // pixels

  onMount(() => {
    addSensor({ id, activators: { pointerdown: attach } });
  });

  onCleanup(() => {
    removeSensor(id);
  });

  const isActiveSensor = () => state.active.sensorId === id;

  const initialCoordinates = { x: 0, y: 0 };

  let activationDelayTimeoutId: number | null = null;
  let activationDraggableId: Id | null = null;

  const attach = (event: MouseEvent, draggableId: Id | null) => {
    if (event.button !== 0) return;

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    activationDraggableId = draggableId;
    initialCoordinates.x = event.clientX;
    initialCoordinates.y = event.clientY;
  };

  const detach = (): void => {
    if (activationDelayTimeoutId) {
      clearTimeout(activationDelayTimeoutId);
      activationDelayTimeoutId = null;
    }

    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('selectionchange', clearSelection);
  };

  const onActivate = (): void => {
    if (!state.active.sensor) {
      sensorStart(id, initialCoordinates);
      dragStart(activationDraggableId!);

      clearSelection();
      document.addEventListener('selectionchange', clearSelection);
    } else if (!isActiveSensor()) {
      detach();
    }
  };

  const onPointerMove = (event: PointerEvent): void => {
    const coordinates = { x: event.clientX, y: event.clientY };

    if (!state.active.sensor) {
      const transform = {
        x: coordinates.x - initialCoordinates.x,
        y: coordinates.y - initialCoordinates.y,
      };

      if (Math.sqrt(transform.x ** 2 + transform.y ** 2) > activationDistance) {
        onActivate();
      }
    }

    if (isActiveSensor()) {
      event.preventDefault();
      sensorMove(coordinates);
    }
  };

  const onPointerUp = (event: PointerEvent): void => {
    detach();
    if (isActiveSensor()) {
      event.preventDefault();
      dragEnd();
      sensorEnd();
    }
  };

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
  };
};

export const CustomDragDropSensors: ParentComponent = (props) => {
  createPointerSensor();
  return <>{props.children}</>;
};
