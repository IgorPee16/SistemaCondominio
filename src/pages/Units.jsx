import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Building2, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Home,
  Car,
  Users,
  Layers
} from 'lucide-react';

export default function Units() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    block: '',
    number: '',
    floor: '',
    type: 'apartment',
    area_sqm: '',
    ideal_fraction: '',
    parking_spots: [],
    status: 'occupied'
  });

  const queryClient = useQueryClient();

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list(),
  });

  const { data: residents = [] } = useQuery({
    queryKey: ['residents'],
    queryFn: () => base44.entities.Resident.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Unit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Unit.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Unit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUnit(null);
    setFormData({
      block: '',
      number: '',
      floor: '',
      type: 'apartment',
      area_sqm: '',
      ideal_fraction: '',
      parking_spots: [],
      status: 'occupied'
    });
  };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      block: unit.block || '',
      number: unit.number || '',
      floor: unit.floor || '',
      type: unit.type || 'apartment',
      area_sqm: unit.area_sqm || '',
      ideal_fraction: unit.ideal_fraction || '',
      parking_spots: unit.parking_spots || [],
      status: unit.status || 'occupied'
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      floor: formData.floor ? Number(formData.floor) : null,
      area_sqm: formData.area_sqm ? Number(formData.area_sqm) : null,
      ideal_fraction: formData.ideal_fraction ? Number(formData.ideal_fraction) : null,
    };
    
    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredUnits = units.filter(u =>
    u.block?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group units by block
  const unitsByBlock = units.reduce((acc, unit) => {
    const block = unit.block || 'Sem Bloco';
    if (!acc[block]) acc[block] = [];
    acc[block].push(unit);
    return acc;
  }, {});

  const getResidentsCount = (unitId) => {
    return residents.filter(r => r.unit_id === unitId && r.is_active !== false).length;
  };

  const statusLabels = {
    occupied: 'Ocupado',
    vacant: 'Vago',
    rented: 'Alugado'
  };

  const columns = [
    {
      header: 'Unidade',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-medium">{row.block} - {row.number}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {row.floor ? `${row.floor}º andar` : ''} {row.area_sqm ? `• ${row.area_sqm}m²` : ''}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Tipo',
      cell: (row) => (
        <span className="capitalize">
          {row.type === 'apartment' ? 'Apartamento' : 
           row.type === 'house' ? 'Casa' : 'Comercial'}
        </span>
      )
    },
    {
      header: 'Fração Ideal',
      cell: (row) => row.ideal_fraction ? `${(row.ideal_fraction * 100).toFixed(4)}%` : '-'
    },
    {
      header: 'Vagas',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Car className="w-4 h-4 text-[var(--text-muted)]" />
          <span>{row.parking_spots?.length || 0}</span>
        </div>
      )
    },
    {
      header: 'Moradores',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-[var(--text-muted)]" />
          <span>{getResidentsCount(row.id)}</span>
        </div>
      )
    },
    {
      header: 'Status',
      cell: (row) => {
        const colors = {
          occupied: 'bg-emerald-100 text-emerald-700',
          vacant: 'bg-gray-100 text-gray-700',
          rented: 'bg-blue-100 text-blue-700'
        };
        return (
          <Badge className={colors[row.status] || colors.occupied}>
            {statusLabels[row.status] || 'Ocupado'}
          </Badge>
        );
      }
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
        title="Unidades"
        description={`${units.length} unidades em ${Object.keys(unitsByBlock).length} blocos`}
        primaryAction={{
          label: 'Nova Unidade',
          icon: Plus,
          onClick: () => setIsDialogOpen(true)
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-main)]">{Object.keys(unitsByBlock).length}</p>
              <p className="text-xs text-[var(--text-muted)]">Blocos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Home className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-main)]">{units.filter(u => u.status === 'occupied').length}</p>
              <p className="text-xs text-[var(--text-muted)]">Ocupados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-main)]">{units.filter(u => u.status === 'vacant').length}</p>
              <p className="text-xs text-[var(--text-muted)]">Vagos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Car className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-main)]">
                {units.reduce((sum, u) => sum + (u.parking_spots?.length || 0), 0)}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Vagas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {units.length === 0 && !isLoading ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma unidade cadastrada"
          description="Comece adicionando as unidades do condomínio."
          actionLabel="Adicionar Unidade"
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredUnits}
          isLoading={isLoading}
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          searchPlaceholder="Buscar por bloco ou número..."
          emptyMessage="Nenhuma unidade encontrada"
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? 'Editar Unidade' : 'Nova Unidade'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bloco/Torre *</Label>
                <Input
                  value={formData.block}
                  onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                  placeholder="A, B, Torre 1..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Número *</Label>
                <Input
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="101, 102..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Andar</Label>
                <Input
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Área (m²)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.area_sqm}
                  onChange={(e) => setFormData({ ...formData, area_sqm: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartamento</SelectItem>
                    <SelectItem value="house">Casa</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fração Ideal</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.ideal_fraction}
                  onChange={(e) => setFormData({ ...formData, ideal_fraction: e.target.value })}
                  placeholder="0.0123"
                />
              </div>
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
                  <SelectItem value="occupied">Ocupado</SelectItem>
                  <SelectItem value="vacant">Vago</SelectItem>
                  <SelectItem value="rented">Alugado</SelectItem>
                </SelectContent>
              </Select>
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
                {editingUnit ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}