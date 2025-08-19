export type Path = `/${string}`;

type ReadFrom<Path> = Path extends `${string}[${infer Rest}`
  ? ReadUntil<Rest>
  : [];

type ReadUntil<Path> = Path extends `${infer Match}]${infer Rest}`
  ? [Match, ...ReadFrom<Rest>]
  : [];

type RemovePrefixes<Key> = Key extends `[...${infer Name}`
  ? Name
  : Key extends `...${infer Name}`
    ? Name
    : Key;

export type StrictParams<Pathname> = Pathname extends `${string}[${string}`
  ? {
      [Key in ReadFrom<Pathname>[number] as RemovePrefixes<Key>]: Key extends `[...${string}`
        ? Array<string> | undefined
        : Key extends `...${string}`
          ? Array<string>
          : string;
    }
  : {};

type T = StrictParams<"/asdf/[xy]">;
