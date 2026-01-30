import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageHeader from '@/components/common/PageHeader';
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
  MessageSquare, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Pin,
  Bell,
  AlertTriangle,
  Calendar,
  Megaphone,
  Wrench,
  Eye
} from 'lucide-react';

const typeConfig = {
  notice: { label: 'Aviso', icon: Bell, color: 'bg-blue-100 text-blue-700' },
  alert: { label: 'Alerta', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  event: { label: 'Evento', icon: Calendar, color: 'bg-purple-100 text-purple-700' },
  maintenance: { label: 'Manutenção', icon: Wrench, color: 'bg-amber-100 text-amber-700' },
  general: { label: 'Geral', icon: Megaphone, color: 'bg-gray-100 text-gray-700' },
};

export default function Announcements() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'normal',
    publish_date: format(new Date(), 'yyyy-MM-dd'),
    expiry_date: '',
    is_pinned: false,
    send_notification: true
  });

  const queryClient = useQueryClient();

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Announcement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Announcement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      type: 'general',
      priority: 'normal',
      publish_date: format(new Date(), 'yyyy-MM-dd'),
      expiry_date: '',
      is_pinned: false,
      send_notification: true
    });
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title || '',
      content: announcement.content || '',
      type: announcement.type || 'general',
      priority: announcement.priority || 'normal',
      publish_date: announcement.publish_date || '',
      expiry_date: announcement.expiry_date || '',
      is_pinned: announcement.is_pinned || false,
      send_notification: announcement.send_notification ?? true
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const togglePin = (announcement) => {
    updateMutation.mutate({
      id: announcement.id,
      data: { ...announcement, is_pinned: !announcement.is_pinned }
    });
  };

  // Separate pinned and regular
  const pinned = announcements.filter(a => a.is_pinned);
  const regular = announcements.filter(a => !a.is_pinned);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comunicados"
        description="Mural de avisos e comunicados"
        primaryAction={{
          label: 'Novo Comunicado',
          icon: Plus,
          onClick: () => setIsDialogOpen(true)
        }}
      />

      {announcements.length === 0 && !isLoading ? (
        <EmptyState
          icon={MessageSquare}
          title="Nenhum comunicado"
          description="Publique avisos, alertas e comunicados para os moradores."
          actionLabel="Criar Comunicado"
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Pinned */}
          {pinned.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--text-muted)] mb-3 flex items-center gap-2">
                <Pin className="w-4 h-4" />
                Fixados
              </h2>
              <div className="grid gap-4">
                {pinned.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onTogglePin={togglePin}
                    isPinned
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular */}
          <div>
            {pinned.length > 0 && (
              <h2 className="text-sm font-medium text-[var(--text-muted)] mb-3">
                Comunicados Recentes
              </h2>
            )}
            <div className="grid gap-4">
              {regular.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={handleEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onTogglePin={togglePin}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Editar Comunicado' : 'Novo Comunicado'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título do comunicado"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Escreva o comunicado..."
                rows={5}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Publicação</Label>
                <Input
                  type="date"
                  value={formData.publish_date}
                  onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expira em</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Fixar no topo</Label>
                <Switch
                  checked={formData.is_pinned}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enviar notificação</Label>
                <Switch
                  checked={formData.send_notification}
                  onCheckedChange={(checked) => setFormData({ ...formData, send_notification: checked })}
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
                {editingAnnouncement ? 'Salvar' : 'Publicar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnnouncementCard({ announcement, onEdit, onDelete, onTogglePin, isPinned }) {
  const config = typeConfig[announcement.type] || typeConfig.general;
  const Icon = config.icon;

  return (
    <Card className={`bg-[var(--bg-card)] border-[var(--border)] card-hover ${isPinned ? 'border-l-4 border-l-emerald-500' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 ${config.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-[var(--text-main)] truncate">
                  {announcement.title}
                </h3>
                {isPinned && <Pin className="w-3 h-3 text-emerald-500 shrink-0" />}
                {announcement.priority === 'high' && (
                  <Badge className="bg-red-100 text-red-700 shrink-0">Urgente</Badge>
                )}
              </div>
              <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-3">
                {announcement.content}
              </p>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <Badge variant="outline" className={config.color}>{config.label}</Badge>
                <span>
                  {format(new Date(announcement.publish_date || announcement.created_date), "dd 'de' MMM", { locale: ptBR })}
                </span>
                {announcement.read_by?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {announcement.read_by.length} visualizações
                  </span>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(announcement)}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePin(announcement)}>
                <Pin className="w-4 h-4 mr-2" />
                {isPinned ? 'Desafixar' : 'Fixar'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(announcement.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}