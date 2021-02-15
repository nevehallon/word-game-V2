export interface Score {
  computerScore?: number | string;
  playerScore?: number | string;
}

export interface HistoryEntry {
  isAI?: boolean;
  word?: string;
  definitions?: DefinitionElement[];
  points?: number | string;
  score?: Score;
  skip?:
    | boolean
    | {
        isSwap?: boolean;
      };
}

export interface Definition {
  id: number;
  dic: number;
  part: string;
  txt: string;
  ex: string[];
  upvotes: number;
  downvotes: number;
}

export interface Source {
  default: number[];
  active: any[];
}

export interface Po {
  default: string[];
  active: any[];
}

export interface Category {
  default: string[];
  active: any[];
}

export interface Origin {
  txt: string;
  link: string[];
}

export interface DefinitionElement {
  headword: string;
  definitions: Definition[];
  pronunciation: string;
  origin: Origin;
  success: boolean;
}
