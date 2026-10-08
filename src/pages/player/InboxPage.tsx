import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { InboxList } from '@/features/mail/components/InboxList';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

export default function InboxPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <PlayerShell>
      <InboxList
        userId={user.id}
        baseDetailPath="/inbox"
        headerExtra={
          <Button variant="secondary" onClick={() => navigate('/support/chat')}>
            💬 {t('nav.chat')}
          </Button>
        }
      />
    </PlayerShell>
  );
}
