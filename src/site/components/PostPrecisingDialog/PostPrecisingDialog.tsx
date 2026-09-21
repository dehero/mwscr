import { parsePostPath } from '../../../core/entities/posts-manager.ts';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.tsx';
import { PostDialog } from '../PostDialog/PostDialog.tsx';

const PostPrecisingDialog: DetachedDialog = (props) => {
  return <PostDialog preset="precise" {...props} {...props.params} {...parsePostPath(props.pathname ?? '')} />;
};

export { PostPrecisingDialog };
export default PostPrecisingDialog;
