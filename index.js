const DEFAULT_MATCHER = /\{\{\s*(.+?)\s*\}\}/g;
const DEFAULT_RESOLVER = (c, k) => c[k];
const PATH_DELIMITER = '.';

const interpolate = (subject, params, options, pushDeps) => {
  let shouldReplaceFull, found;
  const { pattern = DEFAULT_MATCHER, resolver = DEFAULT_RESOLVER } = options;

  const replaced = subject.replace(pattern, (full, matched) => {
    shouldReplaceFull = full === subject;
    found = resolver(params, matched);
    pushDeps(matched, found);
    return shouldReplaceFull ? '' : found;
  });

  return shouldReplaceFull ? found : replaced;
};

const joinPath = (path, delimiter = PATH_DELIMITER) => path.join(delimiter);
const reducePatch = (path, fn) =>
  fn(path.reduce((acc, p) => (fn(acc), joinPath([acc, p]))));

const interpolatable = (
  subject,
  options = {},
  dependencyMap = {},
  path = [''],
) => {
  const key = joinPath(path, options.delimiter);
  if (
    !subject ||
    options.pattern === null ||
    typeof subject === 'number' ||
    typeof subject === 'boolean' ||
    (options.skip && options.skip.test(key))
  )
    return () => subject;

  const resolver = options.resolver || DEFAULT_RESOLVER;

  let last;
  const deps = dependencyMap[key] || (dependencyMap[key] = []);

  const check = (params) => {
    if (
      last === undefined ||
      deps.some(([dep, val]) => resolver(params, dep) !== val)
    ) {
      deps.splice(0, deps.length);
      return false;
    }
    return last;
  };

  if (typeof subject === 'string')
    return (params) =>
      check(params) ||
      interpolate(subject, params, options, (...arr) => {
        reducePatch(path, (key) => dependencyMap[key].push(...arr));
      });

  if (Array.isArray(subject)) {
    const arr = subject.map((m, i) =>
      interpolatable(m, options, dependencyMap, [...path, i]),
    );
    return (params) =>
      check(params) ||
      (last = arr.reduce((acc, m, i) => {
        const next = m(params);
        return next === acc[i] ? acc : [...acc, next];
      }, last || []));
  }

  const obj = Object.entries(subject).reduce(
    (acc, [k, v]) => ({
      ...acc,
      [k]: interpolatable(v, options, dependencyMap, [...path, k]),
    }),
    {},
  );

  return (params) =>
    check(params) ||
    (last = Object.entries(obj).reduce((acc, [k, v]) => {
      const next = v(params);
      return next === acc[k] ? acc : { ...acc, [k]: next };
    }, last || {}));
};

export default interpolatable;
