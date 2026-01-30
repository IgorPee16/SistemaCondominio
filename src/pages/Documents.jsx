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
  FileText, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Download,
  Upload,
  File,
  FileImage,
  FileSpreadsheet,
  Loader2,
  ExternalLink
} from 'lucide-react';

const categoryConfig = {
  minutes: { label: 'Atas', icon: FileText },
  contract: { label: 'Contratos', icon: File },
  invoice: { label: 'Notas Fiscais', icon: FileSpreadsheet },
  balance_sheet: { label: 'Balancetes', icon: FileSpreadsheet },
  regulation: { label: 'Regulamento', icon: FileText },
  convention: { label: 'Convenção', icon: FileText },
  report: { label: 'Relatórios', icon: FileText },
  other: { label: 'Outros', icon: File },
};

export default function Documents() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    file_url: '',
    file_type: '',
    reference_date: '',
    reference_month: '',
    tags: [],
    is_public: true
  });

  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Document.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDocument(null);
    setFormData({
      title: '',
      description: '',
      category: 'other',
      file_url: '',
      file_type: '',
      reference_date: '',
      reference_month: '',
      tags: [],
      is_public: true
    });
  };

  const handleEdit = (document) => {
    setEditingDocument(document);
    setFormData({
      title: document.title || '',
      description: document.description || '',
      category: document.category || 'other',
      file_url: document.file_url || '',
      file_type: document.file_type || '',
      reference_date: document.reference_date || '',
      reference_month: document.reference_month || '',
      tags: document.tags || [],
      is_public: document.is_public ?? true
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        file_url,
        file_type: file.type,
        title: formData.title || file.name.replace(/\.[^/.]+$/, '')
      });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingDocument) {
      updateMutation.mutate({ id: editingDocument.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filter
  const filteredDocuments = documents.filter(d => {
    const matchesSearch = d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return d.category === activeTab && matchesSearch;
  });

  // Stats by category
  const countByCategory = Object.keys(categoryConfig).reduce((acc, key) => {
    acc[key] = documents.filter(d => d.category === key).length;
    return acc;
  }, {});

  const columns = [
    {
      header: 'Documento',
      cell: (row) => {
        const config = categoryConfig[row.category] || categoryConfig.other;
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Icon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{row.title}</p>
              {row.description && (
                <p className="text-xs text-[var(--text-muted)] truncate">{row.description}</p>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Categoria',
      cell: (row) => (
        <Badge variant="outline">
          {categoryConfig[row.category]?.label || row.category}
        </Badge>
      )
    },
    {
      header: 'Data',
      cell: (row) => row.reference_date 
        ? format(new Date(row.reference_date), 'dd/MM/yyyy')
        : format(new Date(row.created_date), 'dd/MM/yyyy')
    },
    {
      header: '',
      width: '100px',
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.file_url && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-blue-600 hover:text-blue-700"
            >
              <a href={row.file_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
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
              {row.file_url && (
                <DropdownMenuItem asChild>
                  <a href={row.file_url} download>
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
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
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Central de documentos do condomínio"
        primaryAction={{
          label: 'Novo Documento',
          icon: Plus,
          onClick: () => setIsDialogOpen(true)
        }}
      />

      {/* Category cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(categoryConfig).slice(0, 4).map(([key, config]) => (
          <Card 
            key={key} 
            className="bg-[var(--bg-card)] border-[var(--border)] cursor-pointer hover:border-emerald-500 transition-colors"
            onClick={() => setActiveTab(key)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <config.icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{countByCategory[key] || 0}</p>
                <p className="text-xs text-[var(--text-muted)]">{config.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[var(--bg-card)] border border-[var(--border)] flex-wrap">
          <TabsTrigger value="all">Todos</TabsTrigger>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <TabsTrigger key={key} value={key}>{config.label}</TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4">
          {documents.length === 0 && !isLoading ? (
            <EmptyState
              icon={FileText}
              title="Nenhum documento"
              description="Faça upload de atas, contratos, balancetes e outros documentos."
              actionLabel="Adicionar Documento"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredDocuments}
              isLoading={isLoading}
              searchValue={searchQuery}
              onSearch={setSearchQuery}
              searchPlaceholder="Buscar documentos..."
              emptyMessage="Nenhum documento encontrado"
            />
          )}
        </div>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDocument ? 'Editar Documento' : 'Novo Documento'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File upload */}
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center">
                {formData.file_url ? (
                  <div className="flex items-center justify-center gap-2">
                    <File className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm">Arquivo anexado</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, file_url: '' })}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Enviando...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-muted)]">
                          Clique para selecionar um arquivo
                        </span>
                      </div>
                    )}
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nome do documento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Referência</Label>
                <Input
                  type="date"
                  value={formData.reference_date}
                  onChange={(e) => setFormData({ ...formData, reference_date: e.target.value })}
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
                {editingDocument ? 'Salvar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}