import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserBadgeProps {
  username: string;
  isAdmin?: boolean;
  className?: string;
}

export function UserBadge({ username, isAdmin, className }: UserBadgeProps) {
  return (
    <span className={cn("flex items-center gap-1", className)}>
      {isAdmin && <Crown className="h-4 w-4 text-red-500" />}
      <span className={cn(isAdmin && "text-red-500 font-medium")}>
        {username}
      </span>
    </span>
  );
}
