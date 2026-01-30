import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { cn } from "@/lib/utils";

const commonAreas = [
  { name: 'Salão de Festas', capacity: 50, fee: 200 },
  { name: 'Churrasqueira', capacity: 20, fee: 100 },
  { name: 'Quadra Esportiva', capacity: 20, fee: 0 },
  { name: 'Piscina (uso exclusivo)', capacity: 30, fee: 150 },
  { name: 'Sala de Reuniões', capacity: 15, fee: 50 },
];

export default function Reservations() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    area_name: '',
    unit_id: '',
    unit_display: '',
    resident_name: '',
    date: '',
    start_time: '',
    end_time: '',
    guests_count: '',
    purpose: '',
    status: 'pending'
  });

  const queryClient = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list('-date'),
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
    mutationFn: (data) => base44.entities.Reservation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reservation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedDate(null);
    setFormData({
      area_name: '',
      unit_id: '',
      unit_display: '',
      resident_name: '',
      date: '',
      start_time: '',
      end_time: '',
      guests_count: '',
      purpose: '',
      status: 'pending'
    });
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const area = commonAreas.find(a => a.name === formData.area_name);
    const data = {
      ...formData,
      guests_count: formData.guests_count ? parseInt(formData.guests_count) : null,
      fee_amount: area?.fee || 0
    };
    createMutation.mutate(data);
  };

  const handleUnitChange = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    const resident = residents.find(r => r.unit_id === unitId && r.type === 'owner');
    setFormData({
      ...formData,
      unit_id: unitId,
      unit_display: unit ? `${unit.block} - ${unit.number}` : '',
      resident_name: resident?.name || ''
    });
  };

  const approveReservation = (reservation) => {
    updateMutation.mutate({
      id: reservation.id,
      data: { ...reservation, status: 'approved' }
    });
  };

  const rejectReservation = (reservation) => {
    updateMutation.mutate({
      id: reservation.id,
      data: { ...reservation, status: 'rejected' }
    });
  };

  // Calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days
  const startPadding = monthStart.getDay();
  const paddedDays = [...Array(startPadding).fill(null), ...days];

  const getReservationsForDate = (date) => {
    if (!date) return [];
    return reservations.filter(r => 
      r.date && isSameDay(new Date(r.date), date) && r.status !== 'cancelled'
    );
  };

  // Stats
  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const todayReservations = reservations.filter(r => 
    r.date && isSameDay(new Date(r.date), new Date()) && r.status === 'approved'
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservas"
        description="Gestão de reservas de áreas comuns"
        primaryAction={{
          label: 'Nova Reserva',
          icon: Plus,
          onClick: () => setIsDialogOpen(true)
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 bg-[var(--bg-card)] border-[var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-[var(--text-muted)] py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, index) => {
                if (!day) {
                  return <div key={`pad-${index}`} className="h-24" />;
                }

                const dayReservations = getReservationsForDate(day);
                const hasReservations = dayReservations.length > 0;

                return (
                  <div
                    key={day.toString()}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "h-24 p-1 border border-[var(--border)] rounded-lg cursor-pointer transition-all hover:border-emerald-500",
                      isToday(day) && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
                      !isSameMonth(day, currentMonth) && "opacity-40"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      isToday(day) && "text-emerald-600"
                    )}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      {dayReservations.slice(0, 2).map((res, i) => (
                        <div
                          key={i}
                          className={cn(
                            "text-xs px-1 py-0.5 rounded truncate",
                            res.status === 'approved' && "bg-emerald-100 text-emerald-700",
                            res.status === 'pending' && "bg-amber-100 text-amber-700",
                            res.status === 'rejected' && "bg-red-100 text-red-700"
                          )}
                        >
                          {res.area_name}
                        </div>
                      ))}
                      {dayReservations.length > 2 && (
                        <div className="text-xs text-[var(--text-muted)]">
                          +{dayReservations.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Pending approvals */}
          <Card className="bg-[var(--bg-card)] border-[var(--border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Aguardando Aprovação ({pendingCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reservations.filter(r => r.status === 'pending').slice(0, 5).map(reservation => (
                <div key={reservation.id} className="p-3 rounded-lg border border-[var(--border)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{reservation.area_name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {reservation.unit_display} • {format(new Date(reservation.date), 'dd/MM')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => approveReservation(reservation)}
                        disabled={updateMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => rejectReservation(reservation)}
                        disabled={updateMutation.isPending}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingCount === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  Nenhuma reserva pendente
                </p>
              )}
            </CardContent>
          </Card>

          {/* Today */}
          <Card className="bg-[var(--bg-card)] border-[var(--border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Hoje ({todayReservations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayReservations.map(reservation => (
                <div key={reservation.id} className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="font-medium text-sm">{reservation.area_name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {reservation.start_time} - {reservation.end_time} • {reservation.unit_display}
                  </p>
                </div>
              ))}
              {todayReservations.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  Nenhuma reserva para hoje
                </p>
              )}
            </CardContent>
          </Card>

          {/* Common Areas */}
          <Card className="bg-[var(--bg-card)] border-[var(--border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Áreas Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {commonAreas.map(area => (
                <div key={area.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="text-sm">{area.name}</span>
                  {area.fee > 0 ? (
                    <Badge variant="outline">R$ {area.fee}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-600">Grátis</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Reserva</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Área *</Label>
              <Select 
                value={formData.area_name} 
                onValueChange={(value) => setFormData({ ...formData, area_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  {commonAreas.map(area => (
                    <SelectItem key={area.name} value={area.name}>
                      {area.name} {area.fee > 0 && `(R$ ${area.fee})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="grid grid-cols-3 gap-4">
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
                <Label>Início</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Término</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Número de Convidados</Label>
              <Input
                type="number"
                value={formData.guests_count}
                onChange={(e) => setFormData({ ...formData, guests_count: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Finalidade</Label>
              <Textarea
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Ex: Festa de aniversário"
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
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Solicitar Reserva
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}