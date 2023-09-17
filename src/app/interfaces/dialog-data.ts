export interface DialogData {
  type: string;
  message?: string;
  player?: string;
  opponent?: string;
  buttons?: string[];
  btnCloseData?: any[];

  tileInfo?: any;

  bagLength?: number;

  notes?: string;
}
