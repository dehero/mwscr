import { useParams } from '@solidjs/router';
import clsx from 'clsx';
import { type Component, createResource, createSignal, For, Match, Show, Switch } from 'solid-js';
import { parseResourceUrl, resourceIsImage, resourceIsVideo } from '../../../core/entities/resource.js';
import { getServicePostUrl } from '../../../core/services/youtube.js';
import { storeDescriptor } from '../../../core/stores/index.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { Button } from '../../components/Button/Button.jsx';
import { Divider } from '../../components/Divider/Divider.js';
import { Frame } from '../../components/Frame/Frame.js';
import frameStyles from '../../components/Frame/Frame.module.css';
import { Page } from '../../components/Page/Page.js';
import { PostComments } from '../../components/PostComments/PostComments.js';
import { PostEditDialog } from '../../components/PostEditDialog/PostEditDialog.js';
import { PostPublications } from '../../components/PostPublications/PostPublications.js';
import { ResourcePreview } from '../../components/ResourcePreview/ResourcePreview.js';
import { inbox, published, trash } from '../../data-managers/posts.js';
import type { PostRouteParams } from '../../routes/post-route.js';
import styles from './PostPage.module.css';

export const PostPage: Component = () => {
  const params = useParams<PostRouteParams>();

  const [selectedContentIndex, setSelectedContentIndex] = createSignal(0);

  const manager = [published, inbox, trash].find((m) => m.name === params.managerName);
  const [post] = createResource(() => manager?.getPost(params.id));
  const content = () => asArray(post()?.content);
  const contentPublicUrls = () => content().map((url) => storeDescriptor.getPublicUrl(parseResourceUrl(url).pathname));

  const selectedContent = () => content()[selectedContentIndex()];
  const selectedContentPublicUrl = () => contentPublicUrls()[selectedContentIndex()];

  const youtubePost = () => post()?.posts?.find((post) => post.service === 'yt');

  const [showEditDialog, setShowEditDialog] = createSignal(false);

  // TODO: display post trash

  return (
    <Page title={post()?.title} status={post.loading ? 'Loading...' : undefined}>
      <Divider class={styles.divider} />
      <Show when={post()}>
        {(post) => (
          <section
            class={clsx(
              styles.container,
              content().length > 1 && styles.withContentSelection,
              (contentPublicUrls().find((url) => typeof url === 'string') || youtubePost()) &&
                styles.withFullSizeContent,
              post().posts && styles.published,
              styles[post().type],
            )}
          >
            <Show when={content().length > 1}>
              <Frame component="section" variant="thin" class={styles.contentSelector}>
                <For each={content()}>
                  {(url, index) => (
                    <label class={styles.contentSelectorItem}>
                      <input
                        type="radio"
                        value={index()}
                        name="selectedContent"
                        checked={selectedContentIndex === index}
                        onChange={(e) => setSelectedContentIndex(Number(e.target.value))}
                        class={styles.contentSelectorRadio}
                      />
                      <ResourcePreview url={url} showTooltip />
                    </label>
                  )}
                </For>
              </Frame>
            </Show>

            <Show when={selectedContent()}>
              {(url) => (
                <Switch fallback={<ResourcePreview url={url()} showTooltip />}>
                  <Match when={resourceIsVideo(url()) && youtubePost()}>
                    <iframe
                      width={800}
                      src={getServicePostUrl(youtubePost()!, true)}
                      title=""
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowfullscreen
                      // @ts-expect-error No proper typing
                      frameborder="0"
                      class={clsx(frameStyles.thin, styles.content, styles.youtubeVideo)}
                    />
                  </Match>
                  <Match when={resourceIsImage(url()) && selectedContentPublicUrl()}>
                    <img
                      src={selectedContentPublicUrl()}
                      class={clsx(frameStyles.thin, styles.content, styles.image)}
                    />
                  </Match>
                </Switch>
              )}
            </Show>

            <Frame component="section" variant="thin" class={styles.info}>
              <Button onClick={() => setShowEditDialog(true)}>Edit</Button>
            </Frame>

            <Show when={post().posts}>
              <PostComments post={post()} class={styles.comments} />
            </Show>

            <Show when={post().posts}>
              <PostPublications post={post()} class={styles.publications} />
            </Show>

            <PostEditDialog
              postEntry={[params.id, post()]}
              show={showEditDialog()}
              onClose={() => setShowEditDialog(false)}
            />
          </section>
        )}
      </Show>
    </Page>
  );
};
