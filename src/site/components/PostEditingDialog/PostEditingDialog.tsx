import clsx from 'clsx';
import { createEffect, createResource, createSignal, createUniqueId, For, Show, splitProps } from 'solid-js';
import type { Option } from '../../../core/entities/option.js';
import { EMPTY_OPTION } from '../../../core/entities/option.js';
import type { Post, PostRequest } from '../../../core/entities/post.js';
import {
  mergeAuthors,
  mergePostLocations,
  mergePostTags,
  PostAddon,
  PostEngine,
  PostMark,
  PostType,
  postTypeDescriptors,
  PostViolation,
  postViolationDescriptors,
} from '../../../core/entities/post.js';
import { createIssueUrl as createEditIssueUrl } from '../../../core/github-issues/post-editing.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import type { PostRouteParams } from '../../routes/post-route.js';
import { Button } from '../Button/Button.js';
import { DatePicker } from '../DatePicker/DatePicker.jsx';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.js';
import { Input } from '../Input/Input.js';
import { Label } from '../Label/Label.js';
import { PostContentEditor } from '../PostContentEditor/PostContentEditor.js';
import { Select } from '../Select/Select.js';
import { Toast } from '../Toaster/Toaster.jsx';
import styles from './PostEditingDialog.module.css';

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

export const PostEditingDialog: DetachedDialog<PostRouteParams> = (props) => {
  const [, rest] = splitProps(props, ['params', 'show']);

  const id = () => props.params.id;
  const manager = () => props.params.managerName && dataManager.findPostsManager(props.params.managerName);

  const [postEntry] = createResource(
    () => (props.show ? id() : undefined),
    (id) => manager()?.getEntry(id),
  );

  createEffect(() => {
    if (postEntry.state === 'ready') {
      setPost(postEntry()?.[1] ?? {});
    }
  });

  const [post, setPost] = createSignal<Partial<Post>>({});
  const form = createUniqueId();

  const setPostContentAndTrash = ({ content, trash }: Pick<Post, 'content' | 'trash'>) =>
    setPost({ ...post(), content, trash });
  const setPostTitle = (title: string) => setPost({ ...post(), title });
  const setPostTitleRu = (titleRu: string) => setPost({ ...post(), titleRu });
  const setPostDescription = (description: string) => setPost({ ...post(), description });
  const setPostDescriptionRu = (descriptionRu: string) => setPost({ ...post(), descriptionRu });
  const setPostType = (type: PostType = 'shot') => setPost({ ...post(), type });
  const setPostEngine = (engine: PostEngine | undefined) => setPost({ ...post(), engine });
  const setPostAddon = (addon: PostAddon | undefined) => setPost({ ...post(), addon });
  const setPostMark = (mark: PostMark | undefined) => setPost({ ...post(), mark });
  const setPostViolation = (violation: PostViolation | undefined) => setPost({ ...post(), violation });
  const setPostRequest = (request: Partial<PostRequest>) => {
    const oldRequest = post().request;
    const user = 'user' in request ? request.user : oldRequest?.user;
    const date = ('date' in request ? request.date : oldRequest?.date) || new Date();
    const text = ('text' in request ? request.text : oldRequest?.text) || '';

    setPost({ ...post(), request: !user ? undefined : { user, date, text } });
  };
  const setPostTags = (tags: string[] | undefined) => setPost({ ...post(), tags });

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
    setPost({ ...post(), author: mergeAuthors(authors) });
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
    setPost({ ...post(), location: mergePostLocations(locations) });
  };

  const [locationOptions] = createResource(() => props.show, getLocationOptions);
  const [userOptions] = createResource(() => props.show, getUserOptions);

  const isLoading = () => postEntry.loading || locationOptions.loading || userOptions.loading;

  return (
    <>
      <Toast message="Loading Post, Locations and Users" show={props.show && isLoading()} loading />
      <Dialog
        title="Edit Post"
        show={props.show && !isLoading()}
        {...rest}
        summary={<p class={styles.submissionAlert}>Submit edits only if you are an editor!</p>}
        actions={[
          <Button href={createEditIssueUrl(id(), post() as Post)} onClick={props.onClose} target="_blank">
            Submit via GitHub
          </Button>,
          <Button onClick={props.onClose}>Cancel</Button>,
        ]}
        modal
      >
        <form id={form} class={styles.form}>
          <PostContentEditor value={post()} onChange={setPostContentAndTrash} />

          <fieldset class={clsx(styles.fieldset, styles.main)}>
            <Label label="Title and Description" vertical>
              <Input name="title" value={post().title} onChange={setPostTitle} />
            </Label>

            <Input
              name="description"
              value={post().description}
              onChange={setPostDescription}
              multiline
              rows={5}
              class={styles.input}
            />
          </fieldset>

          <fieldset class={clsx(styles.fieldset, styles.main)}>
            <Label label="Title and Description on Russian" vertical>
              <Input name="titleRu" value={post().titleRu} onChange={setPostTitleRu} />
            </Label>

            <Input
              name="descriptionRu"
              value={post().descriptionRu}
              onChange={setPostDescriptionRu}
              multiline
              rows={5}
              class={styles.input}
            />
          </fieldset>

          <Label label="Location" class={styles.location} vertical>
            <fieldset class={clsx(styles.fieldset, styles.locations)}>
              <For each={asArray(post().location)}>
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
                  onChange={(location) => setPostLocation(asArray(post().location).length, location)}
                  class={styles.select}
                />
              </div>
            </fieldset>
          </Label>

          <Label label="Type" vertical>
            <div class={styles.selectWrapper}>
              <Select
                name="type"
                options={PostType.options.map((value) => ({ label: postTypeDescriptors[value].title, value }))}
                value={post().type}
                onChange={setPostType}
                class={styles.select}
              />
            </div>
          </Label>

          <fieldset class={clsx(styles.fieldset, styles.tagsFieldset)}>
            <Label label="Engine" vertical>
              <div class={styles.selectWrapper}>
                <Select
                  name="engine"
                  options={[EMPTY_OPTION, ...PostEngine.options.map((value) => ({ value }))]}
                  value={post().engine}
                  onChange={setPostEngine}
                  class={styles.select}
                />
              </div>
            </Label>

            <Label label="Addon" vertical>
              <div class={styles.selectWrapper}>
                <Select
                  name="addon"
                  options={[EMPTY_OPTION, ...PostAddon.options.map((value) => ({ value }))]}
                  value={post().addon}
                  onChange={setPostAddon}
                  class={styles.select}
                />
              </div>
            </Label>

            <Label label="Tags" vertical class={styles.tags}>
              <Input
                name="postTags"
                value={asArray(post().tags).join(' ')}
                onChange={(value) => setPostTags(mergePostTags(value.split(' ')))}
              />
            </Label>
          </fieldset>

          <Label label="Author" vertical class={styles.author}>
            <fieldset class={clsx(styles.fieldset, styles.authors)}>
              <For each={asArray(post().author)}>
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
                  onChange={(author) => setPostAuthor(asArray(post().author).length, author)}
                  class={styles.select}
                />
              </div>
            </fieldset>
          </Label>

          <fieldset class={clsx(styles.fieldset)}>
            <Label label="Editor's Mark" vertical>
              <Select
                name="mark"
                options={[EMPTY_OPTION, ...PostMark.options.map((value) => ({ value }))]}
                value={post().mark}
                onChange={setPostMark}
                class={styles.select}
              />
            </Label>

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
                  value={post().violation}
                  onChange={setPostViolation}
                  class={styles.select}
                />
              </div>
            </Label>
          </fieldset>

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
        </form>
      </Dialog>
    </>
  );
};
