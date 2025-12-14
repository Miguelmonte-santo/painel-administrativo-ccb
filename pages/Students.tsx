
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Aluno } from '../types';
import { Search, UserCircle, Loader2, Edit, Trash2, ServerCrash } from 'lucide-react';

const Avatar: React.FC<{ src: string | null; alt: string }> = ({ src, alt }) => {
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(false);
    }, [src]);

    if (error || !src) {
        return (
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center flex-shrink-0">
                <UserCircle className="h-6 w-6 text-gray-500" />
            </div>
        );
    }

    return (
        <img
            className="h-10 w-10 rounded-full object-cover"
            src={src}
            alt={alt}
            onError={() => setError(true)}
        />
    );
};


const Students: React.FC = () => {
    const [students, setStudents] = useState<Aluno[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('alunos')
                    .select('id, nome, email, ra, turma, ativo, foto_rosto_url')
                    .order('nome', { ascending: true });

                if (error) throw error;
                setStudents(data || []);
            } catch (err: any) {
                setError(`Falha ao carregar os alunos: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = useMemo(() => {
        if (!searchTerm.trim()) return students;
        
        const lowercasedFilter = searchTerm.toLowerCase();
        
        return students.filter(student =>
            student.nome.toLowerCase().includes(lowercasedFilter) ||
            student.ra.toString().includes(lowercasedFilter)
        );
    }, [students, searchTerm]);

    const renderContent = () => {
        if (loading) {
            return <tr><td colSpan={5} className="text-center py-12"><div className="flex justify-center items-center text-gray-500 dark:text-gray-400"><Loader2 className="animate-spin mr-2" /> Carregando alunos...</div></td></tr>;
        }
        if (error) {
            return <tr><td colSpan={5} className="text-center py-12"><div className="flex flex-col justify-center items-center text-red-500"><ServerCrash className="mb-2" size={32} /> {error}</div></td></tr>;
        }
        if (filteredStudents.length === 0) {
            return <tr><td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">Nenhum aluno encontrado.</td></tr>;
        }
        return filteredStudents.map((student) => (
            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <Avatar src={student.foto_rosto_url} alt={student.nome} />
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.nome}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{student.email}</div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-mono">#{student.ra}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.turma || 'Não definida'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.ativo
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                        {student.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200 p-1"><Edit size={18} /></button>
                    <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-1"><Trash2 size={18} /></button>
                </td>
            </tr>
        ));
    };

    return (
        <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Alunos Matriculados</h2>
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nome ou RA..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-dark-700 dark:border-dark-600 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-dark-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aluno</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">RA</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Turma</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
                       {renderContent()}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Students;
