import { POST_ADDONS, POST_ENGINES, POST_MARKS, POST_TYPES, POST_VIOLATIONS } from '../../entities/post.js';

export const postContent = {
  type: 'textarea',
  id: 'postContent',
  attributes: {
    label: 'Content',
    description: 'URLs of post contents',
    render: 'txt',
  },
};

export const postTitle = {
  type: 'input',
  id: 'postTitle',
  attributes: {
    label: 'Title',
    description: 'Post title (for Instagram and Telegram)',
    placeholder: 'Moon and Star on Vacation',
  },
};

export const postTitleRu = {
  type: 'input',
  id: 'postTitleRu',
  attributes: {
    label: 'Title on Russian',
    description: 'Post title (for VK)',
    placeholder: 'Луна и звезда на отдыхе',
  },
};

export const postType = {
  type: 'dropdown',
  id: 'postType',
  attributes: {
    label: 'Post Type',
    options: POST_TYPES,
    default: 0,
  },
  validations: {
    required: true,
  },
} as const;

export const postEngine = {
  type: 'dropdown',
  id: 'postEngine',
  attributes: {
    label: 'Engine',
    options: POST_ENGINES,
  },
} as const;

export const postAddon = {
  type: 'dropdown',
  id: 'postAddon',
  attributes: {
    label: 'Addon',
    options: POST_ADDONS,
  },
} as const;

export const postMark = {
  type: 'dropdown',
  id: 'postMark',
  attributes: {
    label: "Editor's Mark",
    options: POST_MARKS,
  },
} as const;

export const postViolation = {
  type: 'dropdown',
  id: 'postViolation',
  attributes: {
    label: 'Violation',
    options: Object.values(POST_VIOLATIONS),
  },
} as const;

export const postAuthor = {
  type: 'input',
  id: 'postAuthor',
  attributes: {
    label: 'Author IDs',
  },
};

export const postTags = {
  type: 'input',
  id: 'postTags',
  attributes: {
    label: 'Tags',
    description: 'Post Tags',
    placeholder: 'vivec almalexia sothasil',
  },
};

export const postLocation = {
  type: 'dropdown',
  id: 'postLocation',
  attributes: {
    label: 'Location',
    options: ['Loading...'],
    default: 0,
  },
  validations: {
    required: true,
  },
} as const;

export const postTrash = {
  type: 'textarea',
  id: 'postTrash',
  attributes: {
    label: 'Trash',
    description: 'URLs of post trash content',
    render: 'txt',
  },
};

export const postRequestText = {
  type: 'input',
  id: 'postRequest',
  attributes: {
    label: 'Request',
  },
};

export const mergeWithIds = {
  type: 'textarea',
  id: 'mergeWithIds',
  attributes: {
    label: 'Merge with IDs',
    description: 'Paste post IDs which you would like to merge with',
    render: 'txt',
  },
};

export const userName = {
  type: 'input',
  id: 'userName',
  attributes: {
    label: 'Name',
    description:
      'Create new user or force set existing user name (for administrator). Leave blank if you have contributed with issues earlier.',
    placeholder: 'Jiub the Saint',
  },
};

export const userProfileIg = {
  type: 'input',
  id: 'userProfileIg',
  attributes: {
    label: 'Instagram Profile',
    description: "Write down author's Instagram profile link or name.",
    placeholder: 'jiub',
  },
};

export const userProfileTg = {
  type: 'input',
  id: 'userProfileTg',
  attributes: {
    label: 'Telegram Profile',
    description: "Write down author's Telegram profile link or name.",
    placeholder: 'saint_jiub',
  },
};

export const userProfileVk = {
  type: 'input',
  id: 'userProfileVk',
  attributes: {
    label: 'VK Profile',
    description: "Write down author's VK profile link or name.",
    placeholder: 'cliffracer_destroyer',
  },
};
