import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, TrendingDown, AlertCircle, CheckCircle, Search } from 'lucide-react';

interface AttendanceStat {
  studentId: string;
  studentName: string;
  totalPresencas: number;
  percentual: number;
  status: 'bom' | 'atencao' | 'critico';
}

interface DailyStat {
  date: string;
  totalPresentes: number;
}

const AttendanceReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState<AttendanceStat[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [totalAulas, setTotalAulas] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // 1. Buscar todas as presenças
      const { data: presencas, error } = await supabase
        .from('presencas') // Certifique-se de criar esta tabela
        .select(`
          data_aula,
          aluno_id,
          alunos ( nome )
        `)
        .order('data_aula', { ascending: true });

      if (error) throw error;
      if (!presencas) return;

      // 2. Calcular Total de Aulas (dias únicos registrados)
      const uniqueDates = [...new Set(presencas.map(p => p.data_aula))];
      setTotalAulas(uniqueDates.length);

      // 3. Processar Dados para o Gráfico (Evolução Temporal)
      const dailyMap = presencas.reduce((acc: any, curr) => {
        acc[curr.data_aula] = (acc[curr.data_aula] || 0) + 1;
        return acc;
      }, {});
      
      const chartData = Object.keys(dailyMap).map(date => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        totalPresentes: dailyMap[date]
      }));
      setDailyStats(chartData);

      // 4. Processar Dados por Aluno (Ranking)
      const studentMap: Record<string, { name: string, count: number }> = {};
      
      presencas.forEach((p: any) => {
        const sName = p.alunos?.nome || 'Desconhecido';
        if (!studentMap[p.aluno_id]) {
            studentMap[p.aluno_id] = { name: sName, count: 0 };
        }
        studentMap[p.aluno_id].count += 1;
      });

      const stats: AttendanceStat[] = Object.keys(studentMap).map(id => {
        const count = studentMap[id].count;
        // Evita divisão por zero
        const total = uniqueDates.length || 1; 
        const pct = Math.round((count / total) * 100);
        
        let status: 'bom' | 'atencao' | 'critico' = 'bom';
        if (pct < 50) status = 'critico';
        else if (pct < 75) status = 'atencao';

        return {
          studentId: id,
          studentName: studentMap[id].name,
          totalPresencas: count,
          percentual: pct,
          status
        };
      });

      // Ordenar por quem falta mais (Críticos primeiro)
      setStudentStats(stats.sort((a, b) => a.percentual - b.percentual));

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem local
  const filteredStudents = studentStats.filter(s => 
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Relatório de Frequência</h2>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow border-l-4 border-blue-500">
           <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">Aulas Ministradas</p>
                <h3 className="text-3xl font-bold dark:text-white">{totalAulas}</h3>
              </div>
              <Calendar className="text-blue-500 h-8 w-8" />
           </div>
        </div>
        <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow border-l-4 border-green-500">
           <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">Média de Presentes</p>
                <h3 className="text-3xl font-bold dark:text-white">
                  {dailyStats.length > 0 
                    ? Math.round(dailyStats.reduce((acc, curr) => acc + curr.totalPresentes, 0) / dailyStats.length) 
                    : 0}
                </h3>
              </div>
              <CheckCircle className="text-green-500 h-8 w-8" />
           </div>
        </div>
        <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow border-l-4 border-red-500">
           <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">Alunos em Risco (&lt;50%)</p>
                <h3 className="text-3xl font-bold dark:text-white">
                  {studentStats.filter(s => s.status === 'critico').length}
                </h3>
              </div>
              <AlertCircle className="text-red-500 h-8 w-8" />
           </div>
        </div>
      </div>

      {/* GRÁFICO MACRO: Evolução da Turma */}
      <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md h-80">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Evolução da Presença (Últimas Aulas)</h3>
        {loading ? <p>Carregando...</p> : (
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} 
                    itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="totalPresentes" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} name="Alunos Presentes" />
            </LineChart>
            </ResponsiveContainer>
        )}
      </div>

      {/* TABELA MICRO: Risco por Aluno */}
      <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Desempenho Individual</h3>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar aluno..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                />
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b dark:border-dark-700 text-gray-500 dark:text-gray-400 text-sm">
                        <th className="py-3 px-2">Aluno</th>
                        <th className="py-3 px-2 text-center">Aulas Presente</th>
                        <th className="py-3 px-2 w-1/3">Assiduidade</th>
                        <th className="py-3 px-2 text-right">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredStudents.map((stat) => (
                        <tr key={stat.studentId} className="border-b dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                            <td className="py-3 px-2 font-medium text-gray-800 dark:text-gray-200">{stat.studentName}</td>
                            <td className="py-3 px-2 text-center text-gray-600 dark:text-gray-400">
                                {stat.totalPresencas} <span className="text-xs text-gray-400">/ {totalAulas}</span>
                            </td>
                            <td className="py-3 px-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm w-8 dark:text-gray-300">{stat.percentual}%</span>
                                    <div className="flex-1 h-2 bg-gray-200 dark:bg-dark-900 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${
                                                stat.status === 'critico' ? 'bg-red-500' : 
                                                stat.status === 'atencao' ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}
                                            style={{ width: `${stat.percentual}%` }}
                                        />
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 px-2 text-right">
                                {stat.status === 'critico' && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-bold">CRÍTICO</span>}
                                {stat.status === 'atencao' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-bold">ATENÇÃO</span>}
                                {stat.status === 'bom' && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-bold">REGULAR</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;