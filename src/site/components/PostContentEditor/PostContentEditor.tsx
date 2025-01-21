import type { CollisionDetector, DragEventHandler, Draggable, Droppable } from '@thisbeyond/solid-dnd';
import {
  closestCenter,
  createDroppable,
  createSortable,
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  useDragDropContext,
} from '@thisbeyond/solid-dnd';
import clsx from 'clsx';
import type { Component } from 'solid-js';
import { batch, For } from 'solid-js';
import type { PostContent } from '../../../core/entities/post.js';
import { mergePostContents } from '../../../core/entities/post.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { Frame } from '../Frame/Frame.js';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.js';
import styles from './PostContentEditor.module.css';

const containerIds = ['content', 'trash'] as const;

type ContainerId = (typeof containerIds)[number];

const isContainer = (id: string | number): id is ContainerId =>
  typeof id === 'string' && containerIds.includes(id as ContainerId);

function getContainerLabel(id: ContainerId) {
  switch (id) {
    case 'content':
      return 'Content';
    case 'trash':
      return 'Trash';
    default:
      return '';
  }
}

interface ItemProps {
  url: string;
}

const Item: Component<ItemProps> = (props) => {
  const sortable = createSortable(props.url);
  const [context] = useDragDropContext() ?? [];
  return (
    <div ref={sortable} class={clsx(styles.item, sortable.isActiveDraggable && styles.draggedItem)}>
      <ResourcePreview url={props.url} showTooltip={!context?.active.draggable} />
    </div>
  );
};

interface ListProps {
  id: ContainerId;
  urls: string[];
}

const List: Component<ListProps> = (props) => {
  const droppable = createDroppable(props.id);
  return (
    <label>
      <span class={styles.label}>{getContainerLabel(props.id)}</span>
      <Frame ref={droppable} class={styles.list}>
        <SortableProvider ids={props.urls}>
          <For each={props.urls}>{(url) => <Item url={url} />}</For>
        </SortableProvider>
      </Frame>
    </label>
  );
};

export interface PostContentEditorProps {
  content: PostContent | undefined;
  trash: PostContent | undefined;
  onChange: (content: PostContent | undefined, trash: PostContent | undefined) => void;
}

export const PostContentEditor: Component<PostContentEditorProps> = (props) => {
  const containers = () => ({ content: asArray(props.content), trash: asArray(props.trash) });
  const setContainerItems = (containerId: ContainerId, items: (items: string[]) => string[]) => {
    const changedContent = mergePostContents(items(containers()[containerId]));
    props.onChange(
      containerId === 'content' ? changedContent : props.content,
      containerId === 'trash' ? changedContent : props.trash,
    );
  };

  const getItemContainerId = (id: string | number): ContainerId | undefined => {
    if (typeof id !== 'string') {
      return undefined;
    }
    for (const containerId of containerIds) {
      if (containers()[containerId].includes(id)) {
        return containerId;
      }
    }
    return undefined;
  };

  const closestContainerOrItem: CollisionDetector = (draggable, droppables, context) => {
    const closestContainer = closestCenter(
      draggable,
      droppables.filter((droppable) => isContainer(droppable.id)),
      context,
    );
    if (closestContainer) {
      const closestContainerItems = containers()[closestContainer.id as ContainerId];
      const closestItem = closestCenter(
        draggable,
        droppables.filter(
          (droppable) => typeof droppable.id === 'string' && closestContainerItems.includes(droppable.id),
        ),
        context,
      );
      if (!closestItem) {
        return closestContainer;
      }

      if (getItemContainerId(draggable.id) !== closestContainer.id) {
        const isLastItem =
          typeof closestItem.id === 'string' &&
          closestContainerItems.indexOf(closestItem.id) === closestContainerItems.length - 1;

        if (isLastItem) {
          const belowLastItem = draggable.transformed.center.y > closestItem.transformed.center.y;

          if (belowLastItem) {
            return closestContainer;
          }
        }
      }
      return closestItem;
    }
    return null;
  };

  const move = (draggable: Draggable, droppable: Droppable, onlyWhenChangingContainer = true) => {
    const fromContainerId = getItemContainerId(draggable.id);
    const toContainerId = isContainer(droppable.id) ? droppable.id : getItemContainerId(droppable.id);

    if (!fromContainerId || !toContainerId) {
      return;
    }

    if (fromContainerId !== toContainerId || !onlyWhenChangingContainer) {
      const toContainerItems = containers()[toContainerId];
      let index = typeof droppable.id === 'string' ? toContainerItems.indexOf(droppable.id) : -1;
      if (index === -1) index = toContainerItems.length;

      batch(() => {
        setContainerItems(fromContainerId, (items) => items.filter((item) => item !== draggable.id));

        setContainerItems(toContainerId, (items) => [
          ...items.slice(0, index),
          draggable.id as string,
          ...items.slice(index),
        ]);
      });
    }
  };

  const onDragOver: DragEventHandler = ({ draggable, droppable }) => {
    if (droppable) {
      move(draggable, droppable);
    }
  };

  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    if (droppable) {
      move(draggable, droppable, false);
    }
  };

  return (
    <DragDropProvider onDragOver={onDragOver} onDragEnd={onDragEnd} collisionDetector={closestContainerOrItem}>
      <DragDropSensors />
      <For each={containerIds}>{(key) => <List id={key} urls={containers()[key]} />}</For>
      <DragOverlay class={styles.dragOverlay}>
        {(draggable) => (
          <div class={styles.item}>
            <ResourcePreview url={draggable?.id.toString() || ''} />
          </div>
        )}
      </DragOverlay>
    </DragDropProvider>
  );
};
