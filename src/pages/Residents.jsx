import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Users, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Phone, 
  Mail,
  Home,
  Dog,
  Car,
  Download
} from 'lucide-react';

export default function Residents() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    unit_id: '',
    unit_display: '',
    type: 'owner',
    role: 'resident',
    move_in_date: '',
    pets: [],
    vehicles: []
  });

  const queryClient = useQueryClient();

  const { data: residents = [], isLoading } = useQuery({
    queryKey: ['residents'],
    queryFn: () => base44.entities.Resident.list('-created_date'),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Resident.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Resident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Resident.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingResident(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      cpf: '',
      unit_id: '',
      unit_display: '',
      type: 'owner',
      role: 'resident',
      move_in_date: '',
      pets: [],
      vehicles: []
    });
  };

  const handleEdit = (resident) => {
    setEditingResident(resident);
    setFormData({
      name: resident.name || '',
      email: resident.email || '',
      phone: resident.phone || '',
      cpf: resident.cpf || '',
      unit_id: resident.unit_id || '',
      unit_display: resident.unit_display || '',
      type: resident.type || 'owner',
      role: resident.role || 'resident',
      move_in_date: resident.move_in_date || '',
      pets: resident.pets || [],
      vehicles: resident.vehicles || []
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingResident) {
      updateMutation.mutate({ id: editingResident.id, data: formData });
    } else {
      createMutation.mutate(formData);
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

  const filteredResidents = residents.filter(r =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.unit_display?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleLabels = {
    syndic: 'Síndico',
    sub_syndic: 'Subsíndico',
    counselor: 'Conselheiro',
    resident: 'Morador'
  };

  const typeLabels = {
    owner: 'Proprietário',
    tenant: 'Inquilino',
    dependent: 'Dependente'
  };

  const columns = [
    {
      header: 'Morador',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={row.photo_url} />
            <AvatarFallback className="bg-emerald-100 text-emerald-700">
              {row.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Unidade',
      accessor: 'unit_display',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-[var(--text-muted)]" />
          <span>{row.unit_display || '-'}</span>
        </div>
      )
    },
    {
      header: 'Tipo',
      cell: (row) => (
        <Badge variant="outline">{typeLabels[row.type] || row.type}</Badge>
      )
    },
    {
      header: 'Função',
      cell: (row) => {
        if (row.role === 'syndic') {
          return <Badge className="bg-emerald-100 text-emerald-700">Síndico</Badge>;
        }
        if (row.role === 'sub_syndic') {
          return <Badge className="bg-blue-100 text-blue-700">Subsíndico</Badge>;
        }
        if (row.role === 'counselor') {
          return <Badge className="bg-purple-100 text-purple-700">Conselheiro</Badge>;
        }
        return <span className="text-[var(--text-muted)]">-</span>;
      }
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
        title="Moradores"
        description={`${residents.length} moradores cadastrados`}
        primaryAction={{
          label: 'Novo Morador',
          icon: Plus,
          onClick: () => setIsDialogOpen(true)
        }}
      />

      {residents.length === 0 && !isLoading ? (
        <EmptyState
          icon={Users}
          title="Nenhum morador cadastrado"
          description="Comece adicionando os moradores do condomínio para gerenciar todas as informações."
          actionLabel="Adicionar Morador"
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredResidents}
          isLoading={isLoading}
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          searchPlaceholder="Buscar por nome, email ou unidade..."
          emptyMessage="Nenhum morador encontrado"
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingResident ? 'Editar Morador' : 'Novo Morador'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome completo *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
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
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade *</Label>
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
                    <SelectItem value="owner">Proprietário</SelectItem>
                    <SelectItem value="tenant">Inquilino</SelectItem>
                    <SelectItem value="dependent">Dependente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Função no Condomínio</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resident">Morador</SelectItem>
                    <SelectItem value="syndic">Síndico</SelectItem>
                    <SelectItem value="sub_syndic">Subsíndico</SelectItem>
                    <SelectItem value="counselor">Conselheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Entrada</Label>
                <Input
                  type="date"
                  value={formData.move_in_date}
                  onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                />
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
                {editingResident ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}