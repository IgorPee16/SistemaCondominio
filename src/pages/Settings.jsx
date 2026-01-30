import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Save, 
  Upload,
  Loader2,
  Bell,
  Shield,
  Palette,
  Users
} from 'lucide-react';

export default function Settings() {
  const [isUploading, setIsUploading] = useState(false);
  const [condoData, setCondoData] = useState({
    name: '',
    address: '',
    cnpj: '',
    city: '',
    state: '',
    zip_code: '',
    total_units: '',
    total_blocks: '',
    logo_url: ''
  });

  const queryClient = useQueryClient();

  const { data: condominiums = [] } = useQuery({
    queryKey: ['condominium'],
    queryFn: () => base44.entities.Condominium.list(),
  });

  const condominium = condominiums[0];

  useEffect(() => {
    if (condominium) {
      setCondoData({
        name: condominium.name || '',
        address: condominium.address || '',
        cnpj: condominium.cnpj || '',
        city: condominium.city || '',
        state: condominium.state || '',
        zip_code: condominium.zip_code || '',
        total_units: condominium.total_units || '',
        total_blocks: condominium.total_blocks || '',
        logo_url: condominium.logo_url || ''
      });
    }
  }, [condominium]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (condominium) {
        return base44.entities.Condominium.update(condominium.id, data);
      }
      return base44.entities.Condominium.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['condominium'] });
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCondoData({ ...condoData, logo_url: file_url });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    const data = {
      ...condoData,
      total_units: condoData.total_units ? parseInt(condoData.total_units) : null,
      total_blocks: condoData.total_blocks ? parseInt(condoData.total_blocks) : null
    };
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Configurações gerais do sistema"
      />

      <Tabs defaultValue="condominium">
        <TabsList className="bg-[var(--bg-card)] border border-[var(--border)]">
          <TabsTrigger value="condominium">
            <Building2 className="w-4 h-4 mr-2" />
            Condomínio
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="condominium" className="space-y-6 mt-6">
          {/* Logo and Basic Info */}
          <Card className="bg-[var(--bg-card)] border-[var(--border)]">
            <CardHeader>
              <CardTitle>Informações do Condomínio</CardTitle>
              <CardDescription>Dados básicos de identificação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-[var(--border)]">
                  {condoData.logo_url ? (
                    <img src={condoData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <div>
                  <Label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                    />
                    <Button variant="outline" disabled={isUploading} asChild>
                      <span>
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Alterar Logo
                          </>
                        )}
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    PNG, JPG até 2MB. Recomendado: 200x200px
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome do Condomínio *</Label>
                  <Input
                    value={condoData.name}
                    onChange={(e) => setCondoData({ ...condoData, name: e.target.value })}
                    placeholder="Ex: Condomínio Residencial Solar"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={condoData.cnpj}
                    onChange={(e) => setCondoData({ ...condoData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={condoData.zip_code}
                    onChange={(e) => setCondoData({ ...condoData, zip_code: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={condoData.address}
                    onChange={(e) => setCondoData({ ...condoData, address: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={condoData.city}
                    onChange={(e) => setCondoData({ ...condoData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={condoData.state}
                    onChange={(e) => setCondoData({ ...condoData, state: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total de Blocos</Label>
                  <Input
                    type="number"
                    value={condoData.total_blocks}
                    onChange={(e) => setCondoData({ ...condoData, total_blocks: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total de Unidades</Label>
                  <Input
                    type="number"
                    value={condoData.total_units}
                    onChange={(e) => setCondoData({ ...condoData, total_units: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSave}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card className="bg-[var(--bg-card)] border-[var(--border)]">
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>Configure como e quando receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Novas Ocorrências</p>
                    <p className="text-sm text-[var(--text-muted)]">Receber notificação ao abrir nova ocorrência</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Reservas Pendentes</p>
                    <p className="text-sm text-[var(--text-muted)]">Notificar sobre reservas aguardando aprovação</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Inadimplência</p>
                    <p className="text-sm text-[var(--text-muted)]">Alertas de boletos vencidos</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Contratos a Vencer</p>
                    <p className="text-sm text-[var(--text-muted)]">Lembrete de contratos próximos ao vencimento</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Assembleias</p>
                    <p className="text-sm text-[var(--text-muted)]">Lembretes de assembleias agendadas</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <Card className="bg-[var(--bg-card)] border-[var(--border)]">
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>Gerencie a segurança e privacidade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticação em duas etapas</p>
                    <p className="text-sm text-[var(--text-muted)]">Adicione uma camada extra de segurança</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Log de Ações</p>
                    <p className="text-sm text-[var(--text-muted)]">Registrar todas as ações no sistema</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Backup Automático</p>
                    <p className="text-sm text-[var(--text-muted)]">Backup diário dos dados</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-card)] border-[var(--border)]">
            <CardHeader>
              <CardTitle>LGPD</CardTitle>
              <CardDescription>Conformidade com a Lei Geral de Proteção de Dados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                O sistema está em conformidade com a LGPD, garantindo a proteção dos dados pessoais dos moradores e funcionários.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Criptografia de dados sensíveis</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Controle de acesso por perfil</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Registro de consentimento</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Direito ao esquecimento</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}