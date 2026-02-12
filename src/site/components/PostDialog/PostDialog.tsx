import clsx from 'clsx';
import type { Component } from 'solid-js';
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  createUniqueId,
  For,
  mergeProps,
  Show,
  splitProps,
  untrack,
} from 'solid-js';
import type { InferOutput } from 'valibot';
import { picklist } from 'valibot';
import type { Option } from '../../../core/entities/option.js';
import { EMPTY_OPTION } from '../../../core/entities/option.js';
import type { Patch } from '../../../core/entities/patch.js';
import { patchObject } from '../../../core/entities/patch.js';
import type { Post, PostContent, PostRequest } from '../../../core/entities/post.js';
import {
  mergeAuthors,
  mergePostLocations,
  mergePostTags,
  mergePostViolations,
  mergePostWith,
  PostAddon,
  postAddonDescriptors,
  PostEngine,
  PostMark,
  PostPlacement,
  PostType,
  postTypeDescriptors,
  PostViolation,
  postViolationDescriptors,
} from '../../../core/entities/post.js';
import { createPostPath, parsePostPath } from '../../../core/entities/posts-manager.js';
import { USER_UNKNOWN } from '../../../core/entities/user.js';
import { createIssueUrl as createEditIssueUrl } from '../../../core/github-issues/post-editing.js';
import { createIssueUrl as createLocateIssueUrl } from '../../../core/github-issues/post-location.js';
import { email } from '../../../core/services/email.js';
import { asArray, listItems } from '../../../core/utils/common-utils.js';
import { dateToString } from '../../../core/utils/date-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { Button } from '../Button/Button.jsx';
import { DatePicker } from '../DatePicker/DatePicker.jsx';
import type { DialogProps } from '../Dialog/Dialog.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Input } from '../Input/Input.jsx';
import { Label } from '../Label/Label.jsx';
import { LocationTooltip } from '../LocationTooltip/LocationTooltip.jsx';
import { OptionSelectButton } from '../OptionSelectButton/OptionSelectButton.jsx';
import { PostContentEditor } from '../PostContentEditor/PostContentEditor.jsx';
import { PostContentPreview } from '../PostContentPreview/PostContentPreview.jsx';
import { Select } from '../Select/Select.jsx';
import { Toast } from '../Toaster/Toaster.jsx';
import { UserTooltip } from '../UserTooltip/UserTooltip.jsx';
import styles from './PostDialog.module.css';

export const PostDialogPreset = picklist(['edit', 'locate', 'precise']);
export type PostDialogPreset = InferOutput<typeof PostDialogPreset>;

export type PostDialogFeature = 'useColumnLayout' | 'previewContent' | 'addContent';

export interface PostDialogPresetDescriptor {
  title: (props: PostDialogProps) => string;
  fields: Array<keyof Post>;
  features: PostDialogFeature[];
}

export const postDialogPresetDescriptors = Object.freeze<Record<PostDialogPreset, PostDialogPresetDescriptor>>({
  edit: {
    title: (props) => (props.id ? 'Edit Post' : 'Create Draft'),
    fields: [
      'content',
      'snapshot',
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
      'placement',
      'mark',
      'violation',
      'request',
      'created',
    ],
    features: ['useColumnLayout', 'addContent'],
  },
  locate: { title: () => 'Locate Post', fields: ['location', 'placement'], features: ['previewContent'] },
  precise: {
    title: () => 'Precise Post',
    fields: [
      'title',
      'titleRu',
      'engine',
      'addon',
      'author',
      'tags',
      'description',
      'descriptionRu',
      'location',
      'placement',
      'mark',
      'request',
      'created',
    ],
    features: ['previewContent'],
  },
});

const violationOptions = PostViolation.options.map((value) => ({
  value,
  label: postViolationDescriptors[value].title,
}));

