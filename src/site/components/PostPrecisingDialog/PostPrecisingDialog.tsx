import { parsePostPath } from '../../../core/entities/posts-manager.js';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { PostDialog } from '../PostDialog/PostDialog.jsx';

const PostPrecisingDialog: DetachedDialog = (props) => {
  return <PostDialog preset="precise" {...props} {...props.params} {...parsePostPath(props.pathname ?? '')} />;
};

export { PostPrecisingDialog };
export default PostPrecisingDialog;
