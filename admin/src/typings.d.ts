// Объявления типов для Material UI и других библиотек
declare module '@mui/material';
declare module '@mui/material/styles';
declare module '@mui/material/CssBaseline';
declare module '@mui/icons-material';
declare module '@mui/x-data-grid';

// Объявления типов для @mui/x-data-grid
declare module '@mui/x-data-grid' {
  interface GridColumnDef {
    field: string;
    headerName?: string;
    width?: number;
    editable?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    hide?: boolean;
    valueGetter?: any;
    valueFormatter?: any;
    renderCell?: any;
    renderHeader?: any;
    flex?: number;
    minWidth?: number;
    maxWidth?: number;
    align?: 'left' | 'right' | 'center';
    headerAlign?: 'left' | 'right' | 'center';
    [key: string]: any;
  }

  interface GridRenderCellParams<T = any> {
    id: string | number;
    field: string;
    row: T;
    value: any;
    api: any;
    formattedValue: any;
    colDef: GridColumnDef;
    [key: string]: any;
  }

  export interface DataGridProps {
    rows: any[];
    columns: GridColumnDef[];
    loading?: boolean;
    [key: string]: any;
  }

  export const DataGrid: React.FC<DataGridProps>;
  export type GridColDef = GridColumnDef;
  export type GridRenderCellParams<T = any> = GridRenderCellParams<T>;
}

// Объявления типов для React Router Dom
declare module 'react-router-dom' {
  export interface RouteProps {
    caseSensitive?: boolean;
    children?: React.ReactNode;
    element?: React.ReactNode | null;
    index?: boolean;
    path?: string;
  }

  export function Outlet(): JSX.Element;
  export function Routes(props: { children: React.ReactNode }): JSX.Element;
  export function Route(props: RouteProps): JSX.Element;
  export function Navigate(props: { to: string; replace?: boolean; state?: any }): JSX.Element;
  export function useNavigate(): (to: string, options?: { replace?: boolean; state?: any }) => void;
  export function useLocation(): { pathname: string; search: string; hash: string; state: any };
} 