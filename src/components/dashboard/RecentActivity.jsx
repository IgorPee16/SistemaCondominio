import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AlertTriangle, 
  DollarSign, 
  Calendar, 
  UserPlus, 
  MessageSquare,
  Package,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { cn } from "@/lib/utils";

const activityIcons = {
  occurrence: AlertTriangle,
  payment: DollarSign,
  reservation: Calendar,
  resident: UserPlus,
  announcement: MessageSquare,
  visitor: Package,
};

const activityColors = {
  occurrence: 'text-amber-500 bg-amber-500/10',
  payment: 'text-emerald-500 bg-emerald-500/10',
  reservation: 'text-blue-500 bg-blue-500/10',
  resident: 'text-purple-500 bg-purple-500/10',
  announcement: 'text-pink-500 bg-pink-500/10',
  visitor: 'text-cyan-500 bg-cyan-500/10',
};

export default function RecentActivity({ activities = [] }) {
  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[var(--text-main)]">
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              Nenhuma atividade recente
            </p>
          ) : (
            activities.map((activity, index) => {
              const Icon = activityIcons[activity.type] || Clock;
              return (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    activityColors[activity.type] || 'text-gray-500 bg-gray-500/10'
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-main)] truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-[var(--text-muted)]">
                      {activity.time}
                    </p>
                    {activity.status && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "mt-1 text-xs",
                          activity.status === 'resolved' && "bg-emerald-100 text-emerald-700",
                          activity.status === 'pending' && "bg-amber-100 text-amber-700",
                          activity.status === 'urgent' && "bg-red-100 text-red-700"
                        )}
                      >
                        {activity.status === 'resolved' && 'Resolvido'}
                        {activity.status === 'pending' && 'Pendente'}
                        {activity.status === 'urgent' && 'Urgente'}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}