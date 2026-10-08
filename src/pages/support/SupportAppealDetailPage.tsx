import { useNavigate, useParams } from 'react-router-dom';

import { AppealDetail } from '@/features/support/components/AppealDetail';
import { SupportShell } from '@/pages/support/SupportShell';

export default function SupportAppealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <SupportShell>
      <AppealDetail
        appealId={id ?? ''}
        onBack={() => navigate('/support/appeals')}
      />
    </SupportShell>
  );
}
