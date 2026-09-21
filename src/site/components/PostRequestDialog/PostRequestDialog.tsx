import { parsePostPath } from '../../../core/entities/posts-manager.ts';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.tsx';
import { PostDialog } from '../PostDialog/PostDialog.tsx';

const PostRequestDialog: DetachedDialog = (props) => {
  return <PostDialog preset="request" {...props} {...props.params} {...parsePostPath(props.pathname ?? '')} />;
};

export { PostRequestDialog };
export default PostRequestDialog;
