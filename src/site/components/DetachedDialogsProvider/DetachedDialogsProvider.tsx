import { type Component, createMemo, For, type JSX } from 'solid-js';
import type { SiteRouteParams } from '../../../core/entities/site-route.js';
import { parseSiteRouteFragment, stringifySiteRouteFragment } from '../../../core/entities/site-route.js';
import { useHash } from '../../hooks/useHash.js';
import { ContributingDialog } from '../ContributingDialog/ContributingDialog.jsx';
import { PostEditingDialog } from '../PostEditingDialog/PostEditingDialog.jsx';
import { PostLocationDialog } from '../PostLocationDialog/PostLocationDialog.jsx';
import { PostPrecisingDialog } from '../PostPrecisingDialog/PostPrecisingDialog.jsx';
import { PostProposalDialog } from '../PostProposalDialog/PostProposalDialog.jsx';
import { PostRequestDialog } from '../PostRequestDialog/PostRequestDialog.jsx';
import { SponsorshipDialog } from '../SponsorshipDialog/SponsorshipDialog.jsx';
import { SubscriptionDialog } from '../SubscriptionDialog/SubscriptionDialog.jsx';
import { TopicDialog } from '../TopicDialog/TopicDialog.jsx';

export interface DetachedDialogProps<TPathname extends string, TParams extends SiteRouteParams> {
  show: boolean;
  onClose: () => void;
  pathname?: TPathname;
  params: Partial<TParams>;
}

export type DetachedDialog<
  TPathname extends string = string,
  TParams extends SiteRouteParams = SiteRouteParams,
> = Component<DetachedDialogProps<TPathname, TParams>>;

const detachedDialogs = {
  'post-editing': PostEditingDialog,
  'post-location': PostLocationDialog,
  'post-proposal': PostProposalDialog,
  'post-request': PostRequestDialog,
  'post-precising': PostPrecisingDialog,
  subscription: SubscriptionDialog,
  contributing: ContributingDialog as DetachedDialog,
  sponsorship: SponsorshipDialog,
  topic: TopicDialog,
} satisfies Record<string, DetachedDialog | undefined>;

export type DialogName = keyof typeof detachedDialogs;

export type DialogParams<T extends DialogName> = (typeof detachedDialogs)[T] extends DetachedDialog<
  string,
  infer TParams
>
  ? TParams
  : never;

export function createDetachedDialogFragment<
  TDialogName extends DialogName,
  TPathname extends string,
  TParams extends DialogParams<TDialogName>,
>(dialogName: TDialogName, pathname?: TPathname, params: TParams = {} as TParams) {
  return stringifySiteRouteFragment({
    pathname: [dialogName, pathname].filter(Boolean).join('/'),
    searchParams: params as unknown as TParams,
  });
}

function parseDetachedDialogFragment(fragment: string) {
  const { pathname, searchParams } = parseSiteRouteFragment(fragment);
  const [dialogName, ...rest] = pathname?.split('/') ?? [];

  return {
    dialogName: dialogName as DialogName | undefined,
    pathname: rest.join('/') || undefined,
    params: searchParams as unknown as DialogParams<DialogName> | undefined,
  };
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
          <Dialog
            show={fragment().dialogName === dialogName}
            onClose={() => setHash('')}
            pathname={fragment().pathname}
            params={fragment().params ?? {}}
          />
        )}
      </For>
    </>
  );
};
