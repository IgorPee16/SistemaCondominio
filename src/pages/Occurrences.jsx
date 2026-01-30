import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AlertTriangle, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  CheckCircle,
  Clock,
  Wrench,
  Volume2,
  Car,
  Shield,
  Sparkles,
  MessageSquare,
  Eye
} from 'lucide-react';

const typeConfig = {
  maintenance: { label: 'Manutenção', icon: Wrench, color: 'bg-blue-100 text-blue-700' },
  complaint: { label: 'Reclamação', icon: MessageSquare, color: 'bg-red-100 text-red-700' },
  suggestion: { label: 'Sugestão', icon: Sparkles, color: 'bg-purple-100 text-purple-700' },
  noise: { label: 'Barulho', icon: Volume2, color: 'bg-amber-100 text-amber-700' },
  parking: { label: 'Estacionamento', icon: Car, color: 'bg-cyan-100 text-cyan-700' },
  security: { label: 'Segurança', icon: Shield, color: 'bg-orange-100 text-orange-700' },
  cleaning: { label: 'Limpeza', icon: Sparkles, color: 'bg-green-100 text-green-700' },
  other: { label: 'Outros', icon: AlertTriangle, color: 'bg-gray-100 text-gray-700' },
};

export default function Occurrences() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);
  const [editingOccurrence, setEditingOccurrence] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'maintenance',
    priority: 'medium',
    status: 'open',
    location: '',
    unit_id: '',
    unit_display: '',
    reporter_name: '',
    resolution_notes: '',
    estimated_cost: ''
  });

  const queryClient = useQueryClient();

  const { data: occurrences = [], isLoading } = useQuery({
    queryKey: ['occurrences'],
    queryFn: () => base44.entities.Occurrence.list('-created_date'),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Occurrence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Occurrence.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Occurrence.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingOccurrence(null);
    setFormData({
      title: '',
      description: '',
      type: 'maintenance',
      priority: 'medium',
      status: 'open',
      location: '',
      unit_id: '',
      unit_display: '',
      reporter_name: '',
      resolution_notes: '',
      estimated_cost: ''
    });
  };

  const handleEdit = (occurrence) => {
    setEditingOccurrence(occurrence);
    setFormData({
      title: occurrence.title || '',
      description: occurrence.description || '',
      type: occurrence.type || 'maintenance',
      priority: occurrence.priority || 'medium',
      status: occurrence.status || 'open',
      location: occurrence.location || '',
      unit_id: occurrence.unit_id || '',
      unit_display: occurrence.unit_display || '',
      reporter_name: occurrence.reporter_name || '',
      resolution_notes: occurrence.resolution_notes || '',
      estimated_cost: occurrence.estimated_cost || ''
    });
    setIsDialogOpen(true);
  };

  const handleView = (occurrence) => {
    setSelectedOccurrence(occurrence);
    setViewDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
    };
    
    if (editingOccurrence) {
      updateMutation.mutate({ id: editingOccurrence.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleUnitChange = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    setFormData({
      ...formData,
      unit_id: unitId,
      unit_display: unit ? `${unit.block} - ${unit.number}` : ''
    });
  };

  const updateStatus = (occurrence, newStatus) => {
    updateMutation.mutate({
      id: occurrence.id,
      data: {
        ...occurrence,
        status: newStatus,
        resolved_date: newStatus === 'resolved' ? format(new Date(), 'yyyy-MM-dd') : null
      }
    });
  };

  // Stats
  const openCount = occurrences.filter(o => o.status === 'open').length;
  const inProgressCount = occurrences.filter(o => o.status === 'in_progress').length;
  const urgentCount = occurrences.filter(o => o.priority === 'urgent' && o.status !== 'resolved').length;

  // Filter
  const filteredOccurrences = occurrences.filter(o => {
    const matchesSearch = o.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'open') return (o.status === 'open' || o.status === 'in_progress') && matchesSearch;
    if (activeTab === 'resolved') return o.status === 'resolved' && matchesSearch;
    if (activeTab === 'urgent') return o.priority === 'urgent' && matchesSearch;
    return matchesSearch;
  });

  const columns = [
    {
      header: 'Ocorrência',
      cell: (row) => {
        const config = typeConfig[row.type] || typeConfig.other;
        const Icon = config.icon;
        return (
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{row.title}</p>
              <p className="text-xs text-[var(--text-muted)]">{config.label}</p>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Local',
      cell: (row) => (
        <div className="text-sm">
          <p>{row.location || row.unit_display || 'Não informado'}</p>
          {row.reporter_name && (
            <p className="text-xs text-[var(--text-muted)]">Por: {row.reporter_name}</p>
          )}
        </div>
      )
    },
    {
      header: 'Prioridade',
      cell: (row) => <StatusBadge status={row.priority} />
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Data',
      cell: (row) => (
        <div className="text-sm">
          <p>{format(new Date(row.created_date), 'dd/MM/yyyy')}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {format(new Date(row.created_date), 'HH:mm')}
          </p>
        </div>
      )
    },
    {
      header: '',
      width: '120px',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleView(row)}>
            <Eye className="w-4 h-4" />
          </Button>
          {row.status !== 'resolved' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateStatus(row, 'resolved')}
              className="text-emerald-600 hover:text-emerald-700"
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
              {row.status === 'open' && (
                <DropdownMenuItem onClick={() => updateStatus(row, 'in_progress')}>
                  <Clock className="w-4 h-4 mr-2" />
                  Em Andamento
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
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ocorrências"
        description="Registro e acompanhamento de ocorrências"
        primaryAction={{
          label: 'Nova Ocorrência',
          icon: Plus,
          onClick: () => setIsDialogOpen(true)
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{openCount}</p>
              <p className="text-xs text-[var(--text-muted)]">Abertas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-xs text-[var(--text-muted)]">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{urgentCount}</p>
              <p className="text-xs text-[var(--text-muted)]">Urgentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {occurrences.filter(o => o.status === 'resolved').length}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Resolvidas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[var(--bg-card)] border border-[var(--border)]">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="open">Abertas</TabsTrigger>
          <TabsTrigger value="resolved">Resolvidas</TabsTrigger>
          <TabsTrigger value="urgent" className="text-red-600">
            Urgentes ({urgentCount})
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {occurrences.length === 0 && !isLoading ? (
            <EmptyState
              icon={AlertTriangle}
              title="Nenhuma ocorrência"
              description="Registre ocorrências de manutenção, reclamações ou sugestões."
              actionLabel="Nova Ocorrência"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredOccurrences}
              isLoading={isLoading}
              searchValue={searchQuery}
              onSearch={setSearchQuery}
              searchPlaceholder="Buscar por título, descrição ou local..."
              emptyMessage="Nenhuma ocorrência encontrada"
            />
          )}
        </div>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOccurrence ? 'Editar Ocorrência' : 'Nova Ocorrência'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Descreva brevemente a ocorrência"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes da ocorrência..."
                rows={3}
              />
            </div>

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
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Hall de entrada"
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={formData.unit_id} onValueChange={handleUnitChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
            </div>

            {editingOccurrence && (
              <>
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
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="waiting">Aguardando</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notas de Resolução</Label>
                  <Textarea
                    value={formData.resolution_notes}
                    onChange={(e) => setFormData({ ...formData, resolution_notes: e.target.value })}
                    placeholder="Como foi resolvido..."
                    rows={2}
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingOccurrence ? 'Salvar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Ocorrência</DialogTitle>
          </DialogHeader>
          {selectedOccurrence && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${typeConfig[selectedOccurrence.type]?.color || 'bg-gray-100'}`}>
                  {React.createElement(typeConfig[selectedOccurrence.type]?.icon || AlertTriangle, { className: 'w-5 h-5' })}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedOccurrence.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <StatusBadge status={selectedOccurrence.priority} />
                    <StatusBadge status={selectedOccurrence.status} />
                  </div>
                </div>
              </div>

              {selectedOccurrence.description && (
                <div>
                  <Label className="text-xs text-[var(--text-muted)]">Descrição</Label>
                  <p className="mt-1">{selectedOccurrence.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[var(--text-muted)]">Local</Label>
                  <p className="mt-1">{selectedOccurrence.location || selectedOccurrence.unit_display || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-[var(--text-muted)]">Data</Label>
                  <p className="mt-1">{format(new Date(selectedOccurrence.created_date), "dd/MM/yyyy 'às' HH:mm")}</p>
                </div>
              </div>

              {selectedOccurrence.resolution_notes && (
                <div>
                  <Label className="text-xs text-[var(--text-muted)]">Resolução</Label>
                  <p className="mt-1">{selectedOccurrence.resolution_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}