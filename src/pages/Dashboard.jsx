import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Building2,
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Package
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import ChartCard from '@/components/dashboard/ChartCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuickActions from '@/components/dashboard/QuickActions';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from '@/components/common/StatusBadge';

export default function Dashboard() {
  const { data: residents = [] } = useQuery({
    queryKey: ['residents'],
    queryFn: () => base44.entities.Resident.list(),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list(),
  });

  const { data: occurrences = [] } = useQuery({
    queryKey: ['occurrences'],
    queryFn: () => base44.entities.Occurrence.list('-created_date', 50),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.FinancialTransaction.list('-created_date', 100),
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list('-created_date', 20),
  });

  const { data: visitors = [] } = useQuery({
    queryKey: ['visitors'],
    queryFn: () => base44.entities.Visitor.list('-entry_date', 10),
  });

  // Calculate stats
  const activeResidents = residents.filter(r => r.is_active !== false).length;
  const openOccurrences = occurrences.filter(o => o.status === 'open' || o.status === 'in_progress').length;
  const overduePayments = transactions.filter(t => t.type === 'income' && t.status === 'overdue').length;
  const pendingReservations = reservations.filter(r => r.status === 'pending').length;

  // Calculate financial totals
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'paid' && t.reference_month === currentMonth)
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && t.reference_month === currentMonth)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Chart data
  const monthlyData = [
    { name: 'Jan', receitas: 45000, despesas: 32000 },
    { name: 'Fev', receitas: 48000, despesas: 35000 },
    { name: 'Mar', receitas: 47000, despesas: 31000 },
    { name: 'Abr', receitas: 50000, despesas: 38000 },
    { name: 'Mai', receitas: 49000, despesas: 34000 },
    { name: 'Jun', receitas: 52000, despesas: 36000 },
  ];

  const expensesByCategory = [
    { name: 'Pessoal', value: 12000 },
    { name: 'Manutenção', value: 8000 },
    { name: 'Limpeza', value: 5000 },
    { name: 'Energia', value: 4000 },
    { name: 'Outros', value: 3000 },
  ];

  // Recent activities
  const recentActivities = [
    ...occurrences.slice(0, 3).map(o => ({
      type: 'occurrence',
      title: o.title,
      description: `${o.type === 'maintenance' ? 'Manutenção' : 'Ocorrência'} - ${o.unit_display || 'Área comum'}`,
      time: format(new Date(o.created_date), 'HH:mm', { locale: ptBR }),
      status: o.priority === 'urgent' ? 'urgent' : o.status === 'resolved' ? 'resolved' : 'pending'
    })),
    ...reservations.slice(0, 2).map(r => ({
      type: 'reservation',
      title: `Reserva: ${r.area_name}`,
      description: `${r.unit_display} - ${format(new Date(r.date), 'dd/MM', { locale: ptBR })}`,
      time: format(new Date(r.created_date), 'HH:mm', { locale: ptBR }),
      status: r.status === 'approved' ? 'resolved' : 'pending'
    })),
    ...visitors.slice(0, 2).map(v => ({
      type: 'visitor',
      title: v.name,
      description: `${v.type === 'delivery' ? 'Entrega' : 'Visitante'} - ${v.unit_display}`,
      time: v.entry_date ? format(new Date(v.entry_date), 'HH:mm', { locale: ptBR }) : '',
    })),
  ].slice(0, 7);

  // Upcoming reservations
  const upcomingReservations = reservations
    .filter(r => r.status === 'approved' && new Date(r.date) >= new Date())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Bem-vindo ao CondoGest</h2>
              <p className="text-emerald-100 mt-1">
                {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{openOccurrences}</p>
                  <p className="text-emerald-100 text-xs">Ocorrências</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{pendingReservations}</p>
                  <p className="text-emerald-100 text-xs">Reservas Pendentes</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Unidades"
          value={units.length || 0}
          subtitle={`${activeResidents} moradores ativos`}
          icon={Building2}
          color="blue"
        />
        <StatsCard
          title="Receita do Mês"
          value={`R$ ${monthlyIncome.toLocaleString('pt-BR')}`}
          icon={TrendingUp}
          color="emerald"
          trend="up"
          trendValue="12%"
        />
        <StatsCard
          title="Despesas do Mês"
          value={`R$ ${monthlyExpenses.toLocaleString('pt-BR')}`}
          icon={TrendingDown}
          color="amber"
        />
        <StatsCard
          title="Inadimplência"
          value={overduePayments}
          subtitle="boletos vencidos"
          icon={DollarSign}
          color="red"
        />
      </div>

      {/* Charts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Fluxo Financeiro"
            subtitle="Receitas vs Despesas dos últimos 6 meses"
            data={monthlyData}
            type="area"
            dataKey="receitas"
          />
        </div>
        <QuickActions />
      </div>

      {/* Activity and Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={recentActivities} />
        
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--text-main)]">
              Próximas Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingReservations.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">
                  Nenhuma reserva agendada
                </p>
              ) : (
                upcomingReservations.map((reservation, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-main)]">
                          {reservation.area_name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {reservation.unit_display} • {reservation.resident_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[var(--text-main)]">
                        {format(new Date(reservation.date), 'dd/MM', { locale: ptBR })}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {reservation.start_time} - {reservation.end_time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Despesas por Categoria"
          subtitle="Distribuição do mês atual"
          data={expensesByCategory}
          type="pie"
          dataKey="value"
          height={280}
        />
        
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--text-main)]">
              Ocorrências Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {occurrences.slice(0, 5).map((occurrence, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      occurrence.priority === 'urgent' ? 'bg-red-500' :
                      occurrence.priority === 'high' ? 'bg-orange-500' :
                      occurrence.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-main)]">
                        {occurrence.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {occurrence.location || occurrence.unit_display || 'Não especificado'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={occurrence.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}