
export enum Status {
  Pendente = 'pendente',
  Aprovado = 'aprovado',
  Rejeitado = 'rejeitado',
}

export interface Profile {
  id: string;
  nome: string;
  email: string;
  status: Status;
  ra: string | null;
  foto_url: string;
  engajamento: number;
  notas_media: number;
  data_inscricao: string;
}

export interface Inscricao {
  id: string;
  created_at: string;
  nome: string;
  sobrenome: string;
  email: string;
  data_nascimento: string;
  telefone: string;
  rg: string;
  cpf: string;
  orgao_emissor: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  uf: string;
  nivel_escolaridade: string;
  nome_ultima_escola: string;
  tipo_escola: string;
  ano_conclusao_ensino_medio?: number;
  selfie_url: string;
  motivo_cursinho: string;
  status_analise: 'pendente' | 'aprovado' | 'rejeitado';
}

export interface Aluno {
  id: string;
  nome: string;
  email: string;
  ra: number;
  turma: string | null;
  ativo: boolean;
  foto_rosto_url: string | null;
}


export type Page = 'Dashboard' | 'Solicitações de Matrícula' | 'Alunos' | 'Professores' | 'Presença' | 'Configurações';