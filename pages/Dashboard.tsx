
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Aluno } from '../types';
import { Users, BarChart2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string; loading: boolean }> = ({ title, value, icon: Icon, color, loading }) => (
  <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-md flex items-center">
    <div className={`p-3 rounded-full mr-4 ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      {loading ? (
        <div className="h-9 w-20 bg-gray-200 dark:bg-dark-700 rounded animate-pulse mt-1"></div>
      ) : (
        <p className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mt-1">{value}</p>
      )}
    </div>
  </div>
);

const SubjectsProgressChart: React.FC<{data: any[]}> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
        <XAxis dataKey="name" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
        <Legend />
        <Bar dataKey="progresso" fill="#0ea5e9" name="Progresso (%)" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const AttentionListItem: React.FC<{ student: Aluno }> = ({ student }) => (
  <li className="flex items-center justify-between py-3">
    <div className="flex items-center">
      {student.foto_rosto_url ? (
        <img className="h-10 w-10 rounded-full object-cover" src={student.foto_rosto_url} alt={student.nome} />
      ) : (
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center">
          <Users className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <div className="ml-4">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{student.nome}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{student.email}</p>
      </div>
    </div>
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
      <AlertTriangle className="h-3 w-3 mr-1" />
      Baixo Rendimento
    </span>
  </li>
);

const AttentionListItemSkeleton: React.FC = () => (
    <li className="flex items-center justify-between py-3">
        <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-dark-700 animate-pulse"></div>
            <div className="ml-4 space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-dark-700 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-gray-200 dark:bg-dark-700 rounded animate-pulse"></div>
            </div>
        </div>
        <div className="h-6 w-32 bg-gray-200 dark:bg-dark-700 rounded-full animate-pulse"></div>
    </li>
);


const Dashboard: React.FC = () => {
    const [totalAlunos, setTotalAlunos] = useState(0);
    const [completionRate, setCompletionRate] = useState(0);
    const [averageEngagement, setAverageEngagement] = useState(0);
    const [attentionStudents, setAttentionStudents] = useState<Aluno[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const { count, error } = await supabase
                    .from('alunos')
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    throw error;
                }
                
                setTotalAlunos(count || 0);

                // TODO: Implementar lógica para buscar dados de conclusão, engajamento e alunos que precisam de atenção.
                // Por enquanto, os valores serão mantidos como 0 e a lista vazia.
                setCompletionRate(0);
                setAverageEngagement(0);
                setAttentionStudents([]);
                setChartData([]);

            } catch (error) {
                console.error("Falha ao buscar dados para o dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="Total de Alunos" value={String(totalAlunos)} icon={Users} color="bg-blue-500" loading={loading} />
                <KpiCard title="Taxa de Conclusão" value={`${completionRate}%`} icon={BarChart2} color="bg-green-500" loading={loading} />
                <KpiCard title="Engajamento Médio" value={`${averageEngagement}%`} icon={TrendingUp} color="bg-yellow-500" loading={loading} />
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                     <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md h-96">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Progresso por Matérias</h3>
                         {loading ? (
                           <div className="flex items-center justify-center h-[calc(100%-2rem)]">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                           </div>
                        ) : chartData.length > 0 ? (
                           <SubjectsProgressChart data={chartData} />
                        ) : (
                           <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)] text-gray-500 dark:text-gray-400">
                                <BarChart2 size={40} className="mb-4" />
                                <p>Aguardando dados para gerar gráficos.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Alunos Precisando de Atenção</h3>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <>
                                <AttentionListItemSkeleton />
                                <AttentionListItemSkeleton />
                                <AttentionListItemSkeleton />
                            </>
                        ) : attentionStudents.length > 0 ? (
                             attentionStudents.map(student => <AttentionListItem key={student.id} student={student} />)
                        ) : (
                            <li className="flex flex-col items-center justify-center py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                <CheckCircle size={32} className="mb-3 text-green-500" />
                                <span>Nenhum aluno precisa de atenção no momento.</span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
