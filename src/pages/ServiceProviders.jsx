import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Briefcase, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Phone,
  Mail,
  AlertTriangle,
  Calendar,
  FileText,
  Building2
} from 'lucide-react';

const serviceTypeConfig = {
  elevator: 'Elevadores',
  fire_system: 'Sistema de Incêndio',
  pest_control: 'Dedetização',
  pool: 'Piscina',
  generator: 'Gerador',
  electrical: 'Elétrica',
  plumbing: 'Hidráulica',
  cleaning: 'Limpeza',
  security: 'Segurança',
  landscaping: 'Paisagismo',
  other: 'Outros',
};

export default function ServiceProviders() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    service_type: 'other',
    phone: '',
    email: '',
    cnpj: '',
    contract_start: '',
    contract_end: '',
    contract_value: '',
    payment_frequency: 'monthly',
    is_active: true,
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['serviceProviders'],
    queryFn: () => base44.entities.ServiceProvider.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ServiceProvider.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceProviders'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServiceProvider.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceProviders'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ServiceProvider.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceProviders'] });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProvider(null);
    setFormData({
      company_name: '',
      contact_name: '',
      service_type: 'other',
      phone: '',
      email: '',
      cnpj: '',
      contract_start: '',
      contract_end: '',
      contract_value: '',
      payment_frequency: 'monthly',
      is_active: true,
      notes: ''
    });
  };

  const handleEdit = (provider) => {
    setEditingProvider(provider);
    setFormData({
      company_name: provider.company_name || '',
      contact_name: provider.contact_name || '',
      service_type: provider.service_type || 'other',
      phone: provider.phone || '',
      email: provider.email || '',
      cnpj: provider.cnpj || '',
      contract_start: provider.contract_start || '',
      contract_end: provider.contract_end || '',
      contract_value: provider.contract_value || '',
      payment_frequency: provider.payment_frequency || 'monthly',
      is_active: provider.is_active ?? true,
      notes: provider.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null
    };
    
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredProviders = providers.filter(p =>
    p.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    serviceTypeConfig[p.service_type]?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Contracts expiring soon (within 30 days)
  const expiringContracts = providers.filter(p => {
    if (!p.contract_end || !p.is_active) return false;
    const daysUntilExpiry = differenceInDays(new Date(p.contract_end), new Date());
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  });

  const activeCount = providers.filter(p => p.is_active !== false).length;

  const columns = [
    {
      header: 'Empresa',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{row.company_name}</p>
            {row.contact_name && (
              <p className="text-xs text-[var(--text-muted)]">{row.contact_name}</p>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Serviço',
      cell: (row) => (
        <Badge variant="outline">
          {serviceTypeConfig[row.service_type] || row.service_type}
        </Badge>
      )
    },
    {
      header: 'Contrato',
      cell: (row) => {
        if (!row.contract_end) return '-';
        const daysUntilExpiry = differenceInDays(new Date(row.contract_end), new Date());
        const isExpiring = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
        const isExpired = daysUntilExpiry < 0;
        
        return (
          <div>
            <p className="text-sm">{format(new Date(row.contract_end), 'dd/MM/yyyy')}</p>
            {isExpired && (
              <Badge className="bg-red-100 text-red-700 mt-1">Vencido</Badge>
            )}
            {isExpiring && !isExpired && (
              <Badge className="bg-amber-100 text-amber-700 mt-1">Vence em {daysUntilExpiry} dias</Badge>
            )}
          </div>
        );
      }
    },
    {
      header: 'Valor',
      cell: (row) => row.contract_value 
        ? `R$ ${row.contract_value.toLocaleString('pt-BR')}/${row.payment_frequency === 'monthly' ? 'mês' : row.payment_frequency === 'annual' ? 'ano' : 'serv.'}`
        : '-'
    },
    {
      header: 'Contato',
      cell: (row) => (
        <div className="flex items-center gap-2 text-sm">
          {row.phone && (
            <a href={`tel:${row.phone}`} className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700">
              <Phone className="w-3 h-3" />
            </a>
          )}
          {row.email && (
            <a href={`mailto:${row.email}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
              <Mail className="w-3 h-3" />
            </a>
          )}
        </div>
      )
    },
    {
      header: '',
      width: '60px',
      cell: (row) => (
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
            {row.contract_url && (
              <DropdownMenuItem asChild>
                <a href={row.contract_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Contrato
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => deleteMutation.mutate(row.id)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prestadores de Serviço"
        description={`${activeCount} prestadores ativos`}
        primaryAction={{
          label: 'Novo Prestador',
          icon: Plus,
          onClick: () => setIsDialogOpen(true)
        }}
      />

      {/* Alerts */}
      {expiringContracts.length > 0 && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              Contratos a Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringContracts.map(provider => {
                const daysUntilExpiry = differenceInDays(new Date(provider.contract_end), new Date());
                return (
                  <div key={provider.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{provider.company_name}</span>
                      <span className="text-[var(--text-muted)]"> - {serviceTypeConfig[provider.service_type]}</span>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">
                      {daysUntilExpiry === 0 ? 'Vence hoje' : `${daysUntilExpiry} dias`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {providers.length === 0 && !isLoading ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhum prestador cadastrado"
          description="Cadastre os prestadores de serviço do condomínio."
          actionLabel="Adicionar Prestador"
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredProviders}
          isLoading={isLoading}
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          searchPlaceholder="Buscar prestador..."
          emptyMessage="Nenhum prestador encontrado"
        />
      )}

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? 'Editar Prestador' : 'Novo Prestador'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome da Empresa *</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Serviço *</Label>
                <Select 
                  value={formData.service_type} 
                  onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(serviceTypeConfig).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contato</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 mt-4">
              <h4 className="font-medium mb-3">Contrato</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input
                    type="date"
                    value={formData.contract_start}
                    onChange={(e) => setFormData({ ...formData, contract_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input
                    type="date"
                    value={formData.contract_end}
                    onChange={(e) => setFormData({ ...formData, contract_end: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select 
                    value={formData.payment_frequency} 
                    onValueChange={(value) => setFormData({ ...formData, payment_frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                      <SelectItem value="per_service">Por Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
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
                {editingProvider ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}