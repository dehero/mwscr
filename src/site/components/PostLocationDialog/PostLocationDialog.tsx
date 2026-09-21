import { parsePostPath } from '../../../core/entities/posts-manager.ts';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.tsx';
import { PostDialog } from '../PostDialog/PostDialog.tsx';

const PostLocationDialog: DetachedDialog = (props) => {
  return <PostDialog preset="locate" {...props} {...props.params} {...parsePostPath(props.pathname ?? '')} />;
};

export { PostLocationDialog };
export default PostLocationDialog;
