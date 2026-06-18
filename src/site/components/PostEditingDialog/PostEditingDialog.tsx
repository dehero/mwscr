import { parsePostPath } from '../../../core/entities/posts-manager.js';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.js';
import { PostDialog } from '../PostDialog/PostDialog.js';

const PostEditingDialog: DetachedDialog = (props) => {
  return <PostDialog preset="edit" {...props} {...props.params} {...parsePostPath(props.pathname ?? '')} />;
};

export { PostEditingDialog };
export default PostEditingDialog;
