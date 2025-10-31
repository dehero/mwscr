import type { UploadFile } from '@solid-primitives/upload';
import { createFileUploader } from '@solid-primitives/upload';
import { createMemo, createResource, createSignal, Show } from 'solid-js';
import { navigate } from 'vike/client/router';
import {
  PostType,
  postTypeDescriptors,
  PostViolation,
  PostViolationDescriptor,
  postViolationDescriptors,
} from '../../../core/entities/post.js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import type { TopicInfo } from '../../../core/entities/topic-info.js';
import { USER_UNKNOWN } from '../../../core/entities/user.js';
import { createIssueUrl as createProposalIssueUrl } from '../../../core/github-issues/post-proposal.js';
import { email } from '../../../core/services/email.js';
import { telegram, TELEGRAM_BOT_NAME } from '../../../core/services/telegram.js';
import { dateToString } from '../../../core/utils/date-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { uploadFiles } from '../../data-managers/uploads.js';
import { helpRoute } from '../../routes/help-route.js';
import { postsRoute } from '../../routes/posts-route.js';
import { Button } from '../Button/Button.js';
import {
  createDetachedDialogFragment,
  type DetachedDialog,
} from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.js';
import { Input } from '../Input/Input.jsx';
import { Select } from '../Select/Select.jsx';
import { Table } from '../Table/Table.jsx';
import { useToaster } from '../Toaster/Toaster.jsx';
import { TopicTooltip } from '../TopicTooltip/TopicTooltip.jsx';
import { UploadReportDialog } from '../UploadReportDialog/UploadReportDialog.jsx';
import styles from './PostProposalDialog.module.css';
import { ImageResourceExtension } from '../../../core/entities/resource.js';
// @ts-expect-error Importing JSON
import importFormatsRaw from '../../../../assets/import-formats.json';

const submitVariants = importFormatsRaw as Record<string, SubmitVariantDescriptor>;

interface UploadReportItem {
  name: string;
  status?: 'Uploading' | 'Uploaded' | 'Error';
  postInfo?: PostInfo;
  errors: string[];
}

interface SubmitVariantDescriptor {
  label: string;
  description: string;
  allowedFormats: Array<{ label: string; mimeTypes: string[]; maxSize?: number }>;
}

async function getViolationTopicInfos(): Promise<Array<[PostViolationDescriptor, TopicInfo]> | undefined> {
  const requirements = PostViolation.options
    .map((option) => postViolationDescriptors[option])
    .filter((requirement) => requirement.topicId);

  const topicInfos = await dataManager.getTopicInfos(requirements.map(({ topicId }) => topicId));

  return requirements
    .map((requirement) => [requirement, topicInfos?.find((info) => info.id === requirement.topicId)])
    .filter(([_, topicInfo]) => typeof topicInfo !== 'undefined');
}

