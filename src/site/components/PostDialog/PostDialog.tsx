import clsx from 'clsx';
import type { Component } from 'solid-js';
import { createMemo, createResource, createSignal, createUniqueId, For, mergeProps, Show, splitProps } from 'solid-js';
import type { InferOutput } from 'valibot';
import { picklist } from 'valibot';
import type { Option } from '../../../core/entities/option.js';
import { EMPTY_OPTION } from '../../../core/entities/option.js';
import type { PostContent, PostPatch, PostRequest } from '../../../core/entities/post.js';
import {
  mergeAuthors,
  mergePostLocations,
  mergePostTags,
  patchPost,
  PostAddon,
  PostEngine,
  PostMark,
  PostType,
  postTypeDescriptors,
  PostViolation,
  postViolationDescriptors,
} from '../../../core/entities/post.js';
import { createIssueUrl as createEditIssueUrl } from '../../../core/github-issues/post-editing.js';
import { createIssueUrl as createLocateIssueUrl } from '../../../core/github-issues/post-location.js';
import { createIssueUrl as createReviewIssueUrl } from '../../../core/github-issues/post-review.js';
import { email } from '../../../core/services/email.js';
import { asArray, listItems } from '../../../core/utils/common-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { Button } from '../Button/Button.jsx';
import { DatePicker } from '../DatePicker/DatePicker.jsx';
import type { DialogProps } from '../Dialog/Dialog.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Input } from '../Input/Input.jsx';
import { Label } from '../Label/Label.jsx';
import { PostContentEditor } from '../PostContentEditor/PostContentEditor.jsx';
import { Select } from '../Select/Select.jsx';
import { Toast } from '../Toaster/Toaster.jsx';
import styles from './PostDialog.module.css';

export const PostDialogPreset = picklist(['edit', 'locate', 'review']);
export type PostDialogPreset = InferOutput<typeof PostDialogPreset>;

export interface PostDialogPresetDescriptor {
  title: string;
  fields: Array<keyof PostPatch>;
  useColumnLayout?: boolean;
}

export const postDialogPresetDescriptors = Object.freeze<Record<PostDialogPreset, PostDialogPresetDescriptor>>({
  edit: {
    title: 'Edit Post',
    fields: [
      'content',
      'trash',
      'title',
      'titleRu',
      'type',
      'engine',
      'addon',
      'author',
      'tags',
      'description',
      'descriptionRu',
      'location',
      'mark',
      'violation',
      'request',
    ],
    useColumnLayout: true,
  },
  locate: { title: 'Locate Post', fields: ['location'] },
  review: { title: 'Review Post', fields: ['mark', 'violation'] },
});

