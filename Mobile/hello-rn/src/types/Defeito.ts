export interface Defeito {
  _id?: string;
  titulo: string;
  descricao: string;
  local: string;
  laboratorio: string;
  foto?: string | null;
  data?: string;
}