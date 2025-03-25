import { parsePostPath } from '../../../core/entities/posts-manager.js';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.js';
import { PostDialog } from '../PostDialog/PostDialog.js';

export const PostEditingDialog: DetachedDialog = (props) => {
  return <PostDialog preset="edit" {...props} {...props.params} {...parsePostPath(props.pathname ?? '')} />;
};
