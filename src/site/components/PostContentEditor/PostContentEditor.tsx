import type { UploadFile } from '@solid-primitives/upload';
import { createFileUploader } from '@solid-primitives/upload';
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
import { batch, createSignal, For } from 'solid-js';
import type { PostContent } from '../../../core/entities/post.js';
import { mergePostContents } from '../../../core/entities/post.js';
import { ImageResourceExtension, ResourceUrl } from '../../../core/entities/resource.js';
import { assertSchema } from '../../../core/entities/schema.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { uploadFiles } from '../../data-managers/uploads.js';
import { Button } from '../Button/Button.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Frame } from '../Frame/Frame.js';
import { Input } from '../Input/Input.jsx';
import { Label } from '../Label/Label.jsx';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.js';
import { useToaster } from '../Toaster/Toaster.jsx';
import type { UploadReportItem } from '../UploadReportDialog/UploadReportDialog.jsx';
import { UploadReportDialog } from '../UploadReportDialog/UploadReportDialog.jsx';
import styles from './PostContentEditor.module.css';

const containerIds = ['content', 'snapshot', 'trash'] as const;

type ContainerId = (typeof containerIds)[number];

const isContainer = (id: string | number): id is ContainerId =>
  typeof id === 'string' && containerIds.includes(id as ContainerId);

function getContainerLabel(id: ContainerId) {
  switch (id) {
    case 'content':
      return 'Content';
    case 'snapshot':
      return 'Snapshot';
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
      <ResourcePreview
        url={props.url}
        showTooltip={!context?.active.draggable}
        // aspectRatio="1 / 1"
        class={styles.preview}
      />
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
    <label class={styles.container}>
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
  snapshot: PostContent | undefined;
  trash: PostContent | undefined;
  onChange: (
    content: PostContent | undefined,
    snapshot: PostContent | undefined,
    trash: PostContent | undefined,
  ) => void;
}

export const PostContentEditor: Component<PostContentEditorProps> = (props) => {
  const { selectFiles } = createFileUploader({ accept: ImageResourceExtension.options.join(', '), multiple: true });
  const { addToast } = useToaster();
  const [uploadReport, setUploadReport] = createSignal<UploadReportItem[]>([]);
  const updateUploadReportItem = (index: number, update: Partial<UploadReportItem>) =>
    setUploadReport((report) => report.map((item, i) => ({ ...item, ...(index === i ? update : item) })));

  const [linksText, setLinksText] = createSignal('');
  const [showInsertLinksDialog, setShowInsertLinksDialog] = createSignal(false);

  const containers = () => ({
    content: asArray(props.content),
    snapshot: asArray(props.snapshot),
    trash: asArray(props.trash),
  });
  const setContainerItems = (containerId: ContainerId, items: (items: string[]) => string[]) => {
    const changedContent = mergePostContents(items(containers()[containerId]));

    props.onChange(
      containerId === 'content' ? changedContent : mergePostContents(props.content, changedContent, true),
      containerId === 'snapshot' ? changedContent : mergePostContents(props.snapshot, changedContent, true),
      containerId === 'trash' ? changedContent : mergePostContents(props.trash, changedContent, true),
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

  const processUploadFiles = async (items: UploadFile[]) => {
    if (items.length === 0) {
      addToast('No files selected for upload');
      return;
    }

    setUploadReport(items.map(({ name }): UploadReportItem => ({ name, errors: [] })));

    for (const [itemIndex, item] of items.entries()) {
      updateUploadReportItem(itemIndex, { status: 'Uploading' });

      // Upload files one by one to show better progress bar and bypass server single POST request upload limits
      const result = await uploadFiles([item.file]);

      if (result.errors.length > 0) {
        updateUploadReportItem(itemIndex, { status: 'Error', errors: result.errors });

        for (const error of result.errors) {
          console.error(error);
        }
      }

      for (const upload of result.uploads) {
        const reportItem = uploadReport()[itemIndex];
        // Check if uploading is still processing
        if (!reportItem) {
          continue;
        }

        try {
          setContainerItems('content', (items) => [...items, upload.url]);

          updateUploadReportItem(itemIndex, {
            status: 'Uploaded',
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : `${error}`;
          updateUploadReportItem(itemIndex, { status: 'Error', errors: [errorMessage] });
          console.error(error);
        }
      }
    }
  };

  const handleAddLinks = async () => {
    setShowInsertLinksDialog(true);
  };

  const handleInsertLinks = () => {
    const urls = linksText()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (urls.length === 0) {
      addToast('No links to insert');
      return;
    }

    const badUrls: Set<string> = new Set();
    let hasSuccess = false;

    for (const url of urls) {
      try {
        assertSchema(ResourceUrl, url, (errorMessage) => `URL ${errorMessage}`);
        setContainerItems('content', (items) => [...items, url]);
        addToast(`"${url}" added to content`);

        hasSuccess = true;
      } catch (error) {
        addToast(error instanceof Error ? error.message : `${error}`);
        console.error(error);
        badUrls.add(url);
      }
    }

    if (hasSuccess && badUrls.size === 0) {
      setShowInsertLinksDialog(false);
      setLinksText('');
    } else {
      setLinksText([...badUrls].join('\n'));
    }
  };

  return (
    <>
      <DragDropProvider onDragOver={onDragOver} onDragEnd={onDragEnd} collisionDetector={closestContainerOrItem}>
        <DragDropSensors />
        <For each={containerIds}>{(key) => <List id={key} urls={containers()[key]} />}</For>
        <div class={styles.toolbar}>
          <Button
            onClick={(e: Event) => {
              e.preventDefault();
              selectFiles(processUploadFiles);
            }}
          >
            Upload Files
          </Button>
          <Button
            onClick={(e: Event) => {
              e.preventDefault();
              handleAddLinks();
            }}
          >
            Paste Links
          </Button>
        </div>
        <DragOverlay class={styles.dragOverlay}>
          {(draggable) => (
            <div class={styles.item}>
              <ResourcePreview url={draggable?.id.toString() || ''} aspectRatio="1 / 1" class={styles.preview} />
            </div>
          )}
        </DragOverlay>
      </DragDropProvider>
      <UploadReportDialog
        show={uploadReport().length > 0}
        uploadReport={uploadReport()}
        onClose={() => setUploadReport([])}
      />
      <Dialog
        show={showInsertLinksDialog()}
        onClose={() => setShowInsertLinksDialog(false)}
        modal
        actions={[
          <Button onClick={handleInsertLinks}>OK</Button>,
          <Button onClick={() => setShowInsertLinksDialog(false)}>Cancel</Button>,
        ]}
      >
        <Label label="Paste Links" vertical>
          <Input value={linksText()} onChange={setLinksText} multiline rows={10} class={styles.linksText} />
        </Label>
      </Dialog>
    </>
  );
};
