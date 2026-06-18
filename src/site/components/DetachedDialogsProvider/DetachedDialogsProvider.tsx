import { type Component, createMemo, For, type JSX, lazy } from 'solid-js';
import { parseSiteRouteFragment, stringifySiteRouteFragment } from '../../../core/entities/site-route.js';
import { useHash } from '../../hooks/useHash.js';

const PostEditingDialog = lazy(() => import('../PostEditingDialog/PostEditingDialog.jsx'));
const PostLocationDialog = lazy(() => import('../PostLocationDialog/PostLocationDialog.jsx'));
const PostProposalDialog = lazy(() => import('../PostProposalDialog/PostProposalDialog.jsx'));
const PostRequestDialog = lazy(() => import('../PostRequestDialog/PostRequestDialog.jsx'));
const PostPrecisingDialog = lazy(() => import('../PostPrecisingDialog/PostPrecisingDialog.jsx'));
const SubscriptionDialog = lazy(() => import('../SubscriptionDialog/SubscriptionDialog.jsx'));
const ContributingDialog = lazy(() => import('../ContributingDialog/ContributingDialog.jsx'));
const SponsorshipDialog = lazy(() => import('../SponsorshipDialog/SponsorshipDialog.jsx'));
const TopicDialog = lazy(() => import('../TopicDialog/TopicDialog.jsx'));
const MerchOrderingDialog = lazy(() => import('../MerchOrderingDialog/MerchOrderingDialog.jsx'));
const DataPatchLoadingDialog = lazy(() => import('../DataPatchLoadingDialog/DataPatchLoadingDialog.jsx'));

export type DetachedDialogParams = Record<string, string | string[] | undefined>;

export interface DetachedDialogProps<TPathname extends string, TParams extends DetachedDialogParams> {
  show: boolean;
  onClose: () => void;
  pathname?: TPathname;
  params: Partial<TParams>;
}

export type DetachedDialog<
  TPathname extends string = string,
  TParams extends DetachedDialogParams = DetachedDialogParams,
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
  'merch-ordering': MerchOrderingDialog,
  'patch-loading': DataPatchLoadingDialog,
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
