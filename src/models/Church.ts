export interface IChurch {
  id: string;
  name: string;
}

export interface IPrinters {
  id: string;
  name: string;
}

export interface IChurches {
  data: IChurch[];
  current?: IChurch;
  printers: IPrinters[];
  currentPrinter?: IPrinters;
  error?: string;
  loading: boolean;
}
