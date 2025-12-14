import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, Mail, CheckCircle, AlertTriangle } from 'lucide-react';

const StudentRegistration: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isEmailFromUrl, setIsEmailFromUrl] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailFromUrl = params.get('email');
    if (emailFromUrl) {
      setEmail(emailFromUrl);
      setIsEmailFromUrl(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    
    if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        return;
    }
    
    setLoading(true);

    try {
      // 1. Buscar os dados completos que a secretaria aprovou na tabela 'alunos'
      const { data: studentData, error: selectError } = await supabase
        .from('alunos')
        .select('*')
        .eq('email', email)
        .single();
        
      if (selectError || !studentData) {
        setError('Matrícula não encontrada. Verifique se o email está correto ou contate a administração.');
        setLoading(false);
        return;
      }
      
      // 2. Buscar dados adicionais de endereço na tabela original de 'inscricoes'
      const { data: inscricaoData } = await supabase
        .from('inscricoes')
        .select('telefone, data_nascimento, rg, cep, rua, numero, complemento, bairro, municipio, uf')
        .eq('id', studentData.inscricao_origem_id)
        .single();

      // 3. Criar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: studentData.nome,
            ra: studentData.ra
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 4. A MÁGICA: Copiar os dados para a tabela 'profiles'
        
        // Separa Nome e Sobrenome
        const partesNome = studentData.nome.split(' ');
        const primeiroNome = partesNome[0];
        const restanteSobrenome = partesNome.slice(1).join(' ');

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            nome: primeiroNome,
            sobrenome: restanteSobrenome,
            ra: studentData.ra,
            cpf: studentData.cpf,
            // A foto da biometria vira o avatar inicial
            avatar_url: studentData.foto_rosto_url, 
            // Dados vindos da inscrição
            telefone: inscricaoData?.telefone,
            data_nascimento: inscricaoData?.data_nascimento,
            rg: inscricaoData?.rg,
            cep: inscricaoData?.cep,
            rua: inscricaoData?.rua,
            numero: inscricaoData?.numero,
            complemento: inscricaoData?.complemento,
            bairro: inscricaoData?.bairro,
            municipio: inscricaoData?.municipio,
            uf: inscricaoData?.uf
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Erro ao atualizar perfil:', profileError);
        }
      }

      setSuccessMessage('Cadastro realizado com sucesso! Agora você pode acessar o Portal do Aluno.');

    } catch (err: any) {
      if (err.message.includes('User already registered')) {
         setError('Este email já foi cadastrado. Tente fazer login no portal.');
      } else {
         setError(`Ocorreu um erro: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-dark-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadastro de Aluno</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Defina sua senha para acessar o portal</p>
        </div>

        {!successMessage ? (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isEmailFromUrl || loading}
                  className="block w-full px-10 py-3 text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white sm:text-sm disabled:opacity-70"
                  placeholder="Seu email de inscrição"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full px-10 py-3 text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white sm:text-sm"
                  placeholder="Crie uma senha"
                />
              </div>
               <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full px-10 py-3 text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white sm:text-sm"
                  placeholder="Confirme sua senha"
                />
              </div>

              {error && (
                <div className="flex items-start text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400"
              >
                {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
              </button>
            </form>
        ) : (
            <div className="text-center py-4">
                 <div className="flex items-center justify-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-md mb-4">
                    <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0" />
                    <p className="text-sm font-medium">{successMessage}</p>
                </div>
                <a href="https://seu-portal-do-aluno.vercel.app" className="text-primary-600 hover:text-primary-500 font-medium underline">
                  Ir para o Login do Portal
                </a>
            </div>
        )}
      </div>
    </div>
  );
};

export default StudentRegistration;