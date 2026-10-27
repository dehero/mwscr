import { createMediaQuery } from '@solid-primitives/media';
import { makePersisted } from '@solid-primitives/storage';
import { createAsync, revalidate } from '@solidjs/router';
import { createEffect, createMemo, createResource, createSignal, For, on, Show } from 'solid-js';
import { ASC_OPTION, DESC_OPTION } from '../../../core/entities/option.ts';
import type { PostAction } from '../../../core/entities/post-action.ts';
import type { SelectPostInfosParams } from '../../../core/entities/post-info.ts';
import { selectPostInfosResultToString } from '../../../core/entities/post-info.ts';
import { createPostPath, postsManagerDescriptors } from '../../../core/entities/posts-manager.ts';
import type { SiteRoutePage } from '../../../core/entities/site-route.ts';
import { AppPage } from '../../components/App/App.tsx';
import { Button } from '../../components/Button/Button.tsx';
import { createDetachedDialogFragment } from '../../components/DetachedDialogsProvider/DetachedDialogsProvider.tsx';
import { Divider } from '../../components/Divider/Divider.tsx';
import { Frame } from '../../components/Frame/Frame.tsx';
import { Input } from '../../components/Input/Input.tsx';
import { PostContentPreview } from '../../components/PostContentPreview/PostContentPreview.tsx';
import { PostPreviews } from '../../components/PostPreviews/PostPreviews.tsx';
import { RadioGroup } from '../../components/RadioGroup/RadioGroup.tsx';
import { Select } from '../../components/Select/Select.tsx';
import { Toast, useToaster } from '../../components/Toaster/Toaster.tsx';
import { dataManager } from '../../data-managers/manager.ts';
import { useLocalPatch } from '../../hooks/useLocalPatch.ts';
import { texts } from '../../texts/index.ts';
import { currentLocale, localize } from '../../utils/intl-utils.ts';
import { usePostsPageOptions } from './hooks/usePostsPageOptions.ts';
import { Options } from './Options.tsx';
import type { PostsPageData, PostsPageParams } from './PostsPage.data.ts';
import { queryPostsPageData } from './PostsPage.data.ts';
import styles from './PostsPage.module.css';

