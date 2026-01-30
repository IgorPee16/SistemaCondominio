import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Download, Filter } from 'lucide-react';

export default function PageHeader({ 
  title, 
  description, 
  primaryAction, 
  secondaryActions,
  children 
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">{title}</h1>
          {description && (
            <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondaryActions}
          {primaryAction && (
            <Button 
              onClick={primaryAction.onClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4 mr-2" />}
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}