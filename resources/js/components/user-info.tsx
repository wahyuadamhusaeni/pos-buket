import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();
    const role = (user as User & { role?: string }).role;

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-lg">
                <AvatarImage src={(user as { avatar?: string }).avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-xs font-bold text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold">{user.name}</span>
                    {role && (
                        <span className={`shrink-0 rounded px-1 py-px text-[9px] font-bold uppercase tracking-wider ${
                            role === 'owner'
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
                                : 'bg-neutral-100 text-neutral-500 dark:bg-white/10 dark:text-neutral-400'
                        }`}>
                            {role}
                        </span>
                    )}
                </div>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
