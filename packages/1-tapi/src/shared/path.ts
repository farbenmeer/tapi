export type Path = `/${string}`;

type ReadFrom<Path> = Path extends `${string}*${infer Rest}`
  ? ReadWildcard<Rest>
  : Path extends `${string}:${infer Rest}`
  ? ReadUntil<Rest>
  : [];

type ReadWildcard<Path> = Path extends `${infer Match}/${infer Rest}`
  ? [`*${Match}`, ...ReadFrom<Rest>]
  : Path extends `${infer Match}`
  ? [`*${Match}`]
  : ["*"];

type ReadUntil<Path> = Path extends `${infer Match}/${infer Rest}`
  ? [Match, ...ReadFrom<Rest>]
  : Path extends `${infer Match}`
  ? [Match]
  : [];

type RemovePrefixes<Key> = Key extends `*${infer Name}` ? Name : Key;

export type StrictParams<Pathname> = Pathname extends
  | `${string}:${string}`
  | `${string}*${string}`
  ? {
      [Key in ReadFrom<Pathname>[number] as RemovePrefixes<Key>]: string;
    }
  : {};
