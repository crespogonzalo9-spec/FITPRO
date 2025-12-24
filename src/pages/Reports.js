// Reports.js
import React from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Download } from 'lucide-react';
import { Card, Button, StatCard } from '../components/Common';
import { formatCurrency } from '../utils/helpers';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const chartData = [
    { month: 'Jul', ingresos: 380000, miembros: 120 },
    { month: 'Ago', ingresos: 420000, miembros: 135 },
    { month: 'Sep', ingresos: 450000, miembros: 142 },
    { month: 'Oct', ingresos: 480000, miembros: 148 },
    { month: 'Nov', ingresos: 510000, miembros: 155 },
    { month: 'Dic', ingresos: 485000, miembros: 156 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-gray-400">Análisis y estadísticas del gimnasio</p>
        </div>
        <Button variant="secondary" icon={Download}>Exportar</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Ingresos Totales" value={formatCurrency(2725000)} change="+12%" changeType="positive" color="emerald" />
        <StatCard icon={Users} label="Miembros Activos" value="156" change="+8%" changeType="positive" color="blue" />
        <StatCard icon={TrendingUp} label="Tasa Retención" value="87%" color="purple" />
        <StatCard icon={BarChart3} label="Promedio Asistencia" value="68%" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4">Ingresos Mensuales</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }} formatter={(v) => formatCurrency(v)} />
                <Area type="monotone" dataKey="ingresos" stroke="#10B981" fill="url(#colorIngresos)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Evolución de Miembros</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }} />
                <Bar dataKey="miembros" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
