import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import QRCode from 'react-qr-code';
import { Loader2 } from 'lucide-react';

const LiveAttendance: React.FC = () => {
  const [currentToken, setCurrentToken] = useState<string>('');
  const [qrValue, setQrValue] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(15); // Troca a cada 15s

  // Função que gera o token no banco
  const generateToken = async () => {
    try {
      // Gera string aleatória
      const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      
      // Salva no banco com validade curta (ex: 30 segundos de tolerância)
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 30);

      await supabase.from('tokens_presenca').insert({
        token: token,
        expires_at: expiresAt.toISOString()
      });

      setCurrentToken(token);
      
      // URL que o aluno vai abrir (Dinâmica baseada no ambiente)
      // FIX: Type casting import.meta to allow env property access if vite types are missing
      const studentPortalUrl = (import.meta as any).env.VITE_STUDENT_PORTAL_URL || 'http://localhost:5173';
      setQrValue(`${studentPortalUrl}/presenca?t=${token}`);
      
      setTimeLeft(15);

    } catch (err) {
      console.error("Erro ao gerar token:", err);
    }
  };

  // Loop Infinito (Heartbeat)
  useEffect(() => {
    generateToken(); // Gera o primeiro

    const interval = setInterval(() => {
      generateToken();
    }, 15000); // 15 segundos

    const countdown = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
        clearInterval(interval);
        clearInterval(countdown);
    };
  }, []);

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
        
        <div className="absolute -top-3 -right-3 bg-red-500 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
            {timeLeft}
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-400 font-mono">
        Token Atual: {currentToken || 'Gerando...'}
      </p>
      <p className="text-xs text-gray-400 mt-2">
        O código expira automaticamente para evitar fraudes.
      </p>
    </div>
  );
};

export default LiveAttendance;