export const PostsPage: SiteRoutePage<PostsPageParams, PostsPageData> = (props) => {
  const data = createAsync(() => queryPostsPageData(props.params));

  const { messageBox } = useToaster();

  let containerRef: HTMLDivElement | undefined;
  let postsRef: HTMLDivElement | undefined;
  const narrowScreen = createMediaQuery('(max-width: 811px)');
  const postsScrollTarget = () => (narrowScreen() ? containerRef : postsRef);

  const parameters = usePostsPageOptions(props.params);
  const managerDescriptor = createMemo(() => postsManagerDescriptors[props.params.managerName]);
  const managerTitle = createMemo(() => localize(managerDescriptor().title));
  const postActions = createMemo((): PostAction[] => postsManagerDescriptors[props.params.managerName].actions);

  const [expandParametersOnNarrowScreen, setExpandParametersOnNarrowScreen] = makePersisted(createSignal(false), {
    name: 'posts.expandParametersOnNarrowScreen',
  });

  const [selected, setSelected] = createSignal<string[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [selectedPostInfos] = createResource(selected, (ids) =>
    dataManager.getPostInfos(props.params.managerName, ids),
  );

  // Clear selection on manager change
  createEffect(
    on(
      () => props.params.managerName,
      () => setSelected([]),
      { defer: true },
    ),
  );

  const handleSelectedChange = (id: string, value: boolean) => {
    if (!value) {
      setSelected((selected) => selected.filter((i) => i !== id));
    } else {
      setSelected((selected) => [...selected, id]);
    }
  };

  const handleMerge = async () => {
    if (
      (await messageBox(localize(texts.editing.mergeSelectedConfirmation, { count: selected().length }), [
        localize(texts.common.yes),
        localize(texts.common.no),
      ])) !== 0
    ) {
      return;
    }

    const [id, ...withIds] = selected();
    if (!id || withIds.length === 0) {
      return;
    }

    const manager = dataManager.findPostsManager(props.params.managerName);
    manager?.mergeItems(id, ...withIds);

    setSelected([]);
  };

  const selectParams = (): SelectPostInfosParams => ({
    type: parameters.type(),
    location: parameters.location(),
    tag: parameters.tag(),
    author: parameters.author(),
    locator: parameters.locator(),
    requester: parameters.requester(),
    mark: parameters.mark(),
    violation: parameters.violation(),
    original: parameters.original(),
    official: parameters.official(),
    publishable: parameters.publishable(),
    search: parameters.search(),
    sortKey: parameters.sortKey(),
    sortDirection: parameters.sortDirection(),
    date: parameters.date(),
    status: parameters.status(),
    placement: parameters.placement(),
    addon: parameters.addon(),
    aspect: parameters.aspect(),
  });

  const [postInfos, { refetch }] = createResource(selectParams, (selectParams) =>
    dataManager.selectPostInfos(props.params.managerName, selectParams),
  );

  useLocalPatch(() => {
    refetch();
    revalidate(queryPostsPageData.key);
  });

  return (
    <>
      <AppPage
        title={managerTitle()}
        description={localize(texts.app.postsDescription, {
          managerTitle: managerTitle(),
        })}
        loading={!data()}
      />

      <Frame component="main" class={styles.container} ref={containerRef}>
        <Toast message={localize(texts.content.loadingPosts)} show={postInfos.loading} loading />

        <Show when={data()}>
          {(data) => (
            <Options
              params={props.params}
              data={data()}
              options={parameters}
              class={styles.filters}
              expandedOnNarrowScreen={expandParametersOnNarrowScreen()}
              onExpandedChange={setExpandParametersOnNarrowScreen}
            />
          )}
        </Show>

        <Frame variant="thin" class={styles.postsFrame}>
          <div class={styles.filterbar}>
            <RadioGroup
              name="postType"
              options={parameters.typeOptions()}
              value={parameters.type()}
              onChange={parameters.setType}
              class={styles.typeRadioGroup}
              selectThreshold={10}
            />

            <Select
              class={styles.typeSelect}
              options={parameters.typeOptions()}
              value={parameters.type()}
              onChange={parameters.setType}
            />

            <div class={styles.search}>
              <div class={styles.searchInputWrapper}>
                <Input
                  name="search"
                  value={parameters.search()}
                  onChange={() => setIsSearching(true)}
                  onDebouncedChange={(value) => {
                    parameters.setSearch(value);
                    setIsSearching(false);
                  }}
                />
              </div>

              <Show when={parameters.search()}>
                <Button
                  onClick={(e: Event) => {
                    e.preventDefault();
                    parameters.setSearch('');
                    setIsSearching(false);
                  }}
                >
                  {localize(texts.filtering.clear)}
                </Button>
              </Show>

              <Toast message={localize(texts.filtering.searchingPosts)} show={isSearching()} loading />
            </div>

            <Show when={parameters.sortOptions().length > 0}>
              <div class={styles.sort}>
                <Select
                  options={parameters.sortOptions()}
                  value={parameters.sortKey()}
                  onChange={parameters.setSortKey}
                />
                <RadioGroup
                  name="sortDirection"
                  options={[ASC_OPTION, DESC_OPTION]}
                  value={parameters.sortDirection()}
                  onChange={parameters.setSortDirection}
                  class={styles.sortDirectionRadioGroup}
                />
              </div>
            </Show>
          </div>

          <Divider class={styles.toolbarDivider} />

          <div class={styles.toolbar}>
            <Show when={postInfos()} fallback={<p class={styles.postInfosLabel}>{localize(texts.content.loading)}</p>}>
              {(postInfos) => (
                <p class={styles.postInfosLabel}>
                  {selectPostInfosResultToString(
                    postInfos().totalCount,
                    postInfos().params,
                    currentLocale(),
                    props.params.managerName,
                  )}
                </p>
              )}
            </Show>

            <Show when={parameters.activeCount() > 0}>
              <Button onClick={() => parameters.setPreset(undefined)}>{localize(texts.filtering.resetOptions)}</Button>
            </Show>

            <Show when={selected().length > 0}>
              <fieldset class={styles.fieldset}>
                <div class={styles.selectedPosts}>
                  <For each={selectedPostInfos()}>
                    {(postInfo) => (
                      <PostContentPreview
                        content={postInfo.content}
                        aspectRatio={postInfo.aspect}
                        class={styles.selectedPost}
                      />
                    )}
                  </For>
                </div>
              </fieldset>

              <fieldset class={styles.fieldset}>
                <Button onClick={() => setSelected([])}>{localize(texts.editing.clearSelection)}</Button>
                <Show when={postActions().includes('merge') && selected().length > 1}>
                  <Button onClick={handleMerge}>{localize(texts.editing.mergeSelected)}</Button>
                </Show>

                <Show when={postActions().includes('compile') && selected().length > 1}>
                  <Button
                    href={createDetachedDialogFragment('post-editing', 'drafts', {
                      mergeWith: selected().map((id) => createPostPath(props.params.managerName, id)),
                      type: 'compilation',
                      mark: '',
                      trash: '',
                    })}
                  >
                    {localize(texts.editing.compileSelected)}
                  </Button>
                </Show>
              </fieldset>
            </Show>
            <Show when={postActions().includes('create')}>
              <fieldset class={styles.fieldset}>
                <Button href={createDetachedDialogFragment('post-editing', 'drafts')}>
                  {localize(texts.editing.createDraft)}
                </Button>
                <Button href={createDetachedDialogFragment('post-proposal')}>
                  {localize(texts.contributing.submitFiles)}
                </Button>
              </fieldset>
            </Show>
          </div>

          <Divider class={styles.toolbarDivider} />

          <Show when={postInfos()}>
            {(postInfos) => (
              <div class={styles.posts} ref={postsRef}>
                <PostPreviews
                  scrollTarget={postsScrollTarget()}
                  postInfos={postInfos().items}
                  selected={selected()}
                  onSelectedChange={
                    postActions().includes('merge') || postActions().includes('compile')
                      ? handleSelectedChange
                      : undefined
                  }
                />
              </div>
            )}
          </Show>
        </Frame>
      </Frame>
    </>
  );
};

export default PostsPage;
