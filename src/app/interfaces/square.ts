export interface Square {
  data: {
    content?: {
      letter?: string;
      points?: number;
    };
    id?: string;
    class?: string[];
    'data-drag'?: number;
    coords?: number[];
  }[];
}
