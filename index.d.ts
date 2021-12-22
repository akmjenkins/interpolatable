type Dependencies = Array<[string, unknown]>;
type Resolver<R = unknown> = (context: R, subject: string) => unknown;
type Options<R> = {
  pattern?: RegExp;
  resolver?: Resolver<R>;
  skip?: RegExp;
  delimiter?: string;
};

declare function interpolatable<
  T = string | Record<string, unknown> | unknown[],
>(subject: T, options?: Options<R>): <R>(context: R) => T;

export default interpolatable;