async function getLocationOptions(): Promise<Option[]> {
  return [
    EMPTY_OPTION,
    ...(await dataManager.getAllLocationInfos())
      .map((info) => ({
        value: info.title,
        label: info.title,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];
}

async function getUserOptions(): Promise<Option[]> {
  return [
    EMPTY_OPTION,
    ...(await dataManager.getAllUserInfos())
      .map((info) => ({ label: info.title, value: info.id, image: info.avatar }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];
}

export interface PostDialogProps extends Omit<DialogProps, 'title'> {
  id?: string;
  managerName?: string;
  mergeWith?: string | string[];
  type?: PostType;
  mark?: PostMark;
  trash?: PostContent;
  preset?: PostDialogPreset;
}

export const PostDialog: Component<PostDialogProps> = (props) => {
  const [local, rest] = splitProps(mergeProps({ preset: 'edit' } as const, props), [
    'id',
    'managerName',
    'mergeWith',
    'preset',
    'show',
  ]);

  const preset = () => postDialogPresetDescriptors[local.preset];
  const manager = () => (props.managerName ? dataManager.findPostsManager(props.managerName) : undefined);

  const [postEntry] = createResource(
    () => (props.show ? { id: props.id } : undefined),
    ({ id }) => (id ? manager()?.getEntry(id) : undefined),
  );

  const [mergeWithEntries] = createResource(
    () => (props.show && props.mergeWith ? props.mergeWith : undefined),
    (mergeWith) => {
      const paths = asArray(mergeWith);
      return Promise.all(
        paths.map((path) => {
          const { managerName, id } = parsePostPath(path);
          if (!managerName || !id) {
            return undefined;
          }
          const manager = dataManager.findPostsManager(managerName);

          return manager?.getEntry(id);
        }),
      );
    },
  );

  const [patch, setPatch] = createSignal<Patch<Post>>({});
  const post = createMemo(() => {
    const post: Post = { type: 'shot' };
    const existingPost = postEntry()?.[1];

    if (existingPost) {
      patchObject(post, existingPost);
    }

    patchObject(post, patch());

    delete post.posts;

    return post;
  });

  createEffect(() => {
    const entries = mergeWithEntries();
    if (!entries) {
      return;
    }

    const currentPost = untrack(() => post());

    for (const entry of entries) {
      if (!entry?.[1]) {
        continue;
      }

      mergePostWith(currentPost, entry[1]);
    }

    setPatch(currentPost);
  });

  createEffect(() => {
    const values = props;

    for (const key of ['type', 'mark', 'trash'] as const) {
      const value = values[key];
      if (typeof value === 'undefined') {
        continue;
      }
      setPatchField(key, value);
    }
  });

  const setPatchField = <TField extends keyof Patch<Post>>(field: TField, value: Patch<Post>[TField]) => {
    let newValue: Patch<Post>[TField] | null = value;

    if (field !== 'type' && typeof newValue === 'undefined') {
      newValue = null;
    }

    const newPatch = { ...patch(), [field]: newValue };

    setPatch(newPatch);
  };

  const [submitVariant, setSubmitVariant] = createSignal<'patch' | 'github-issue' | 'email'>('patch');
  const submitButtonProps = createMemo(() => {
    const entry = postEntry();
    const targetId = entry?.[3] ?? entry?.[0] ?? `${USER_UNKNOWN}.${dateToString(new Date(), true)}`;
    const variant = submitVariant();

    if (!manager() || !targetId) {
      return undefined;
    }

    switch (variant) {
      case 'patch': {
        return {
          onClick: () => manager()?.mergePatch({ [targetId]: post() }),
        };
      }

      case 'github-issue': {
        let href;

        switch (local.preset) {
          case 'edit':
            href = createEditIssueUrl(createPostPath(manager()!.name, targetId), post()!);
            break;
          case 'locate':
            href = createLocateIssueUrl(createPostPath(manager()!.name, targetId), post().location);
            break;
          default:
        }

        return { href, target: '_blank' };
      }

      case 'email': {
        let body;

        switch (local.preset) {
          case 'edit':
          case 'precise':
            body = JSON.stringify(patch(), null, 2);
            break;
          case 'locate':
            body = asArray(post().location).join('\n');
            break;
          default:
        }

        return {
          href: email.getUserMessagingUrl('me@dehero.site', {
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

  const setPostContentFields = (
    content: PostContent | undefined,
    snapshot: PostContent | undefined,
    trash: PostContent | undefined,
  ) => setPatch({ ...patch(), content, snapshot, trash });
  const setPostRequest = (request: Partial<PostRequest>) => {
    const oldRequest = post().request;
    const user = 'user' in request ? request.user : oldRequest?.user;
    const date = ('date' in request ? request.date : oldRequest?.date) || new Date();
    const text = ('text' in request ? request.text : oldRequest?.text) || '';

    setPatchField('request', !user ? undefined : { user, date, text });
  };

  const setPostAuthor = (index: number, author: string | undefined) => {
    const authors = asArray(post().author);
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
    const locations = asArray(post().location);
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

  const setPostViolation = (index: number, violation: PostViolation | undefined) => {
    const violations = asArray(post().violation);
    if (violation) {
      if (index < violations.length) {
        violations[index] = violation;
      } else {
        violations.push(violation);
      }
    } else {
      violations.splice(index, 1);
    }
    setPatchField('violation', mergePostViolations(violations));
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
    [
      (postEntry.loading || mergeWithEntries.loading) && 'Post',
      locationOptions.loading && 'Locations',
      userOptions.loading && 'Members',
    ].filter((value): value is string => typeof value === 'string');

  return (
    <>
      <Toast
        message={`Loading ${listItems(loadingResources(), false, 'and')}`}
        show={props.show && loadingResources().length > 0}
        loading
      />
      <Dialog
        title={preset().title(props)}
        show={props.show && loadingResources().length === 0}
        {...rest}
        actions={[
          <Select
            options={[
              { label: 'Save to Edits', value: 'patch' },
              { label: 'Create GitHub Issue', value: 'github-issue' },
              { label: 'Send via email', value: 'email' },
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
        <div class={clsx(styles.container, ...preset().features.map((feature) => styles[feature]))}>
          <Show when={preset().features.includes('previewContent')}>
            <PostContentPreview
              content={post().content}
              type={post().type}
              maxHeightMultiplier={1}
              class={styles.contentPreview}
            />
          </Show>

          <form id={form} class={styles.form}>
            <Show
              when={
                preset().fields.includes('content') ||
                preset().fields.includes('snapshot') ||
                preset().fields.includes('trash')
              }
            >
              <PostContentEditor
                content={post().content ?? undefined}
                snapshot={post().snapshot ?? undefined}
                trash={post().trash ?? undefined}
                onChange={setPostContentFields}
              />
            </Show>

            <Show when={preset().fields.includes('title') || preset().fields.includes('description')}>
              <fieldset class={clsx(styles.fieldset, styles.main)}>
                <Show when={preset().fields.includes('title')}>
                  <Label label="Title and Description" vertical>
                    <Input
                      name="title"
                      value={post().title ?? undefined}
                      onChange={(value) => setPatchField('title', value || undefined)}
                    />
                  </Label>
                </Show>

                <Show when={preset().fields.includes('description')}>
                  <Input
                    name="description"
                    value={post().description ?? undefined}
                    onChange={(value) => setPatchField('description', value || undefined)}
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
                      value={post().titleRu ?? undefined}
                      onChange={(value) => setPatchField('titleRu', value || undefined)}
                    />
                  </Label>
                </Show>

                <Show when={preset().fields.includes('descriptionRu')}>
                  <Input
                    name="descriptionRu"
                    value={post().descriptionRu ?? undefined}
                    onChange={(value) => setPatchField('descriptionRu', value || undefined)}
                    multiline
                    rows={5}
                    class={styles.input}
                  />
                </Show>
              </fieldset>
            </Show>

            <Show when={preset().fields.includes('placement') || preset().fields.includes('type')}>
              <fieldset class={styles.fieldset}>
                <Show when={preset().fields.includes('type')}>
                  <Label label="Type" vertical>
                    <div class={styles.selectWrapper}>
                      <Select
                        name="type"
                        options={PostType.options.map((value) => ({ label: postTypeDescriptors[value].title, value }))}
                        value={post().type}
                        onChange={(value) => setPatchField('type', value)}
                        class={styles.select}
                      />
                    </div>
                  </Label>
                </Show>

                <Show when={preset().fields.includes('placement')}>
                  <Label label="Placement" vertical>
                    <div class={styles.selectWrapper}>
                      <Select
                        name="placement"
                        options={[EMPTY_OPTION, ...PostPlacement.options.map((value) => ({ value }))]}
                        value={post().placement ?? undefined}
                        onChange={(value) => setPatchField('placement', value)}
                        class={styles.select}
                      />
                    </div>
                  </Label>
                </Show>
              </fieldset>
            </Show>

            <Show when={preset().fields.includes('location')}>
              <Label label="Location" class={styles.location} vertical>
                <Show
                  when={!post().addon || postAddonDescriptors[post().addon!].official}
                  fallback={
                    <Input
                      name="location"
                      value={asArray(post().location).join('')}
                      onChange={(value) => setPatchField('location', mergePostLocations(value))}
                    />
                  }
                >
                  <fieldset class={clsx(styles.fieldset, styles.locations)}>
                    <For each={[...asArray(post().location), undefined]}>
                      {(location, index) => (
                        <OptionSelectButton
                          title="Select Location"
                          options={locationOptions() ?? []}
                          value={location}
                          onChange={(location) => setPostLocation(index(), location)}
                          optionTooltip={(value, forRef) =>
                            value ? <LocationTooltip forRef={forRef} location={value} /> : undefined
                          }
                          emptyLabel="+"
                        />
                      )}
                    </For>
                  </fieldset>
                </Show>
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
                        value={post().engine}
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
                        value={post().addon ?? undefined}
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
                      value={asArray(post().tags).join(' ')}
                      onBlur={(e) => setPatchField('tags', mergePostTags(e.target.value.split(' ')))}
                    />
                  </Label>
                </Show>
              </fieldset>
            </Show>

            <Show when={preset().fields.includes('author')}>
              <Label label="Author" vertical class={styles.author}>
                <fieldset class={clsx(styles.fieldset, styles.authors)}>
                  <For each={[...asArray(post().author), undefined]}>
                    {(author, index) => (
                      <OptionSelectButton
                        title="Select Author"
                        options={userOptions() ?? []}
                        value={author}
                        onChange={(author) => setPostAuthor(index(), author)}
                        optionTooltip={(value, forRef) => <UserTooltip forRef={forRef} user={value} showAvatar />}
                        emptyLabel="+"
                      />
                    )}
                  </For>
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
                      value={post().mark ?? undefined}
                      onChange={(value) => setPatchField('mark', value)}
                      class={styles.select}
                    />
                  </Label>
                </Show>

                <Show when={preset().fields.includes('violation')}>
                  <Label label="Violation" vertical>
                    <fieldset class={clsx(styles.fieldset, styles.violations)}>
                      <For each={asArray(post().violation)}>
                        {(violation, index) => (
                          <div class={styles.selectWrapper}>
                            <Select
                              options={[{ label: '[Remove]', value: EMPTY_OPTION.value }, ...violationOptions]}
                              name="violation"
                              value={violation}
                              onChange={(violation) => setPostViolation(index(), violation)}
                              class={styles.select}
                            />
                          </div>
                        )}
                      </For>
                      <div class={styles.selectWrapper}>
                        <Select
                          options={[{ label: '[Add]', value: EMPTY_OPTION.value }, ...violationOptions]}
                          name="violation"
                          value={undefined}
                          onChange={(violation) => setPostViolation(asArray(post().violation).length, violation)}
                          class={styles.select}
                        />
                      </div>
                    </fieldset>
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
                      value={post().request?.user}
                      onChange={(user) => setPostRequest({ ...post().request, user })}
                      class={styles.select}
                    />
                  </div>

                  <Show when={post().request?.user}>
                    <DatePicker
                      // TODO: implement name="request[date]"
                      value={post().request?.date}
                      period={false}
                      onChange={(date) => setPostRequest({ date })}
                      emptyLabel="Pick Request Date"
                    />

                    <Input
                      name="request[text]"
                      value={post().request?.text}
                      onChange={(text) => setPostRequest({ text })}
                      multiline
                      rows={3}
                      class={styles.requestText}
                    />
                  </Show>
                </fieldset>
              </Label>
            </Show>

            <Show when={preset().fields.includes('created')}>
              <Label label="Created" vertical>
                <DatePicker
                  value={post().created}
                  period={false}
                  onChange={(value) => setPatchField('created', value)}
                  emptyLabel="Pick Date"
                />
              </Label>
            </Show>
          </form>
        </div>
      </Dialog>
    </>
  );
};
