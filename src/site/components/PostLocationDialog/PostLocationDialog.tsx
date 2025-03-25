import { parsePostPath } from '../../../core/entities/posts-manager.js';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.js';
import { PostDialog } from '../PostDialog/PostDialog.js';

export const PostLocationDialog: DetachedDialog = (props) => {
  return <PostDialog preset="locate" {...props} {...props.params} {...parsePostPath(props.pathname ?? '')} />;
};