async function getLocationOptions(): Promise<Option[]> {
  return (await dataManager.getAllLocationInfos())
    .map((info) => ({
      value: info.title,
      label: info.title,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

async function getUserOptions(): Promise<Option[]> {
  return (await dataManager.getAllUserInfos())
    .map((info) => ({ label: info.title, value: info.id }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export interface PostDialogProps extends Omit<DialogProps, 'title'> {
  id?: string;
  managerName?: string;
  preset?: PostDialogPreset;
}

export const PostDialog: Component<PostDialogProps> = (props) => {
  const [local, rest] = splitProps(mergeProps({ preset: 'edit' } as const, props), [
    'id',
    'managerName',
    'preset',
    'show',
  ]);

  const preset = () => postDialogPresetDescriptors[local.preset];
  const manager = () => (props.managerName ? dataManager.findPostsManager(props.managerName) : undefined);

  const [postEntry] = createResource(
    () => (props.show && props.id ? props.id : undefined),
    (id) => manager()?.getEntry(id),
  );
  const [patch, setPatch] = createSignal<PostPatch>({});
  const post = createMemo(() => {
    const post = postEntry()?.[1];
    if (!post) {
      return undefined;
    }
    return patchPost(post, patch());
  });

  const setPatchField = <TField extends keyof PostPatch>(field: TField, value: PostPatch[TField]) => {
    let newValue: PostPatch[TField] | null = value;

    if (field !== 'type' && typeof newValue === 'undefined') {
      newValue = null;
    }

    setPatch({ ...patch(), [field]: newValue });
  };

  const [submitVariant, setSubmitVariant] = createSignal<'patch' | 'github-issue' | 'email'>('patch');
  const submitButtonProps = createMemo(() => {
    const entry = postEntry();
    const targetId = entry?.[2] ?? entry?.[0];
    const variant = submitVariant();

    if (!targetId) {
      return undefined;
    }

    switch (variant) {
      case 'patch': {
        return {
          onClick: () => {
            if (Object.keys(patch()).length === 0) {
              manager()?.resetLocallyPatchedItem(targetId);
            } else {
              manager()?.mergeLocalPatch({ [targetId]: patch() });
            }
          },
        };
      }

      case 'github-issue': {
        let href;

        switch (local.preset) {
          case 'edit':
            href = createEditIssueUrl(targetId, post()!);
            break;
          case 'locate':
            href = createLocateIssueUrl(targetId, post()?.location);
            break;
          case 'review':
            href = createReviewIssueUrl(targetId, post()!);
            break;
          default:
        }

        return { href, target: '_blank' };
      }

      case 'email': {
        let body;

        switch (local.preset) {
          case 'edit':
          case 'review':
            body = JSON.stringify(patch(), null, 2);
            break;
          case 'locate':
            body = asArray(post()?.location).join('\n');
            break;
          default:
        }

        return {
          href: email.getUserMessagingUrl('dehero@outlook.com', {
            subject: `${local.preset} - ${targetId}`,
            body,
          }),
          target: '_blank',
        };
      }

      default:
        return undefined;
    }
  });

  const form = createUniqueId();

  const setPostContentAndTrash = (content: PostContent | undefined, trash: PostContent | undefined) =>
    setPatch({ ...patch(), content, trash });
  const setPostRequest = (request: Partial<PostRequest>) => {
    const oldRequest = post()?.request;
    const user = 'user' in request ? request.user : oldRequest?.user;
    const date = ('date' in request ? request.date : oldRequest?.date) || new Date();
    const text = ('text' in request ? request.text : oldRequest?.text) || '';

    setPatchField('request', !user ? undefined : { user, date, text });
  };

  const setPostAuthor = (index: number, author: string | undefined) => {
    const authors = asArray(post()?.author);
    if (author) {
      if (index < authors.length) {
        authors[index] = author;
      } else {
        authors.push(author);
      }
    } else {
      authors.splice(index, 1);
    }
    setPatchField('author', mergeAuthors(authors));
  };

  const setPostLocation = (index: number, location: string | undefined) => {
    const locations = asArray(post()?.location);
    if (location) {
      if (index < locations.length) {
        locations[index] = location;
      } else {
        locations.push(location);
      }
    } else {
      locations.splice(index, 1);
    }
    setPatchField('location', mergePostLocations(locations));
  };

  const handleSubmit = () => {
    submitButtonProps()?.onClick?.();
    handleClose();
  };

  const handleClose = () => {
    setPatch({});
    props.onClose();
  };

  const [locationOptions] = createResource(
    () => props.show && preset().fields.includes('location'),
    getLocationOptions,
  );
  const [userOptions] = createResource(
    () => props.show && (preset().fields.includes('author') || preset().fields.includes('request')),
    getUserOptions,
  );

  const loadingResources = () =>
    [postEntry.loading && 'Post', locationOptions.loading && 'Locations', userOptions.loading && 'Users'].filter(
      (value): value is string => typeof value === 'string',
    );

  return (
    <>
      <Toast
        message={`Loading ${listItems(loadingResources(), false, 'and')}`}
        show={props.show && loadingResources().length > 0}
        loading
      />
      <Dialog
        title={preset().title}
        show={props.show && loadingResources().length === 0}
        {...rest}
        actions={[
          <Select
            options={[
              { label: 'Add to Local Patch', value: 'patch' },
              { label: 'Create GitHub Issue', value: 'github-issue' },
              { label: 'Sent via email', value: 'email' },
            ]}
            value={submitVariant()}
            onChange={setSubmitVariant}
          />,
          <Button {...submitButtonProps()} onClick={handleSubmit}>
            OK
          </Button>,
          <Button onClick={handleClose}>Cancel</Button>,
        ]}
        modal
      >
        <form id={form} class={clsx(styles.form, preset().useColumnLayout && styles.useColumnLayout)}>
          <Show when={preset().fields.includes('content') || preset().fields.includes('trash')}>
            <PostContentEditor
              content={post()?.content ?? undefined}
              trash={post()?.trash ?? undefined}
              onChange={setPostContentAndTrash}
            />
          </Show>

          <Show when={preset().fields.includes('title') || preset().fields.includes('description')}>
            <fieldset class={clsx(styles.fieldset, styles.main)}>
              <Show when={preset().fields.includes('title')}>
                <Label label="Title and Description" vertical>
                  <Input
                    name="title"
                    value={post()?.title ?? undefined}
                    onChange={(value) => setPatchField('title', value)}
                  />
                </Label>
              </Show>

              <Show when={preset().fields.includes('description')}>
                <Input
                  name="description"
                  value={post()?.description ?? undefined}
                  onChange={(value) => setPatchField('description', value)}
                  multiline
                  rows={5}
                  class={styles.input}
                />
              </Show>
            </fieldset>
          </Show>

          <Show when={preset().fields.includes('titleRu') || preset().fields.includes('descriptionRu')}>
            <fieldset class={clsx(styles.fieldset, styles.main)}>
              <Show when={preset().fields.includes('titleRu')}>
                <Label label="Title and Description on Russian" vertical>
                  <Input
                    name="titleRu"
                    value={post()?.titleRu ?? undefined}
                    onChange={(value) => setPatchField('titleRu', value)}
                  />
                </Label>
              </Show>

              <Show when={preset().fields.includes('descriptionRu')}>
                <Input
                  name="descriptionRu"
                  value={post()?.descriptionRu ?? undefined}
                  onChange={(value) => setPatchField('descriptionRu', value)}
                  multiline
                  rows={5}
                  class={styles.input}
                />
              </Show>
            </fieldset>
          </Show>

          <Show when={preset().fields.includes('location')}>
            <Label label="Location" class={styles.location} vertical>
              <fieldset class={clsx(styles.fieldset, styles.locations)}>
                <For each={asArray(post()?.location)}>
                  {(location, index) => (
                    <div class={styles.selectWrapper}>
                      <Select
                        options={[{ label: '[Remove]', value: EMPTY_OPTION.value }, ...(locationOptions() ?? [])]}
                        name="author"
                        value={location}
                        onChange={(location) => setPostLocation(index(), location)}
                        class={styles.select}
                      />
                    </div>
                  )}
                </For>
                <div class={styles.selectWrapper}>
                  <Select
                    options={[{ label: '[Add]', value: EMPTY_OPTION.value }, ...(locationOptions() ?? [])]}
                    name="location"
                    value={undefined}
                    onChange={(location) => setPostLocation(asArray(post()?.location).length, location)}
                    class={styles.select}
                  />
                </div>
              </fieldset>
            </Label>
          </Show>

          <Show when={preset().fields.includes('type')}>
            <Label label="Type" vertical>
              <div class={styles.selectWrapper}>
                <Select
                  name="type"
                  options={PostType.options.map((value) => ({ label: postTypeDescriptors[value].title, value }))}
                  value={post()?.type}
                  onChange={(value) => setPatchField('type', value)}
                  class={styles.select}
                />
              </div>
            </Label>
          </Show>

          <Show
            when={
              preset().fields.includes('engine') ||
              preset().fields.includes('addon') ||
              preset().fields.includes('tags')
            }
          >
            <fieldset class={clsx(styles.fieldset, styles.tagsFieldset)}>
              <Show when={preset().fields.includes('engine')}>
                <Label label="Engine" vertical>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="engine"
                      options={[EMPTY_OPTION, ...PostEngine.options.map((value) => ({ value }))]}
                      value={post()?.engine}
                      onChange={(value) => setPatchField('engine', value)}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={preset().fields.includes('addon')}>
                <Label label="Addon" vertical>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="addon"
                      options={[EMPTY_OPTION, ...PostAddon.options.map((value) => ({ value }))]}
                      value={post()?.addon ?? undefined}
                      onChange={(value) => setPatchField('addon', value)}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={preset().fields.includes('tags')}>
                <Label label="Tags" vertical class={styles.tags}>
                  <Input
                    name="tags"
                    value={asArray(post()?.tags).join(' ')}
                    onChange={(value) => setPatchField('tags', mergePostTags(value.split(' ')))}
                  />
                </Label>
              </Show>
            </fieldset>
          </Show>

          <Show when={preset().fields.includes('author')}>
            <Label label="Author" vertical class={styles.author}>
              <fieldset class={clsx(styles.fieldset, styles.authors)}>
                <For each={asArray(post()?.author)}>
                  {(author, index) => (
                    <div class={styles.selectWrapper}>
                      <Select
                        options={[{ label: '[Remove]', value: EMPTY_OPTION.value }, ...(userOptions() ?? [])]}
                        name="author"
                        value={author}
                        onChange={(author) => setPostAuthor(index(), author)}
                        class={styles.select}
                      />
                    </div>
                  )}
                </For>
                <div class={styles.selectWrapper}>
                  <Select
                    options={[{ label: '[Add]', value: EMPTY_OPTION.value }, ...(userOptions() ?? [])]}
                    name="author"
                    value={undefined}
                    onChange={(author) => setPostAuthor(asArray(post()?.author).length, author)}
                    class={styles.select}
                  />
                </div>
              </fieldset>
            </Label>
          </Show>

          <Show when={preset().fields.includes('mark') || preset().fields.includes('violation')}>
            <fieldset class={clsx(styles.fieldset)}>
              <Show when={preset().fields.includes('mark')}>
                <Label label="Editor's Mark" vertical>
                  <Select
                    name="mark"
                    options={[EMPTY_OPTION, ...PostMark.options.map((value) => ({ value }))]}
                    value={post()?.mark ?? undefined}
                    onChange={(value) => setPatchField('mark', value)}
                    class={styles.select}
                  />
                </Label>
              </Show>

              <Show when={preset().fields.includes('violation')}>
                <Label label="Violation" vertical>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="violation"
                      options={[
                        EMPTY_OPTION,
                        ...PostViolation.options.map((value) => ({
                          value,
                          label: postViolationDescriptors[value].title,
                        })),
                      ]}
                      value={post()?.violation ?? undefined}
                      onChange={(value) => setPatchField('violation', value)}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>
            </fieldset>
          </Show>

          <Show when={preset().fields.includes('request')}>
            <Label label="Requester" vertical>
              <fieldset class={clsx(styles.fieldset, styles.request)}>
                <div class={styles.selectWrapper}>
                  <Select
                    options={[EMPTY_OPTION, ...(userOptions() ?? [])]}
                    name="request[user]"
                    value={post()?.request?.user}
                    onChange={(user) => setPostRequest({ ...post()?.request, user })}
                    class={styles.select}
                  />
                </div>

                <Show when={post()?.request?.user}>
                  <DatePicker
                    // TODO: implement name="request[date]"
                    value={post()?.request?.date}
                    period={false}
                    onChange={(date) => setPostRequest({ date })}
                    emptyLabel="Pick Request Date"
                  />

                  <Input
                    name="request[text]"
                    value={post()?.request?.text}
                    onChange={(text) => setPostRequest({ text })}
                    multiline
                    rows={3}
                    class={styles.requestText}
                  />
                </Show>
              </fieldset>
            </Label>
          </Show>
        </form>
      </Dialog>
    </>
  );
};
