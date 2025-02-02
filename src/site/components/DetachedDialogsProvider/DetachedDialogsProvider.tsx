import { type Component, createMemo, For, type JSX } from 'solid-js';
import type { SiteRouteParams } from '../../../core/entities/site-route.js';
import { parseSiteRouteFragment, stringifySiteRouteFragment } from '../../../core/entities/site-route.js';
import { useHash } from '../../hooks/useHash.js';
import { ContributingDialog } from '../ContributingDialog/ContributingDialog.jsx';
import { PostEditingDialog } from '../PostEditingDialog/PostEditingDialog.jsx';
import { PostLocationDialog } from '../PostLocationDialog/PostLocationDialog.jsx';
import { PostMergeDialog } from '../PostMergeDialog/PostMergeDialog.jsx';
import { PostProposalDialog } from '../PostProposalDialog/PostProposalDialog.jsx';
import { PostRequestDialog } from '../PostRequestDialog/PostRequestDialog.jsx';
import { PostReviewDialog } from '../PostReviewDialog/PostReviewDialog.jsx';
import { SponsorshipDialog } from '../SponsorshipDialog/SponsorshipDialog.jsx';
import { SubscriptionDialog } from '../SubscriptionDialog/SubscriptionDialog.jsx';

export interface DetachedDialogProps<TParams extends SiteRouteParams> {
  show: boolean;
  onClose: () => void;
  params: Partial<TParams>;
}

export type DetachedDialog<TParams extends SiteRouteParams = SiteRouteParams> = Component<DetachedDialogProps<TParams>>;

const detachedDialogs = {
  'post-editing': PostEditingDialog,
  'post-location': PostLocationDialog,
  'post-merge': PostMergeDialog,
  'post-proposal': PostProposalDialog,
  'post-request': PostRequestDialog,
  'post-review': PostReviewDialog,
  subscription: SubscriptionDialog,
  contributing: ContributingDialog,
  sponsorship: SponsorshipDialog,
} satisfies Record<string, DetachedDialog | undefined>;

export type DialogName = keyof typeof detachedDialogs;

export type DialogParams<T extends DialogName> = (typeof detachedDialogs)[T] extends DetachedDialog<infer TParams>
  ? TParams
  : never;

export function createDetachedDialogFragment<TDialogName extends DialogName, TParams extends DialogParams<TDialogName>>(
  dialogName: TDialogName,
  params: TParams = {} as TParams,
) {
  return stringifySiteRouteFragment({
    pathname: dialogName,
    searchParams: params as unknown as TParams,
  });
}

function parseDetachedDialogFragment(fragment: string) {
  const { pathname, searchParams } = parseSiteRouteFragment(fragment);

  return { [pathname as DialogName]: searchParams as unknown as DialogParams<DialogName> };
}

export interface DialogsProviderProps {
  children?: JSX.Element;
}

export const DetachedDialogsProvider: Component<DialogsProviderProps> = (props: DialogsProviderProps) => {
  const [hash, setHash] = useHash();
  const fragment = createMemo(() => parseDetachedDialogFragment(hash()));

  return (
    <>
      {props.children}

      <For each={Object.entries(detachedDialogs)}>
        {([dialogName, Dialog]) => (
          <Dialog show={Boolean(fragment()[dialogName])} onClose={() => setHash('')} params={fragment()[dialogName]!} />
        )}
      </For>
    </>
  );
};