export const PostProposalDialog: DetachedDialog = (props) => {
  const [submitVariant, setSubmitVariant] = createSignal('site-uploads');
  const submitVariantDescriptor = () => submitVariants[submitVariant()];

  const { addToast } = useToaster();

  const [linksText, setLinksText] = createSignal('');
  // const [strict, setStrict] = createSignal(false);
  const [requirements] = createResource(() => getViolationTopicInfos(false));

  // const [possiblePostTypeTopicInfos] = createResource(
  //   () => ({ strict: strict() }),
  //   ({ strict }) => getPossiblePostTypeTopicInfos(strict),
  // );

  const { selectFiles } = createFileUploader({
    accept: ImageResourceExtension.options.join(', '),
    multiple: true,
  });
  const [uploadReport, setUploadReport] = createSignal<UploadReportItem[]>([]);
  const updateUploadReportItem = (index: number, update: Partial<UploadReportItem>) =>
    setUploadReport((report) => report.map((item, i) => ({ ...item, ...(index === i ? update : item) })));

  const processUploadFiles = async (items: UploadFile[]) => {
    if (items.length === 0) {
      addToast('No files selected for upload');
      return;
    }

    setUploadReport(items.map(({ name }): UploadReportItem => ({ name, errors: [] })));

    const drafts = dataManager.findPostsManager('drafts');

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

        const id = `${USER_UNKNOWN}.${dateToString(new Date(), true)}${itemIndex > 0 ? itemIndex + 1 : ''}`;

        try {
          await drafts?.addItem({ content: upload.url, title: upload.name, type: 'shot', author: USER_UNKNOWN }, id);

          updateUploadReportItem(itemIndex, {
            status: 'Uploaded',
            postInfo: await dataManager.getPostInfo('drafts', id),
          });

          // @ts-expect-error No proper typing
          navigate(
            postsRoute.createUrl({ managerName: 'drafts', status: 'added' }) +
              createDetachedDialogFragment('post-proposal'),
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : `${error}`;
          updateUploadReportItem(itemIndex, { status: 'Error', errors: [errorMessage] });
          console.error(error);
        }
      }
    }
  };

  const insertLinks = async () => {
    const urls = linksText()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (urls.length === 0) {
      addToast('No links to insert');
      return;
    }

    const drafts = dataManager.findPostsManager('drafts');

    const badUrls: Set<string> = new Set();
    let hasSuccess = false;

    for (const [i, url] of urls.entries()) {
      const id = `${USER_UNKNOWN}.${dateToString(new Date(), true)}${i > 0 ? i + 1 : ''}`;

      try {
        await drafts?.addItem({ content: url, type: 'shot', author: USER_UNKNOWN }, id);
        addToast(`"${url}" added to Drafts`);

        // @ts-expect-error No proper typing
        navigate(
          postsRoute.createUrl({ managerName: 'drafts', status: 'added' }) +
            createDetachedDialogFragment('post-proposal'),
        );
        hasSuccess = true;
      } catch (error) {
        addToast(error instanceof Error ? error.message : `${error}`);
        console.error(error);
        badUrls.add(url);
      }
    }

    if (hasSuccess && badUrls.size === 0) {
      handleClose();
    } else {
      setLinksText([...badUrls].join('\n'));
    }
  };

  const submitButtonProps = createMemo(() => {
    switch (submitVariant()) {
      case 'site-uploads': {
        return {
          onClick: () => selectFiles(processUploadFiles),
          children: 'Select Files',
        };
      }

      case 'link': {
        return {
          children: 'Insert Links',
          onClick: insertLinks,
        };
      }

      case 'telegram-bot':
        return {
          href: telegram.getUserProfileUrl(TELEGRAM_BOT_NAME),
          target: '_blank',
          children: 'Talk to Ordinator',
          onClick: handleClose,
        };

      case 'github-issue':
        return {
          href: createProposalIssueUrl(),
          target: '_blank',
          children: 'Create GitHub Issue',
          onClick: handleClose,
        };

      case 'email':
        return {
          href: email.getUserMessagingUrl('dehero@outlook.com', {
            subject: 'proposal',
            body: "Hello! I've attached .zip archive with works I'd like to propose. Please consider taking them to Drafts. Thank you!",
          }),
          target: '_blank',
          children: 'Create email',
          onClick: handleClose,
        };

      default:
        return undefined;
    }
  });

  const handleClose = () => {
    setLinksText('');
    setUploadReport([]);
    props.onClose();
  };

  return (
    <>
      <UploadReportDialog show={uploadReport().length > 0} uploadReport={uploadReport()} onClose={handleClose} />

      <Dialog
        title="Submit Files"
        modal
        {...props}
        show={props.show && uploadReport().length === 0}
        onClose={handleClose}
        summary={
          <a
            href={helpRoute.createUrl({ topicId: 'shooting-tips' }) + createDetachedDialogFragment('post-proposal')}
            class={styles.link}
          >
            Shooting Tips
          </a>
        }
        contentClass={styles.container}
        actions={[<Button {...submitButtonProps()} />, <Button onClick={handleClose}>Cancel</Button>]}
      >
        <div class={styles.variantWrapper}>
          <Select
            options={Object.entries(submitVariants).map(([id, variant]) => ({ label: variant.label, value: id }))}
            value={submitVariant()}
            onChange={setSubmitVariant}
          />

          <Show when={submitVariant() === 'insert-links'}>
            <Input value={linksText()} onChange={setLinksText} multiline rows={5} class={styles.linksText} />
          </Show>

          <Show when={submitVariantDescriptor()}>
            {(descriptor) => (
              <>
                <p class={styles.variantDescription}>{descriptor().description}</p>

                <Table
                  label="Allowed Formats"
                  rows={descriptor()
                    .allowedFormats // .filter((format) => !strict() || !format[2])
                    .map((format) => ({
                      label: format.label,
                      value: format.maxSize ? `≤ ${format.maxSize}MB` : undefined,
                    }))}
                  showEmptyValueRows
                  class={styles.allowedFormatsTable}
                />
              </>
            )}
          </Show>
        </div>

        <Show when={requirements()?.length}>
          <div class={styles.violations}>
            <Table
              label="Minimum Requirements"
              rows={requirements()!.map(([violationDescriptor, topicInfo]) => ({
                label: topicInfo.title ?? topicInfo.id,
                tooltip: (ref) => (topicInfo ? <TopicTooltip topicId={topicInfo.id} forRef={ref} /> : undefined),
                link: helpRoute.createUrl({ topicId: topicInfo.id }) + createDetachedDialogFragment('post-proposal'),
              }))}
              showEmptyValueRows
            />

            <Table
              label="Strict Requirements"
              rows={strictRequirementsTopicInfos()!.map((info) => ({
                label: info.title ?? info.id,
                tooltip: (ref) => <TopicTooltip topicId={info.id} forRef={ref} />,
                link: helpRoute.createUrl({ topicId: info.id }) + createDetachedDialogFragment('post-proposal'),
              }))}
              showEmptyValueRows
            />
          </div>
        </Show>
      </Dialog>
    </>
  );
};
