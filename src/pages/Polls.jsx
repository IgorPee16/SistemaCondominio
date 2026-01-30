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
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  ClipboardList, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Users,
  CheckCircle2,
  X
} from 'lucide-react';

export default function Polls() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    options: [{ text: '', votes: 0 }, { text: '', votes: 0 }],
    status: 'active',
    end_date: '',
    allow_multiple: false,
    is_anonymous: true
  });

  const queryClient = useQueryClient();

  const { data: polls = [], isLoading } = useQuery({
    queryKey: ['polls'],
    queryFn: () => base44.entities.Poll.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Poll.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Poll.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Poll.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPoll(null);
    setFormData({
      question: '',
      description: '',
      options: [{ text: '', votes: 0 }, { text: '', votes: 0 }],
      status: 'active',
      end_date: '',
      allow_multiple: false,
      is_anonymous: true
    });
  };

  const handleEdit = (poll) => {
    setEditingPoll(poll);
    setFormData({
      question: poll.question || '',
      description: poll.description || '',
      options: poll.options?.length ? poll.options : [{ text: '', votes: 0 }, { text: '', votes: 0 }],
      status: poll.status || 'active',
      end_date: poll.end_date || '',
      allow_multiple: poll.allow_multiple || false,
      is_anonymous: poll.is_anonymous ?? true
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      options: formData.options.filter(o => o.text.trim()),
      voters: []
    };
    
    if (editingPoll) {
      updateMutation.mutate({ id: editingPoll.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { text: '', votes: 0 }]
    });
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], text: value };
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      setFormData({
        ...formData,
        options: formData.options.filter((_, i) => i !== index)
      });
    }
  };

  const closePoll = (poll) => {
    updateMutation.mutate({
      id: poll.id,
      data: { ...poll, status: 'closed' }
    });
  };

  // Separate active and closed
  const activePolls = polls.filter(p => p.status === 'active');
  const closedPolls = polls.filter(p => p.status === 'closed');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enquetes"
        description="Enquetes rápidas para os moradores"
        primaryAction={{
          label: 'Nova Enquete',
          icon: Plus,
          onClick: () => setIsDialogOpen(true)
        }}
      />

      {polls.length === 0 && !isLoading ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma enquete"
          description="Crie enquetes para coletar opiniões dos moradores."
          actionLabel="Criar Enquete"
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <div className="space-y-8">
          {/* Active */}
          {activePolls.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-main)] mb-4 flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-700">Ativas</Badge>
              </h2>
              <div className="grid gap-4">
                {activePolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onClose={closePoll}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Closed */}
          {closedPolls.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-main)] mb-4 flex items-center gap-2">
                <Badge variant="outline">Encerradas</Badge>
              </h2>
              <div className="grid gap-4">
                {closedPolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    closed
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPoll ? 'Editar Enquete' : 'Nova Enquete'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Pergunta *</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Qual a sua opinião sobre..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mais detalhes sobre a enquete..."
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Opções *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                  />
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="shrink-0 text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Data limite</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Permitir múltiplas respostas</Label>
                <Switch
                  checked={formData.allow_multiple}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_multiple: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Votação anônima</Label>
                <Switch
                  checked={formData.is_anonymous}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
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
                {editingPoll ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PollCard({ poll, onEdit, onDelete, onClose, closed }) {
  const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;

  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)]">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{poll.question}</CardTitle>
            {poll.description && (
              <p className="text-sm text-[var(--text-muted)] mt-1">{poll.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(poll)}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {!closed && onClose && (
                <DropdownMenuItem onClick={() => onClose(poll)}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Encerrar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(poll.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Options with votes */}
        <div className="space-y-3">
          {poll.options?.map((option, index) => {
            const percentage = totalVotes > 0 ? Math.round((option.votes || 0) / totalVotes * 100) : 0;
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{option.text}</span>
                  <span className="text-[var(--text-muted)]">
                    {option.votes || 0} votos ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Users className="w-4 h-4" />
            <span>{totalVotes} votos</span>
          </div>
          <div className="flex items-center gap-2">
            {poll.end_date && (
              <span className="text-xs text-[var(--text-muted)]">
                Até {format(new Date(poll.end_date), 'dd/MM/yyyy')}
              </span>
            )}
            {closed ? (
              <Badge variant="outline">Encerrada</Badge>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-700">Ativa</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}