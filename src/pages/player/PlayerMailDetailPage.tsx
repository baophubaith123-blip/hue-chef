import { useParams } from 'react-router-dom';

import { MailDetail } from '@/features/mail/components/MailDetail';
import { useAuth } from '@/contexts/AuthContext';
import { PlayerShell } from '@/pages/player/PlayerShell';

export default function PlayerMailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  if (!user) return null;
  return (
    <PlayerShell>
      <MailDetail
        mailId={id ?? ''}
        userId={user.id}
        backHref="/inbox"
      />
    </PlayerShell>
  );
}
