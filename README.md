# interpolatable

[![npm version](https://img.shields.io/npm/v/interpolatable)](https://npmjs.org/package/interpolatable)
[![Coverage Status](https://coveralls.io/repos/github/akmjenkins/interpolatabler/badge.svg)](https://coveralls.io/github/akmjenkins/interpolatable)
![Build Status](https://github.com/akmjenkins/interpolatable/actions/workflows/test.yaml/badge.svg)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/interpolatable)](https://bundlephobia.com/result?p=interpolatable)

A super tiny ( < 600 bytes minzipped) package that allows you to quickly (⚡) interpolate any values into any other value!

## Installation

```bash
npm install interpolatable
## or
yarn add interpolatable
```

Or directly via the browser:

```html
<script src="https://cdn.jsdelivr.net/npm/interpolatable"></script>
<script>
  const descriptor = 'Hello {{user}}!';
  const interpolate = interpolatable(descriptor);
  const interpolated = interpolate({ user: 'Joe' });
  // Hello Joe!
</script>
```

## Usage

```js
import interpolatable from 'interpolatable';

const interpolate = interpolatable({
  weather: {
    params: {
      query: '{{city}}',
      appId: '{{apiKey}}',
      units: '{{units}}',
    },
    path: 'main.temp',
    is: {
      type: 'number',
      minimum: '{{hotTemp}}',
    },
  },
});

const result = interpolate({
  city: 'Halifax',
  apiKey: 'XXX',
  units: 'metric',
  minimum: 20,
});

/*
{
  weather: {
    params: {
      query: 'Halifax',
      appId: 'XXX',
      units: 'metric',
    },
    path: 'main.temp',
    is: {
      type: 'number',
      minimum: 20,
    },
  },
}
*/
```

## What in the heck is this good for?

Two things:

1. Interpolating complex objects
2. Doing 1 fast ⚡ (while maintaining referential integrity)

## Referential Integrity

The "dependencies" of some nested structure to be interpolated are, in the below descriptor, defined by strings like: `{{city}}`

```js
const descriptor = {
  weather: {
    params: {
      query: '{{city}}',
      appId: '{{apiKey}}',
      units: '{{units}}',
    },
    path: 'main.temp',
    is: {
      type: 'number',
      minimum: '{{hotTemp}}',
    },
  },
};
```

Rather than parse the entire structure every time it needs to be interpolated, which is expensive, we check at each node to see if the dependencies of that node (if there are any) have changed since the last run. If they haven't, then we return the last object and we can skip the expensive parsing operation.

The dependencies of the root node are: `city`, `apiKey`, `units`, and `hotTemp`. But if only `hotTemp` changes between interpolations, we don't need to re-evaluate `weather.params` because it's dependencies - `city`, `apiKey`, and `units` haven't changed. So:

```js
const interpolate = interpolatable(descriptor);

const first = interpolate({
  city: 'Halifax',
  apiKey: 'XXX',
  units: 'metric',
  minimum: 20,
});

const second = interpolate({
  city: 'Halifax',
  apiKey: 'XXX',
  units: 'metric',
  minimum: 25,
});

console.log(first === second); // false
console.log(first.weather.params === second.weather.params); // same object! dependencies didn't change between runs
```

## API

```ts
function interpolatable<T = string | Record<string, unknown> | unknown[]>(
  subject: T,
  options?: Options<R>,
): <R>(context: R) => T;

type Options<R> = {
  pattern?: RegExp | null;
  resolver?: Resolver<R>;
};

type Resolver<R = unknown> = (context: R, subject: string) => unknown;
```

Pass a subject (any interpolatable string, object, or array) to the default export, and optionally [options](#options) and it returns an interpolation function which accepts a data source to interpolate from.

### Options

#### `pattern: RegExp = /\{\{\s*(.+?)\s*\}\}/g`

The default interpolation pattern is a RegExp that matches a string between `{{ }}` - `some_string` in `{{some_string}}`. You can pass in a custom pattern if you like:

```js
const interpolate = interpolatable(
  {
    foo: '<%= bar %> qux',
  },
  {
    pattern: /<%=\s*(.+?)\s*%>/g,
  },
);

const result = interpolate({ bar: 'baz' });
/*
 { foo: 'baz qux' }
*/
```

**Note:** `pattern` can also be `null`. If pattern is passed as `null`, `interpolatable` will return a function that always returns your unaltered subject.

#### `resolver: (context: R, subject: string) => unknown`

A resolver is a function that accepts a context and interpolated string and synchronously returns **any value**, it doesn't have to be a primitive.

The default resolver returns the value from the context indexed by the string:

```js
const DEFAULT_RESOLVER = (c, k) => c[k];
```

Other good resolvers are [lodash's get](https://lodash.com/docs/4.17.15#get) or [property-expr](https://github.com/jquense/expr), or [jsonpointer](https://www.npmjs.com/package/jsonpointer).

```js
import expr from 'property-expr';

const interpolate = interpolatable(
  {
    foo: '{{bar.baz}}',
  },
  {
    resolver: (context, subject) => expr.getter(subject)(context),
  },
);

const result = interpolate({
  bar: {
    baz: 'qux',
  },
});

/*
 { foo: 'qux' }
*/
```

```js
import { get } from 'json-pointer';

const interpolate = interpolatable(
  {
    foo: '{{/bar/baz}}',
  },
  {
    resolver: get,
  },
);

const result = interpolate({
  bar: {
    baz: 'qux',
  },
});

/*
 { foo: 'qux' }
*/
```

## Other Cool Stuff

Check out [json-schema-rules-engine](https://github.com/akmjenkins/json-schema-rules-engine) or [json-modifiable](https://github.com/akmjenkins/json-modifiable) for a more practical application.

## License

[MIT](./LICENSE)

## Contributing

PRs welcome!
