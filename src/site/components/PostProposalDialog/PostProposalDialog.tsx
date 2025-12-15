import type { UploadFile } from '@solid-primitives/upload';
import { createFileUploader } from '@solid-primitives/upload';
import { createMemo, createResource, createSignal, Show } from 'solid-js';
import { navigate } from 'vike/client/router';
import { PostViolation, postViolationDescriptors } from '../../../core/entities/post.js';
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

interface UploadReportItem {
  name: string;
  status?: 'Uploading' | 'Uploaded' | 'Error';
  postInfo?: PostInfo;
  errors: string[];
}

interface SubmitVariantDescriptor {
  id: string;
  label: string;
  description: string;
  allowedFormats: Array<[format: string, maxSize?: string]>;
}

const submitVariants: SubmitVariantDescriptor[] = [
  {
    id: 'upload-files',
    label: 'Upload files to Drafts',
    description:
      "Send images directly to Drafts, then edit proposed posts in-place. Changes are visible only in your current browser until you send Edits to the project's repository.",
    allowedFormats: [['PNG', '≤ 10MB']],
  },
  {
    id: 'insert-links',
    label: 'Insert links to Drafts',
    description:
      "Insert links to images or videos directly to Drafts, then edit proposed posts in-place. Changes are visible only in your current browser until you send Edits to the project's repository.",
    allowedFormats: [
      ['PNG', '≤ 10MB'],
      ['MP4, AVI', '≤ 200MB'],
    ],
  },
  {
    id: 'telegram-bot',
    label: 'Send files to Telegram bot',
    description:
      'Send images or videos to Telegram bot called "Ordinator". He will check them and put to Drafts if everything is ok. He answers within an hour.',
    allowedFormats: [
      ['PNG', '≤ 10MB'],
      ['MP4, AVI', '≤ 200MB'],
      ['ZIP', '≤ 100MB'],
    ],
  },
  {
    id: 'github-issue',
    label: 'Send files via GitHub Issue',
    description:
      "Create GitHub Issue in project's repository with your images or videos attached. Use ZIP archives to send large or multiple files. After the issue is created, files will be automatically checked by project's repository workflow and added to Drafts if everything is ok.",
    allowedFormats: [
      ['PNG', '≤ 10MB'],
      ['MP4', '≤ 10MB'],
      ['ZIP', '≤ 25MB'],
    ],
  },
  {
    id: 'email',
    label: 'Send files via email',
    description:
      'Send images or videos to project administrator via email. He will check them manually and put to Drafts if everything is ok. Use ZIP archives to send large or multiple files.',
    allowedFormats: [['PNG'], ['MP4, AVI'], ['ZIP']],
  },
] as const;

type SubmitVariant = (typeof submitVariants)[number]['id'];

async function getViolationTopicInfos(): Promise<TopicInfo[] | undefined> {
  const violationsTopicIds = PostViolation.options
    .filter((option) => postViolationDescriptors[option].topicId)
    .map((option) => postViolationDescriptors[option].topicId!);

  return (await dataManager.getTopicInfos(violationsTopicIds))?.filter(Boolean);
}

export const PostProposalDialog: DetachedDialog = (props) => {
  const [violationTopicInfos] = createResource(getViolationTopicInfos);
  const [submitVariant, setSubmitVariant] = createSignal<SubmitVariant>('upload-files');
  const submitVariantDescriptor = () => submitVariants.find((variant) => variant.id === submitVariant());

  const { addToast } = useToaster();

  const [linksText, setLinksText] = createSignal('');
  const { selectFiles } = createFileUploader({ accept: 'image/png', multiple: true });
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
      case 'upload-files': {
        return {
          onClick: () => selectFiles(processUploadFiles),
          children: 'Select Files',
        };
      }

      case 'insert-links': {
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
          href: email.getUserMessagingUrl('me@dehero.site', {
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
        actions={[<Button {...submitButtonProps()} />, <Button onClick={handleClose}>Cancel</Button>]}
      >
        <div class={styles.container}>
          <div class={styles.variantWrapper}>
            <Select
              options={submitVariants.map((variant) => ({ label: variant.label, value: variant.id }))}
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
                    rows={descriptor().allowedFormats.map((format) => ({ label: format[0], value: format[1] }))}
                    showEmptyValueRows
                    class={styles.allowedFormatsTable}
                  />
                </>
              )}
            </Show>
          </div>

          <Show when={violationTopicInfos()?.length}>
            <Table
              label="Minimum Requirements"
              class={styles.violationsTable}
              rows={violationTopicInfos()!.map((info) => ({
                label: info.title ?? info.id,
                tooltip: (ref) => <TopicTooltip topicId={info.id} forRef={ref} />,
                link: helpRoute.createUrl({ topicId: info.id }) + createDetachedDialogFragment('post-proposal'),
              }))}
              showEmptyValueRows
            />
          </Show>
        </div>
      </Dialog>
    </>
  );
};
