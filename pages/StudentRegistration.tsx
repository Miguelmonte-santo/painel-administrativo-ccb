
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
      // 1. Verificar se o email existe na lista de alunos aprovados (allowlist)
      const { data: student, error: selectError } = await supabase
        .from('alunos')
        .select('id')
        .eq('email', email)
        .single();
        
      if (selectError || !student) {
        setError('Matrícula não encontrada. Verifique se o email está correto ou contate a administração.');
        setLoading(false);
        return;
      }
      
      // 2. Se o email for válido, criar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        throw authError;
      }

      setSuccessMessage('Cadastro realizado com sucesso! Verifique sua caixa de entrada para confirmar seu email.');

    } catch (err: any) {
      if (err.message.includes('User already registered')) {
         setError('Este email já foi cadastrado. Tente fazer login ou redefinir sua senha.');
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
          <p className="mt-2 text-gray-600 dark:text-gray-400">Crie sua senha de acesso à plataforma</p>
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
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isEmailFromUrl || loading}
                  className="block w-full px-10 py-3 text-gray-900 placeholder-gray-500 bg-gray-100 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 dark:bg-dark-700 dark:border-dark-600 dark:text-white dark:placeholder-gray-400 sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
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
                  className="block w-full px-10 py-3 text-gray-900 placeholder-gray-500 bg-gray-100 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 dark:bg-dark-700 dark:border-dark-600 dark:text-white dark:placeholder-gray-400 sm:text-sm"
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
                  className="block w-full px-10 py-3 text-gray-900 placeholder-gray-500 bg-gray-100 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 dark:bg-dark-700 dark:border-dark-600 dark:text-white dark:placeholder-gray-400 sm:text-sm"
                  placeholder="Confirme sua senha"
                />
              </div>

              {error && (
                <div className="flex items-start text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{error}</p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md group hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
                </button>
              </div>
            </form>
        ) : (
            <div className="text-center py-4">
                 <div className="flex items-center justify-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                    <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0" />
                    <p className="text-sm font-medium">{successMessage}</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default StudentRegistration;
