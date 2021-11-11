import { get } from 'jsonpointer';
import expr from 'property-expr';
import interpolatable from './index';

describe('interpolatble memo', () => {
  it('should work with a string', () => {
    const subject = 'fred';
    const interpolate = interpolatable(subject);
    expect(interpolate({ firstName: 'fred' })).toBe(subject);
  });

  it('should not interpolate if pattern is null', () => {
    const subject = {
      a: [1, 2, '{{3}}'],
      b: [1, 2, 3],
      c: ['{{3}} foo'],
    };
    const interpolate = interpolatable(subject, { pattern: null });
    const result = interpolate({ '3': 'foo' });
    expect(result.a[2]).toBe('{{3}}');
  });

  it('should work with an object', () => {
    const subject = {
      a: [1, 2, '{{3}}'],
      b: [1, 2, 3],
      c: ['{{3}} foo'],
    };
    const interpolate = interpolatable(subject);
    const result = interpolate({ '3': 'foo' });
    expect(result.a[2]).toBe('foo');

    // 3 is still foo, dependencies did not change
    expect(interpolate({ '3': 'foo', 4: 'bar' })).toBe(result);

    // top level object changed
    expect(interpolate({ '3': 'joe', 4: 'bar' })).not.toBe(result);

    // sub object with no interpolations changed
    expect(interpolate({ '3': 'joe', 4: 'bar' }).b).toBe(result.b);
  });

  it('should accept a custom pattern', () => {
    const interpolate = interpolatable(
      {
        a: [1, 2, '<%= bar %> foo'],
      },
      {
        pattern: /<%=\s*(.+?)\s*%>/g,
      },
    );

    expect(interpolate({ bar: 'baz' })).toEqual({ a: [1, 2, 'baz foo'] });
  });

  it('should accept custom resolvers', () => {
    const context = { bar: { baz: 'qux' } };
    expect(
      interpolatable({ a: [1, 2, '{{/bar/baz}}'] }, { resolver: get })(context),
    ).toEqual({ a: [1, 2, 'qux'] });

    expect(
      interpolatable(
        { a: [1, 2, '{{bar.baz}}'] },
        { resolver: (c, s) => expr.getter(s)(c) },
      )(context),
    ).toEqual({ a: [1, 2, 'qux'] });
  });
});
