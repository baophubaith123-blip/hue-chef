import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';

import styles from '@/pages/common/RoleShell.module.css';

export default function AdminHomePage() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>Admin console</h1>
        <Button variant="secondary" onClick={logout}>
          Sign out
        </Button>
      </header>
      <Card title={`Hello, ${user?.name ?? 'Admin'}`}>
        <p>User management, audit logs, and moderation ship in later phases.</p>
      </Card>
    </div>
  );
}
