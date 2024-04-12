// Based on https://github.com/RobinBoers/remark-url-rewrite

import { visit } from 'unist-util-visit';

const defaultReplacer = async (url) => url;

export const replaceAsync = async function (str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
};

export const rewriteJSXURL = async (value, replacer) => {
  replaceAsync(value, /href="(.*?)"/g, async (_, url) => {
    const newUrl = await replacer(url);
    return `href="${newUrl}"`;
  });
  replaceAsync(value, /src="(.*?)"/g, async (_, url) => {
    const newUrl = await replacer(url);
    return `src="${newUrl}"`;
  });
};

function remarkLinkRewrite(options = { replacer: defaultReplacer }) {
  const { replacer } = options;

  return async (tree) => {
    const nodes = [];

    visit(tree, (node) => {
      if (node.type === 'link' || node.type === 'image') {
        nodes.push(node);
      }
      if ((node.type === 'jsx' || node.type === 'html') && (/<a.*>/.test(node.value) || /<img.*>/.test(node.value))) {
        nodes.push(node);
      }
    });

    await Promise.all(
      nodes.map(async (node) => {
        if (node.type === 'link' || node.type === 'image') {
          node.url = await replacer(node.url);
        }
        if (node.type === 'jsx' || node.type === 'html') {
          node.value = await rewriteJSXURL(node.value, replacer);
        }
      }),
    );
    return tree;
  };
}

export { remarkLinkRewrite };
