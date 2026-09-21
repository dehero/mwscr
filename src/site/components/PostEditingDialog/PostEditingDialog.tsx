import { parsePostPath } from '../../../core/entities/posts-manager.ts';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.tsx';
import { PostDialog } from '../PostDialog/PostDialog.tsx';

const PostEditingDialog: DetachedDialog = (props) => {
  return <PostDialog preset="edit" {...props} {...props.params} {...parsePostPath(props.pathname ?? '')} />;
};

export { PostEditingDialog };
export default PostEditingDialog;
