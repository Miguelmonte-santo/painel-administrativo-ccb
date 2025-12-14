
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Inscricao } from '../types';
import Modal from '../components/ui/Modal';
import { FileSearch, Loader2, ImageOff } from 'lucide-react';
import emailjs from 'emailjs-com';

// --- Chaves do EmailJS ---
const EMAILJS_SERVICE_ID = 'service_it6uqfh';
const EMAILJS_TEMPLATE_ID = 'template_d9a60bc';
const EMAILJS_PUBLIC_KEY = 'BrvhPBt2CIVA7_fxO';
// -------------------------

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
    <p className="text-sm text-gray-800 dark:text-gray-200">{value || 'Não informado'}</p>
  </div>
);

const EnrollmentRequests: React.FC = () => {
  const [requests, setRequests] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Inscricao | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('inscricoes')
        .select('*')
        .eq('status_analise', 'pendente')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (err: any) {
      setError(`Falha ao carregar as solicitações: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenDetailsModal = (request: Inscricao) => {
    setSelectedRequest(request);
    setDetailsModalOpen(true);
    setModalError(null);
    setImageError(false);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setDetailsModalOpen(false);
    setIsSubmitting(false);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    setModalError(null);

    try {
      // 1. Gerar um RA único
      let uniqueRA = '';
      const year = new Date().getFullYear();
      
      while (true) {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const candidateRA = `${randomDigits}${year}`;

        const { data: existingStudent, error: checkError } = await supabase
            .from('alunos')
            .select('id')
            .eq('ra', candidateRA)
            .maybeSingle();

        if (checkError) {
            throw new Error(`Falha ao verificar unicidade do RA: ${checkError.message}`);
        }

        if (!existingStudent) {
            uniqueRA = candidateRA;
            break; // Encontrou um RA único, sai do loop
        }
        // Se o aluno existir, o loop continua para gerar um novo RA
      }

      // 2. Inserir na tabela 'alunos' com o RA único garantido
      const { error: insertError } = await supabase
        .from('alunos')
        .insert({
          ra: uniqueRA,
          nome: `${selectedRequest.nome} ${selectedRequest.sobrenome}`,
          email: selectedRequest.email,
          cpf: selectedRequest.cpf,
          foto_rosto_url: selectedRequest.selfie_url,
          inscricao_origem_id: selectedRequest.id,
        });
      
      if (insertError) throw insertError;

      // 3. Atualizar status na tabela 'inscricoes'
      const { error: updateError } = await supabase
        .from('inscricoes')
        .update({ status_analise: 'aprovado' })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;
      
      // 4. Enviar email de convite com EmailJS
      try {
          const templateParams = {
              nome: selectedRequest.nome,
              email: selectedRequest.email,
              ra: uniqueRA,
          };
          await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
          alert('Aluno aprovado e convite enviado por email!');
      } catch (emailError) {
          console.error("Falha ao enviar o email:", emailError);
          alert('Aluno aprovado, mas falha ao enviar o email de convite. Verifique o console.');
      }

      setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      handleCloseModal();

    } catch (err: any) {
      if (err.message.includes('duplicate key value violates unique constraint')) {
         setModalError('Ocorreu um erro de conflito de dados (RA ou email duplicado). Tente aprovar novamente.');
      } else {
         setModalError(`Erro ao aprovar: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const { error } = await supabase
        .from('inscricoes')
        .update({ status_analise: 'rejeitado' })
        .eq('id', selectedRequest.id);

      if (error) throw error;
      
      alert('Inscrição rejeitada com sucesso.');
      setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      handleCloseModal();

    } catch (err: any) {
      setModalError(`Erro ao rejeitar: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Solicitações de Matrícula</h2>
      {error && <div className="text-red-500 mb-4 p-3 bg-red-100 dark:bg-red-900/20 rounded-md">{error}</div>}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-dark-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome Completo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data de Inscrição</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Município/UF</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8"><div className="flex justify-center items-center"><Loader2 className="animate-spin mr-2" /> Carregando...</div></td></tr>
            ) : requests.length === 0 ? (
               <tr><td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">Nenhuma solicitação de matrícula pendente.</td></tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{`${request.nome} ${request.sobrenome}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{request.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(request.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{`${request.municipio}/${request.uf}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenDetailsModal(request)} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-900/50 dark:text-primary-300 dark:hover:bg-primary-900">
                      <FileSearch size={16} className="mr-2"/>
                      Analisar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isDetailsModalOpen} onClose={handleCloseModal} title="Analisar Solicitação de Matrícula" maxWidth="4xl">
        {selectedRequest && (
          <div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3 flex-shrink-0">
                <div className="relative w-full aspect-square md:aspect-[3/4] bg-gray-100 dark:bg-dark-700 rounded-lg overflow-hidden">
                  {imageError || !selectedRequest.selfie_url ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <ImageOff size={48} />
                      <span className="mt-2 text-sm">Imagem indisponível</span>
                    </div>
                  ) : (
                    <img 
                      src={selectedRequest.selfie_url} 
                      alt="Selfie do candidato" 
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  )}
                </div>
              </div>

              <div className="flex-grow md:w-2/3">
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">{`${selectedRequest.nome} ${selectedRequest.sobrenome}`}</h4>
                
                {modalError && <div className="mt-4 text-red-500 text-sm p-3 bg-red-100 dark:bg-red-900/20 rounded-md">{modalError}</div>}

                <div className="mt-4 space-y-6 max-h-[50vh] overflow-y-auto pr-4 -mr-2">
                  <div>
                    <h5 className="font-semibold border-b border-gray-200 dark:border-gray-600 pb-2 mb-3 text-gray-800 dark:text-gray-200">Dados Pessoais</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <DetailItem label="Email" value={selectedRequest.email} />
                      <DetailItem label="Telefone" value={selectedRequest.telefone} />
                      <DetailItem label="Data de Nascimento" value={new Date(selectedRequest.data_nascimento).toLocaleDateString('pt-BR')} />
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold border-b border-gray-200 dark:border-gray-600 pb-2 mb-3 text-gray-800 dark:text-gray-200">Documentos</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                       <DetailItem label="CPF" value={selectedRequest.cpf} />
                       <DetailItem label="RG" value={`${selectedRequest.rg} (${selectedRequest.orgao_emissor})`} />
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold border-b border-gray-200 dark:border-gray-600 pb-2 mb-3 text-gray-800 dark:text-gray-200">Endereço</h5>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <DetailItem label="CEP" value={selectedRequest.cep} />
                      <DetailItem label="Endereço" value={`${selectedRequest.rua}, ${selectedRequest.numero}`} />
                      <DetailItem label="Complemento" value={selectedRequest.complemento} />
                      <DetailItem label="Bairro" value={selectedRequest.bairro} />
                      <DetailItem label="Cidade/UF" value={`${selectedRequest.municipio}/${selectedRequest.uf}`} />
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold border-b border-gray-200 dark:border-gray-600 pb-2 mb-3 text-gray-800 dark:text-gray-200">Escolaridade</h5>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <DetailItem label="Nível" value={selectedRequest.nivel_escolaridade} />
                      <DetailItem label="Tipo de Escola" value={selectedRequest.tipo_escola} />
                       <DetailItem label="Última Escola" value={selectedRequest.nome_ultima_escola} />
{/* FIX: Corrected a typo from `selected-request` to `selectedRequest` to correctly access the object property. */}
                      <DetailItem label="Ano de Conclusão (EM)" value={selectedRequest.ano_conclusao_ensino_medio} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button onClick={handleReject} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-wait">
                {isSubmitting ? 'Rejeitando...' : 'Rejeitar'}
              </button>
              <button onClick={handleApprove} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-wait">
                {isSubmitting ? 'Aprovando...' : 'Aprovar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnrollmentRequests;
