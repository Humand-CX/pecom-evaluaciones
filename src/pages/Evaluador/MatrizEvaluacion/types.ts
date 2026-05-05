export type Person = {
  id: string;
  name: string;
  legajo: string;
};

export type SubDimension = {
  id: string;
  name: string;
};

export type Dimension = {
  id: string;
  name: string;
  subDimensions: SubDimension[];
};

export type ScoreValue = 1 | 2 | 3 | 4 | 5;

export type ScoreMatrix = Record<string, Record<string, ScoreValue | null>>;
