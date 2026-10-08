import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';

import styles from '@/pages/common/RoleShell.module.css';

export default function SupportHomePage() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>Support dashboard</h1>
        <Button variant="secondary" onClick={logout}>
          Sign out
        </Button>
      </header>
      <Card title={`Hello, ${user?.name ?? 'Support'}`}>
        <p>Appeals and live chat tools will be added in Phase 4.</p>
      </Card>
    </div>
  );
}
