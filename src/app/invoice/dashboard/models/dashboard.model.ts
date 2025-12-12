export interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderWidth?: number;
}

export interface ChartDataModel {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartOptionsModel {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: any;
  scales?: any;
}
