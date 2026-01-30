import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  CalendarDays, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Video,
  MapPin,
  Users,
  FileText,
  Send,
  Clock,
  CheckCircle
} from 'lucide-react';

export default function Assemblies() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssembly, setEditingAssembly] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'ordinary',
    date: '',
    time: '',
    location: '',
    is_online: false,
    meeting_link: '',
    status: 'scheduled',
    agenda: [{ order: 1, topic: '', description: '' }],
    quorum_required: ''
  });

  const queryClient = useQueryClient();

  const { data: assemblies = [], isLoading } = useQuery({
    queryKey: ['assemblies'],
    queryFn: () => base44.entities.Assembly.list('-date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assembly.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assemblies'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Assembly.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assemblies'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Assembly.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assemblies'] });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAssembly(null);
    setFormData({
      title: '',
      type: 'ordinary',
      date: '',
      time: '',
      location: '',
      is_online: false,
      meeting_link: '',
      status: 'scheduled',
      agenda: [{ order: 1, topic: '', description: '' }],
      quorum_required: ''
    });
  };

  const handleEdit = (assembly) => {
    setEditingAssembly(assembly);
    const dateObj = new Date(assembly.date);
    setFormData({
      title: assembly.title || '',
      type: assembly.type || 'ordinary',
      date: format(dateObj, 'yyyy-MM-dd'),
      time: format(dateObj, 'HH:mm'),
      location: assembly.location || '',
      is_online: assembly.is_online || false,
      meeting_link: assembly.meeting_link || '',
      status: assembly.status || 'scheduled',
      agenda: assembly.agenda?.length ? assembly.agenda : [{ order: 1, topic: '', description: '' }],
      quorum_required: assembly.quorum_required || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dateTime = new Date(`${formData.date}T${formData.time || '00:00'}`);
    const data = {
      ...formData,
      date: dateTime.toISOString(),
      quorum_required: formData.quorum_required ? parseInt(formData.quorum_required) : null,
      agenda: formData.agenda.filter(a => a.topic)
    };
    delete data.time;
    
    if (editingAssembly) {
      updateMutation.mutate({ id: editingAssembly.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const addAgendaItem = () => {
    setFormData({
      ...formData,
      agenda: [...formData.agenda, { order: formData.agenda.length + 1, topic: '', description: '' }]
    });
  };

  const updateAgendaItem = (index, field, value) => {
    const newAgenda = [...formData.agenda];
    newAgenda[index] = { ...newAgenda[index], [field]: value };
    setFormData({ ...formData, agenda: newAgenda });
  };

  const removeAgendaItem = (index) => {
    setFormData({
      ...formData,
      agenda: formData.agenda.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i + 1 }))
    });
  };

  // Separate upcoming and past
  const upcoming = assemblies.filter(a => new Date(a.date) >= new Date() && a.status !== 'cancelled');
  const past = assemblies.filter(a => new Date(a.date) < new Date() || a.status === 'finished');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assembleias"
        description="Gestão de assembleias e votações"
        primaryAction={{
          label: 'Nova Assembleia',
          icon: Plus,
          onClick: () => setIsDialogOpen(true)
        }}
      />

      {assemblies.length === 0 && !isLoading ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhuma assembleia"
          description="Agende assembleias ordinárias ou extraordinárias."
          actionLabel="Agendar Assembleia"
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <div className="space-y-8">
          {/* Upcoming */}
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-main)] mb-4">Próximas Assembleias</h2>
            {upcoming.length === 0 ? (
              <Card className="bg-[var(--bg-card)] border-[var(--border)]">
                <CardContent className="py-8 text-center text-[var(--text-muted)]">
                  Nenhuma assembleia agendada
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcoming.map((assembly) => (
                  <Card key={assembly.id} className="bg-[var(--bg-card)] border-[var(--border)] card-hover">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                            <CalendarDays className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{assembly.title}</h3>
                              <Badge variant="outline">
                                {assembly.type === 'ordinary' ? 'Ordinária' : 'Extraordinária'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[var(--text-muted)]">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {format(new Date(assembly.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </div>
                              <div className="flex items-center gap-1">
                                {assembly.is_online ? (
                                  <>
                                    <Video className="w-4 h-4" />
                                    Online
                                  </>
                                ) : (
                                  <>
                                    <MapPin className="w-4 h-4" />
                                    {assembly.location || 'Local não definido'}
                                  </>
                                )}
                              </div>
                            </div>
                            {assembly.agenda?.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Pauta:</p>
                                <ul className="text-sm space-y-1">
                                  {assembly.agenda.slice(0, 3).map((item, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-emerald-600">{item.order}.</span>
                                      <span>{item.topic}</span>
                                    </li>
                                  ))}
                                  {assembly.agenda.length > 3 && (
                                    <li className="text-[var(--text-muted)]">
                                      +{assembly.agenda.length - 3} itens
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={assembly.status} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(assembly)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Send className="w-4 h-4 mr-2" />
                                Enviar Convocação
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteMutation.mutate(assembly.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-main)] mb-4">Assembleias Anteriores</h2>
              <div className="grid gap-3">
                {past.map((assembly) => (
                  <Card key={assembly.id} className="bg-[var(--bg-card)] border-[var(--border)]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                            <CheckCircle className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium">{assembly.title}</p>
                            <p className="text-sm text-[var(--text-muted)]">
                              {format(new Date(assembly.date), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {assembly.minutes_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={assembly.minutes_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="w-4 h-4 mr-1" />
                                Ata
                              </a>
                            </Button>
                          )}
                          <StatusBadge status={assembly.status} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAssembly ? 'Editar Assembleia' : 'Nova Assembleia'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Assembleia Geral Ordinária 2024"
                  required
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
                    <SelectItem value="ordinary">Ordinária</SelectItem>
                    <SelectItem value="extraordinary">Extraordinária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quórum Mínimo</Label>
                <Input
                  type="number"
                  value={formData.quorum_required}
                  onChange={(e) => setFormData({ ...formData, quorum_required: e.target.value })}
                  placeholder="Número de unidades"
                />
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_online}
                onCheckedChange={(checked) => setFormData({ ...formData, is_online: checked })}
              />
              <Label>Assembleia Online</Label>
            </div>

            {formData.is_online ? (
              <div className="space-y-2">
                <Label>Link da Reunião</Label>
                <Input
                  value={formData.meeting_link}
                  onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                  placeholder="https://meet.google.com/..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Salão de Festas"
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Pauta</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAgendaItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Item
                </Button>
              </div>
              <div className="space-y-3">
                {formData.agenda.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start p-3 rounded-lg border border-[var(--border)]">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-medium text-sm shrink-0">
                      {item.order}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={item.topic}
                        onChange={(e) => updateAgendaItem(index, 'topic', e.target.value)}
                        placeholder="Título do item"
                      />
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateAgendaItem(index, 'description', e.target.value)}
                        placeholder="Descrição (opcional)"
                        rows={2}
                      />
                    </div>
                    {formData.agenda.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAgendaItem(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
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
                {editingAssembly ? 'Salvar' : 'Agendar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}