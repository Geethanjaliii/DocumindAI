import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onActionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onActionClick,
}) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon-container">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionText && onActionClick && (
        <Button variant="outline" onClick={onActionClick}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
