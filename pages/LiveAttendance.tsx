import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import QRCode from 'react-qr-code';
import { Loader2 } from 'lucide-react';

const LiveAttendance: React.FC = () => {
  const [currentToken, setCurrentToken] = useState<string>('');
  const [qrValue, setQrValue] = useState<string>('');
  
  // 7200 segundos = 2 horas
  const TOKEN_DURATION_SECONDS = 7200; 
  const [timeLeft, setTimeLeft] = useState(TOKEN_DURATION_SECONDS);

  // URL FIXA da sua plataforma (produção)
  const STUDENT_PORTAL_URL = 'https://plataforma-de-estudos-final-wqst.vercel.app';

  // Função que busca token ativo ou gera novo
  const fetchOrGenerateToken = async () => {
    try {
      // 1. Procura no banco se tem algum token que AINDA VAI expirar
      const { data, error } = await supabase
        .from('tokens_presenca')
        .select('*')
        .gt('expires_at', new Date().toISOString()) // Data expiração > Agora
        .order('created_at', { ascending: false }) // Pega o mais recente
        .limit(1)
        .single();

      if (data && !error) {
        // ACHOU! Reutiliza o mesmo token (Sincronização)
        console.log("Token ativo encontrado, reutilizando:", data.token);
        setupTokenOnScreen(data.token, data.expires_at);
      } else {
        // NÃO ACHOU (ou expirou): Gera um novo
        console.log("Nenhum token ativo, gerando novo...");
        await generateNewToken();
      }
    } catch (err) {
      // Se der erro na busca (tabela vazia), gera novo
      await generateNewToken();
    }
  };

  const generateNewToken = async () => {
    try {
      const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      
      const expiresAt = new Date();
      // Adiciona duração + 10s de gordura
      expiresAt.setSeconds(expiresAt.getSeconds() + TOKEN_DURATION_SECONDS + 10);

      await supabase.from('tokens_presenca').insert({
        token: token,
        expires_at: expiresAt.toISOString()
      });

      setupTokenOnScreen(token, expiresAt.toISOString());
    } catch (err) {
      console.error("Erro ao gerar token:", err);
    }
  };

  const setupTokenOnScreen = (token: string, expiresAtIso: string) => {
    setCurrentToken(token);
    setQrValue(`${STUDENT_PORTAL_URL}/presenca?t=${token}`);
    
    // Calcula quanto tempo falta para o timer visual
    const expires = new Date(expiresAtIso).getTime();
    const now = new Date().getTime();
    const secondsLeft = Math.floor((expires - now) / 1000);
    
    setTimeLeft(secondsLeft > 0 ? secondsLeft : 0);
  };

  // Inicialização e Loop de Verificação
  useEffect(() => {
    fetchOrGenerateToken(); // Roda ao abrir a tela

    // Verifica a cada 1 minuto se precisa renovar
    const heartbeat = setInterval(() => {
        if (timeLeft <= 10) { // Se faltar pouco tempo, busca/gera outro
            fetchOrGenerateToken();
        }
    }, 60000);

    // Timer visual (contagem regressiva)
    const countdown = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
        clearInterval(heartbeat);
        clearInterval(countdown);
    };
  }, [timeLeft]); // Dependência do timeLeft para o heartbeat saber o valor atual

  // Formata o tempo para MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-100 dark:bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Chamada Inteligente</h1>
      <p className="text-gray-500 mb-8">Escaneie o QR Code para registrar presença.</p>

      <div className="bg-white p-6 rounded-xl shadow-2xl border-4 border-indigo-500 relative">
        {qrValue ? (
            <div style={{ height: "auto", margin: "0 auto", maxWidth: 256, width: "100%" }}>
                <QRCode
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={qrValue}
                viewBox={`0 0 256 256`}
                />
            </div>
        ) : (
            <div className="w-64 h-64 flex items-center justify-center">
                <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
            </div>
        )}
        
        <div className="absolute -top-3 -right-3 bg-red-500 text-white font-bold px-3 py-1 rounded-full flex items-center justify-center shadow-lg text-sm">
            {formatTime(timeLeft)}
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-400 font-mono">
        Token Atual: {currentToken || 'Carregando...'}
      </p>
      <p className="text-xs text-gray-400 mt-2">
        O código é válido por 2 horas.
      </p>
    </div>
  );
};

export default LiveAttendance;