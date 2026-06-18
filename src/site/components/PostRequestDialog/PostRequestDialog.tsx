import { parsePostPath } from '../../../core/entities/posts-manager.js';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.js';
import { PostDialog } from '../PostDialog/PostDialog.js';

const PostRequestDialog: DetachedDialog = (props) => {
  return <PostDialog preset="request" {...props} {...props.params} {...parsePostPath(props.pathname ?? '')} />;
};

export { PostRequestDialog };
export default PostRequestDialog;
