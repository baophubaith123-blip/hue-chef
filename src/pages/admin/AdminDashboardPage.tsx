import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';

import styles from '@/pages/admin/AdminDashboardPage.module.css';

const STATUS_COLORS: Record<string, string> = {
  draft: '#bfa07a',
  pending: '#b03e26',
  approved: '#15803d',
  rejected: '#b42318',
};

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { recipeCategoryLabel } = useTaxonomy();
  const { user } = useAuth();
  const { recipes, getPendingRecipes } = useRecipes();
  const pendingCount = getPendingRecipes().length;

  const statusStats = useMemo(() => {
    const counts: Record<string, number> = {
      draft: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    for (const r of recipes) {
      const status = r.status ?? 'approved';
      if (status in counts) counts[status] += 1;
    }
    return Object.entries(counts).map(([name, value]) => ({
      name: t(`recipeStatus.${name}`),
      value,
      fill: STATUS_COLORS[name] ?? '#bfa07a',
    }));
  }, [recipes, t]);

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of recipes) {
      map[r.category] = (map[r.category] ?? 0) + 1;
    }
    return Object.entries(map)
      .map(([name, value]) => ({
        name: recipeCategoryLabel(name),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [recipes, recipeCategoryLabel]);

  const totalApproved = statusStats.find((s) => s.name === t('recipeStatus.approved'))?.value ?? 0;

  return (
    <AdminShell>
      <Card title={`${t('admin.dashboardGreeting')}, ${user?.name ?? 'Admin'}`}>
        <p>{t('admin.dashboardIntro')}</p>
        <div className={styles.statsRow}>
          <StatCard
            label={t('admin.statPending')}
            value={pendingCount}
            tone="warning"
            highlight={pendingCount > 0}
          />
          <StatCard label={t('editor.statApproved')} value={totalApproved} tone="success" />
          <StatCard
            label={t('editor.statDraft')}
            value={recipes.filter((r) => (r.status ?? 'draft') === 'draft').length}
            tone="muted"
          />
        </div>
        <div className={styles.actions}>
          <Link to="/admin/review">
            <Button>{t('admin.openQueue')}</Button>
          </Link>
        </div>
      </Card>

      <div className={styles.charts}>
        <Card title={t('admin.chartApproval')}>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusStats}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={3}
                  label={({ name, percent }) =>
                    percent != null && percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                  }
                  labelLine
                >
                  {statusStats.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={t('recipe.category')}>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryStats} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--td-paper-edge)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--td-paper-text-muted)" />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  stroke="var(--td-paper-text-muted)"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--td-paper-edge)',
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {categoryStats.map((_, index) => (
                    <Cell key={index} fill={index % 2 === 0 ? '#4a1525' : '#e9a23b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  tone = 'muted',
  highlight = false,
}: {
  label: string;
  value: number;
  tone?: 'muted' | 'warning' | 'success';
  highlight?: boolean;
}) {
  const bg: Record<string, string> = {
    muted: 'var(--td-paper-deep)',
    warning: 'rgba(233, 162, 59, 0.15)',
    success: 'rgba(21, 128, 61, 0.12)',
  };
  const fg: Record<string, string> = {
    muted: 'var(--td-paper-text-muted)',
    warning: 'var(--td-warning-strong)',
    success: 'var(--td-success-strong)',
  };
  return (
    <div
      className={styles.stat}
      style={{
        background: bg[tone],
        border: highlight ? `2px solid ${fg[tone]}` : '1px solid var(--td-paper-edge)',
      }}
    >
      <span className={styles.statLabel} style={{ color: fg[tone] }}>
        {label}
      </span>
      <span className={styles.statValue} style={{ color: fg[tone] }}>
        {value}
      </span>
    </div>
  );
}
