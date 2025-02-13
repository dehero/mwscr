import type { PostRouteParams } from '../../routes/post-route.js';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { PostDialog } from '../PostDialog/PostDialog.jsx';

export const PostPrecisingDialog: DetachedDialog<PostRouteParams> = (props) => {
  return <PostDialog preset="precise" {...props} {...props.params} />;
};
