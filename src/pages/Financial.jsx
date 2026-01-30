import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import StatsCard from '@/components/dashboard/StatsCard';
import ChartCard from '@/components/dashboard/ChartCard';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  DollarSign, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const categoryLabels = {
  condo_fee: 'Taxa Condominial',
  fine: 'Multa',
  extra_fee: 'Taxa Extra',
  reservation: 'Reserva',
  water: 'Água',
  electricity: 'Energia',
  gas: 'Gás',
  maintenance: 'Manutenção',
  cleaning: 'Limpeza',
  security: 'Segurança',
  elevator: 'Elevador',
  garden: 'Jardinagem',
  insurance: 'Seguro',
  administrative: 'Administrativo',
  personnel: 'Pessoal',
  other: 'Outros'
};

export default function Financial() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    type: 'income',
    category: 'condo_fee',
    description: '',
    amount: '',
    due_date: '',
    payment_date: '',
    status: 'pending',
    unit_id: '',
    unit_display: '',
    resident_name: '',
    reference_month: format(new Date(), 'yyyy-MM'),
    payment_method: 'boleto'
  });

  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.FinancialTransaction.list('-created_date'),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list(),
  });

  const { data: residents = [] } = useQuery({
    queryKey: ['residents'],
    queryFn: () => base44.entities.Resident.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FinancialTransaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FinancialTransaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialTransaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTransaction(null);
    setFormData({
      type: 'income',
      category: 'condo_fee',
      description: '',
      amount: '',
      due_date: '',
      payment_date: '',
      status: 'pending',
      unit_id: '',
      unit_display: '',
      resident_name: '',
      reference_month: format(new Date(), 'yyyy-MM'),
      payment_method: 'boleto'
    });
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type || 'income',
      category: transaction.category || 'condo_fee',
      description: transaction.description || '',
      amount: transaction.amount || '',
      due_date: transaction.due_date || '',
      payment_date: transaction.payment_date || '',
      status: transaction.status || 'pending',
      unit_id: transaction.unit_id || '',
      unit_display: transaction.unit_display || '',
      resident_name: transaction.resident_name || '',
      reference_month: transaction.reference_month || '',
      payment_method: transaction.payment_method || 'boleto'
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount)
    };
    
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleUnitChange = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    const resident = residents.find(r => r.unit_id === unitId && r.type === 'owner');
    setFormData({
      ...formData,
      unit_id: unitId,
      unit_display: unit ? `${unit.block} - ${unit.number}` : '',
      resident_name: resident?.name || ''
    });
  };

  const markAsPaid = (transaction) => {
    updateMutation.mutate({
      id: transaction.id,
      data: {
        ...transaction,
        status: 'paid',
        payment_date: format(new Date(), 'yyyy-MM-dd')
      }
    });
  };

  // Calculate stats
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'paid' && t.reference_month === currentMonth)
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && t.reference_month === currentMonth)
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const pendingIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'pending')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const overdueCount = transactions.filter(t => t.type === 'income' && t.status === 'overdue').length;

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.unit_display?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.resident_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'income') return t.type === 'income' && matchesSearch;
    if (activeTab === 'expense') return t.type === 'expense' && matchesSearch;
    if (activeTab === 'overdue') return t.status === 'overdue' && matchesSearch;
    return matchesSearch;
  });

  const columns = [
    {
      header: 'Tipo',
      width: '50px',
      cell: (row) => (
        <div className={`p-2 rounded-lg ${row.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
          {row.type === 'income' ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
        </div>
      )
    },
    {
      header: 'Descrição',
      cell: (row) => (
        <div>
          <p className="font-medium">{row.description || categoryLabels[row.category]}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {row.unit_display} {row.resident_name && `• ${row.resident_name}`}
          </p>
        </div>
      )
    },
    {
      header: 'Categoria',
      cell: (row) => (
        <Badge variant="outline">{categoryLabels[row.category] || row.category}</Badge>
      )
    },
    {
      header: 'Valor',
      cell: (row) => (
        <span className={`font-semibold ${row.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
          {row.type === 'income' ? '+' : '-'} R$ {row.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Vencimento',
      cell: (row) => row.due_date ? format(new Date(row.due_date), 'dd/MM/yyyy') : '-'
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: '',
      width: '100px',
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.status === 'pending' && row.type === 'income' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => markAsPaid(row)}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(row)}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => deleteMutation.mutate(row.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Gestão de receitas e despesas"
        primaryAction={{
          label: 'Novo Lançamento',
          icon: Plus,
          onClick: () => setIsDialogOpen(true)
        }}
        secondaryActions={
          <Button variant="outline" className="border-[var(--border)]">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Receita do Mês"
          value={`R$ ${monthlyIncome.toLocaleString('pt-BR')}`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatsCard
          title="Despesas do Mês"
          value={`R$ ${monthlyExpenses.toLocaleString('pt-BR')}`}
          icon={TrendingDown}
          color="red"
        />
        <StatsCard
          title="A Receber"
          value={`R$ ${pendingIncome.toLocaleString('pt-BR')}`}
          icon={DollarSign}
          color="blue"
        />
        <StatsCard
          title="Inadimplentes"
          value={overdueCount}
          subtitle="boletos vencidos"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Tabs and Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[var(--bg-card)] border border-[var(--border)]">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expense">Despesas</TabsTrigger>
          <TabsTrigger value="overdue" className="text-red-600">
            Vencidos ({overdueCount})
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {transactions.length === 0 && !isLoading ? (
            <EmptyState
              icon={DollarSign}
              title="Nenhum lançamento"
              description="Comece adicionando receitas e despesas do condomínio."
              actionLabel="Novo Lançamento"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredTransactions}
              isLoading={isLoading}
              searchValue={searchQuery}
              onSearch={setSearchQuery}
              searchPlaceholder="Buscar por descrição, unidade..."
              emptyMessage="Nenhum lançamento encontrado"
            />
          )}
        </div>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do lançamento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Mês Referência</Label>
                <Input
                  type="month"
                  value={formData.reference_month}
                  onChange={(e) => setFormData({ ...formData, reference_month: e.target.value })}
                />
              </div>
            </div>

            {formData.type === 'income' && (
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={formData.unit_id} onValueChange={handleUnitChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.block} - {unit.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingTransaction ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}