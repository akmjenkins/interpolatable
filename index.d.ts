type Dependencies = Array<[string, unknown]>;
type Resolver<R = unknown> = (context: R, subject: string) => unknown;
type Options<R> = {
  pattern?: RegExp | null;
  resolver?: Resolver<R>;
};

declare function interpolatable<
  T = string | Record<string, unknown> | unknown[],
>(subject: T, options?: Options<R>): <R>(context: R) => T;

export default interpolatable;
