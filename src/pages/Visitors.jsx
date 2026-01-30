import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
  Package, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  User,
  Truck,
  Wrench,
  UtensilsCrossed,
  LogIn,
  LogOut,
  Clock,
  QrCode
} from 'lucide-react';

const typeConfig = {
  visitor: { label: 'Visitante', icon: User, color: 'bg-blue-100 text-blue-700' },
  delivery: { label: 'Entrega', icon: Package, color: 'bg-amber-100 text-amber-700' },
  service_provider: { label: 'Prestador', icon: Wrench, color: 'bg-purple-100 text-purple-700' },
  food_delivery: { label: 'Delivery', icon: UtensilsCrossed, color: 'bg-red-100 text-red-700' },
};

export default function Visitors() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    phone: '',
    type: 'visitor',
    unit_id: '',
    unit_display: '',
    authorizer_name: '',
    vehicle_plate: '',
    is_recurring: false,
    valid_until: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: visitors = [], isLoading } = useQuery({
    queryKey: ['visitors'],
    queryFn: () => base44.entities.Visitor.list('-entry_date'),
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
    mutationFn: (data) => base44.entities.Visitor.create({
      ...data,
      entry_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Visitor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Visitor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVisitor(null);
    setFormData({
      name: '',
      document: '',
      phone: '',
      type: 'visitor',
      unit_id: '',
      unit_display: '',
      authorizer_name: '',
      vehicle_plate: '',
      is_recurring: false,
      valid_until: '',
      notes: ''
    });
  };

  const handleEdit = (visitor) => {
    setEditingVisitor(visitor);
    setFormData({
      name: visitor.name || '',
      document: visitor.document || '',
      phone: visitor.phone || '',
      type: visitor.type || 'visitor',
      unit_id: visitor.unit_id || '',
      unit_display: visitor.unit_display || '',
      authorizer_name: visitor.authorizer_name || '',
      vehicle_plate: visitor.vehicle_plate || '',
      is_recurring: visitor.is_recurring || false,
      valid_until: visitor.valid_until || '',
      notes: visitor.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingVisitor) {
      updateMutation.mutate({ id: editingVisitor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleUnitChange = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    const resident = residents.find(r => r.unit_id === unitId && r.type === 'owner');
    setFormData({
      ...formData,
      unit_id: unitId,
      unit_display: unit ? `${unit.block} - ${unit.number}` : '',
      authorizer_name: resident?.name || ''
    });
  };

  const registerExit = (visitor) => {
    updateMutation.mutate({
      id: visitor.id,
      data: { ...visitor, exit_date: new Date().toISOString() }
    });
  };

  // Filter
  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.unit_display?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'inside') return !v.exit_date && matchesSearch;
    if (activeTab === 'delivery') return (v.type === 'delivery' || v.type === 'food_delivery') && matchesSearch;
    return matchesSearch;
  });

  // Stats
  const insideNow = visitors.filter(v => !v.exit_date).length;
  const todayTotal = visitors.filter(v => {
    if (!v.entry_date) return false;
    const today = new Date();
    const entryDate = new Date(v.entry_date);
    return entryDate.toDateString() === today.toDateString();
  }).length;

  const columns = [
    {
      header: 'Visitante',
      cell: (row) => {
        const config = typeConfig[row.type] || typeConfig.visitor;
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium">{row.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{config.label}</p>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Unidade',
      accessor: 'unit_display',
      cell: (row) => (
        <div>
          <p>{row.unit_display || '-'}</p>
          {row.authorizer_name && (
            <p className="text-xs text-[var(--text-muted)]">{row.authorizer_name}</p>
          )}
        </div>
      )
    },
    {
      header: 'Entrada',
      cell: (row) => row.entry_date ? (
        <div>
          <p>{format(new Date(row.entry_date), 'dd/MM/yyyy')}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {format(new Date(row.entry_date), 'HH:mm')}
          </p>
        </div>
      ) : '-'
    },
    {
      header: 'Saída',
      cell: (row) => row.exit_date ? (
        <div>
          <p>{format(new Date(row.exit_date), 'dd/MM/yyyy')}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {format(new Date(row.exit_date), 'HH:mm')}
          </p>
        </div>
      ) : (
        <Badge className="bg-emerald-100 text-emerald-700">No local</Badge>
      )
    },
    {
      header: '',
      width: '100px',
      cell: (row) => (
        <div className="flex items-center gap-1">
          {!row.exit_date && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => registerExit(row)}
              className="text-blue-600 hover:text-blue-700"
              title="Registrar saída"
            >
              <LogOut className="w-4 h-4" />
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
        title="Visitantes e Entregas"
        description="Controle de acesso e registro de visitantes"
        primaryAction={{
          label: 'Registrar Entrada',
          icon: Plus,
          onClick: () => setIsDialogOpen(true)
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <LogIn className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{insideNow}</p>
              <p className="text-xs text-[var(--text-muted)]">No Local</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayTotal}</p>
              <p className="text-xs text-[var(--text-muted)]">Entradas Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {visitors.filter(v => (v.type === 'delivery' || v.type === 'food_delivery') && !v.exit_date).length}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Entregas Aguardando</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {visitors.filter(v => v.is_recurring).length}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Recorrentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[var(--bg-card)] border border-[var(--border)]">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="inside">
            No Local ({insideNow})
          </TabsTrigger>
          <TabsTrigger value="delivery">Entregas</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {visitors.length === 0 && !isLoading ? (
            <EmptyState
              icon={Package}
              title="Nenhum registro"
              description="Registre a entrada de visitantes e entregas."
              actionLabel="Registrar Entrada"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredVisitors}
              isLoading={isLoading}
              searchValue={searchQuery}
              onSearch={setSearchQuery}
              searchPlaceholder="Buscar por nome ou unidade..."
              emptyMessage="Nenhum registro encontrado"
            />
          )}
        </div>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVisitor ? 'Editar Registro' : 'Registrar Entrada'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>
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
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Documento</Label>
                <Input
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  placeholder="RG ou CPF"
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
                <Label>Placa do Veículo</Label>
                <Input
                  value={formData.vehicle_plate}
                  onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                  placeholder="ABC-1234"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Unidade de Destino *</Label>
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

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
              />
              <Label>Acesso Recorrente</Label>
            </div>

            {formData.is_recurring && (
              <div className="space-y-2">
                <Label>Válido até</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informações adicionais..."
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
                {editingVisitor ? 'Salvar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}