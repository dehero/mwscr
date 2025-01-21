import type { PostRouteParams } from '../../routes/post-route.js';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.js';
import { PostDialog } from '../PostDialog/PostDialog.js';

export const PostLocationDialog: DetachedDialog<PostRouteParams> = (props) => {
  return <PostDialog preset="locate" {...props} {...props.params} />;
};
