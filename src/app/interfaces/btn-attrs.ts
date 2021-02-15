export interface BagBtn {
  numTiles: number;
}

export interface ScoresBtn {
  player: number;
  rival: number;
}

export interface SwapRecall {
  text: string;
  icon: { isUndo: boolean };
}

export interface PassPlay {
  text: string;
  icon: string;
  bgColor: string;
}

export interface ZoomBtn {
  isIn: boolean;
}

export interface BtnAttrs {
  bagBtn: BagBtn;
  scoresBtn: ScoresBtn;
  swapRecall: SwapRecall;
  passPlay: PassPlay;
  zoomBtn: ZoomBtn;
}
