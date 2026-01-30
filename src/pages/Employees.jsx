import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  UserCog, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Phone,
  Mail,
  Building2,
  Calendar,
  Shield,
  Sparkles,
  Wrench
} from 'lucide-react';

const roleConfig = {
  doorman: { label: 'Porteiro', icon: Shield },
  cleaner: { label: 'Limpeza', icon: Sparkles },
  maintenance: { label: 'Manutenção', icon: Wrench },
  gardener: { label: 'Jardineiro', icon: Sparkles },
  security: { label: 'Segurança', icon: Shield },
  manager: { label: 'Gerente', icon: UserCog },
  other: { label: 'Outro', icon: UserCog },
};

export default function Employees() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    role: 'doorman',
    phone: '',
    email: '',
    cpf: '',
    hire_date: '',
    contract_type: 'clt',
    company_name: '',
    salary: '',
    work_schedule: '',
    is_active: true,
    emergency_contact: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Employee.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEmployee(null);
    setFormData({
      name: '',
      role: 'doorman',
      phone: '',
      email: '',
      cpf: '',
      hire_date: '',
      contract_type: 'clt',
      company_name: '',
      salary: '',
      work_schedule: '',
      is_active: true,
      emergency_contact: '',
      notes: ''
    });
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name || '',
      role: employee.role || 'doorman',
      phone: employee.phone || '',
      email: employee.email || '',
      cpf: employee.cpf || '',
      hire_date: employee.hire_date || '',
      contract_type: employee.contract_type || 'clt',
      company_name: employee.company_name || '',
      salary: employee.salary || '',
      work_schedule: employee.work_schedule || '',
      is_active: employee.is_active ?? true,
      emergency_contact: employee.emergency_contact || '',
      notes: employee.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      salary: formData.salary ? parseFloat(formData.salary) : null
    };
    
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredEmployees = employees.filter(e =>
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    roleConfig[e.role]?.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = employees.filter(e => e.is_active !== false).length;

  const columns = [
    {
      header: 'Funcionário',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={row.photo_url} />
            <AvatarFallback className="bg-purple-100 text-purple-700">
              {row.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {roleConfig[row.role]?.label || row.role}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Contrato',
      cell: (row) => (
        <div>
          <Badge variant="outline">
            {row.contract_type === 'clt' ? 'CLT' : 
             row.contract_type === 'outsourced' ? 'Terceirizado' : 'Temporário'}
          </Badge>
          {row.company_name && (
            <p className="text-xs text-[var(--text-muted)] mt-1">{row.company_name}</p>
          )}
        </div>
      )
    },
    {
      header: 'Horário',
      accessor: 'work_schedule',
      cell: (row) => row.work_schedule || '-'
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
      header: 'Status',
      cell: (row) => (
        <Badge className={row.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
          {row.is_active !== false ? 'Ativo' : 'Inativo'}
        </Badge>
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
        title="Funcionários"
        description={`${activeCount} funcionários ativos`}
        primaryAction={{
          label: 'Novo Funcionário',
          icon: Plus,
          onClick: () => setIsDialogOpen(true)
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(roleConfig).slice(0, 4).map(([key, config]) => {
          const count = employees.filter(e => e.role === key && e.is_active !== false).length;
          return (
            <Card key={key} className="bg-[var(--bg-card)] border-[var(--border)]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <config.icon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-[var(--text-muted)]">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {employees.length === 0 && !isLoading ? (
        <EmptyState
          icon={UserCog}
          title="Nenhum funcionário"
          description="Cadastre os funcionários do condomínio."
          actionLabel="Adicionar Funcionário"
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredEmployees}
          isLoading={isLoading}
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          searchPlaceholder="Buscar funcionário..."
          emptyMessage="Nenhum funcionário encontrado"
        />
      )}

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome completo *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Função *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Contrato</Label>
                <Select 
                  value={formData.contract_type} 
                  onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clt">CLT</SelectItem>
                    <SelectItem value="outsourced">Terceirizado</SelectItem>
                    <SelectItem value="temporary">Temporário</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label>CPF</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Admissão</Label>
                <Input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>
            </div>

            {formData.contract_type === 'outsourced' && (
              <div className="space-y-2">
                <Label>Empresa Terceirizada</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Horário de Trabalho</Label>
              <Input
                value={formData.work_schedule}
                onChange={(e) => setFormData({ ...formData, work_schedule: e.target.value })}
                placeholder="Ex: 07:00 às 15:00"
              />
            </div>

            <div className="space-y-2">
              <Label>Contato de Emergência</Label>
              <Input
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                placeholder="Nome e telefone"
              />
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
                {editingEmployee ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}