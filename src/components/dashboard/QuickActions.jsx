import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  FileText, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  MessageSquare,
  Package
} from 'lucide-react';

const quickActions = [
  { label: 'Nova Ocorrência', icon: AlertTriangle, page: 'Occurrences', color: 'bg-amber-500' },
  { label: 'Nova Reserva', icon: Calendar, page: 'Reservations', color: 'bg-blue-500' },
  { label: 'Registrar Visitante', icon: Package, page: 'Visitors', color: 'bg-cyan-500' },
  { label: 'Novo Comunicado', icon: MessageSquare, page: 'Announcements', color: 'bg-pink-500' },
  { label: 'Novo Morador', icon: Users, page: 'Residents', color: 'bg-purple-500' },
  { label: 'Lançar Despesa', icon: DollarSign, page: 'Financial', color: 'bg-emerald-500' },
];

export default function QuickActions() {
  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[var(--text-main)]">
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map((action, index) => (
            <Link key={index} to={createPageUrl(action.page)}>
              <Button 
                variant="outline" 
                className="w-full h-auto py-4 flex-col gap-2 border-[var(--border)] hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium text-[var(--text-main)]">
                  {action.label}
                </span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}