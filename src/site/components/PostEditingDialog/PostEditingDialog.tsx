import type { PostRouteParams } from '../../routes/post-route.js';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.js';
import { PostDialog } from '../PostDialog/PostDialog.js';

export const PostEditingDialog: DetachedDialog<PostRouteParams> = (props) => {
  return <PostDialog preset="edit" {...props} {...props.params} />;
};
