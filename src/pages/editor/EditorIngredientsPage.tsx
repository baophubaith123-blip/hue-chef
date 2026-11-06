import {
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/FileUpload';
import { Modal } from '@/components/Modal';
import { Toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { isEmoji, useIngredients } from '@/contexts/IngredientContext';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import type { Ingredient } from '@/data/types';
import { AddNewSelect } from '@/features/editor/components/AddNewSelect';
import { TaxonomyManager } from '@/features/editor/components/TaxonomyManager';
import type { ChatAttachment } from '@/features/support/types';
import { useTranslation } from '@/i18n/useTranslation';
import { EditorShell } from '@/pages/editor/EditorShell';

import styles from '@/pages/editor/EditorIngredientsPage.module.css';

type FilterType = 'all' | 'has-image' | 'emoji-only';

export default function EditorIngredientsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    ingredientCategoryOptions,
    ingredientCategoryLabel,
    addCategory,
    units,
    addUnit,
  } = useTaxonomy();
  const {
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    isIngredientUsed,
  } = useIngredients();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Ingredient['category']>('protein');
  const [fallbackEmoji, setFallbackEmoji] = useState('');
  const [unit, setUnit] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Deletion modal & Toast
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  } | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('protein');
    setFallbackEmoji('');
    setUnit('');
    setDescription('');
    setImage(undefined);
    setFormError(null);
  };

  const handleStartEdit = (item: Ingredient) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setFallbackEmoji(item.fallbackEmoji);
    setUnit(item.unit ?? '');
    setDescription(item.description ?? '');
    setImage(item.image);
    setFormError(null);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError(t('errors.required'));
      return;
    }

    const trimmedEmoji = fallbackEmoji.trim();
    if (!trimmedEmoji || !isEmoji(trimmedEmoji)) {
      setFormError(t('errors.emojiRequired'));
      return;
    }

    // Check duplicate name case-insensitively
    const isDuplicate = ingredients.some(
      (item) =>
        item.id !== editingId &&
        item.name.toLowerCase().trim() === trimmedName.toLowerCase(),
    );
    if (isDuplicate) {
      setFormError(t('errors.duplicateIngredientName'));
      return;
    }

    try {
      if (editingId) {
        updateIngredient(editingId, {
          name: trimmedName,
          category,
          fallbackEmoji: trimmedEmoji,
          unit: unit.trim() || undefined,
          description: description.trim() || undefined,
          image,
        });
      } else {
        addIngredient({
          name: trimmedName,
          category,
          fallbackEmoji: trimmedEmoji,
          unit: unit.trim() || undefined,
          description: description.trim() || undefined,
          image,
        });
      }
      resetForm();
      setToast({
        message: t('editor.saveSuccess'),
        type: 'success',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    }
  };

  const handleRequestDelete = (item: Ingredient) => {
    setFormError(null);
    const usage = isIngredientUsed(item.id);
    if (usage.used) {
      const msg = t('errors.ingredientInUse', {
        recipes: usage.recipeNames.join(', '),
      });
      setToast({
        message: msg,
        type: 'warning',
      });
      return;
    }

    setDeleteTarget(item);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    try {
      deleteIngredient(deleteTarget.id);
      if (editingId === deleteTarget.id) {
        resetForm();
      }
      setToast({
        message: t('editor.deleteSuccess'),
        type: 'success',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setToast({
        message: msg,
        type: 'error',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const fileAttachment: ChatAttachment | null = image
    ? {
        id: 'ingredient-image-preview',
        name: name ? `${name}.png` : 'ingredient.png',
        sizeKB: Math.round((image.length * 0.75) / 1024),
        type: 'image/png',
        dataUrl: image,
      }
    : null;

  const filteredIngredients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return ingredients.filter((item) => {
      const matchesSearch = !term || item.name.toLowerCase().includes(term);
      if (!matchesSearch) return false;
      if (filterType === 'has-image') {
        return Boolean(item.image);
      }
      if (filterType === 'emoji-only') {
        return !item.image;
      }
      return true;
    });
  }, [ingredients, searchTerm, filterType]);

  return (
    <EditorShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t('editor.ingredientMgmtTitle')}</h1>
          <p className={styles.subtitle}>{t('editor.ingredientMgmtIntro')}</p>
        </header>

        <div className={styles.layout}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>
              {editingId ? t('editor.editIngredient') : t('editor.addIngredient')}
            </h2>

            <form onSubmit={handleSubmit} className={styles.form}>
              {formError ? <p className={styles.formError}>{formError}</p> : null}

              <div className={styles.field}>
                <label className={styles.label} htmlFor="ing-name">
                  {t('editor.ingredientName')} *
                </label>
                <input
                  id="ing-name"
                  type="text"
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('editor.ingredientNamePlaceholder')}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="ing-emoji">
                  {t('editor.ingredientEmoji')} *
                </label>
                <input
                  id="ing-emoji"
                  type="text"
                  className={styles.input}
                  value={fallbackEmoji}
                  onChange={(e) => setFallbackEmoji(e.target.value)}
                  placeholder="🌾"
                  maxLength={5}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="ing-category">
                  {t('editor.ingredientCategory')}
                </label>
                <AddNewSelect
                  id="ing-category"
                  selectClassName={styles.select}
                  value={category}
                  options={ingredientCategoryOptions.map((option) => ({
                    value: option.id,
                    label: ingredientCategoryLabel(option.id),
                  }))}
                  addOptionLabel={t('taxonomy.addCategoryOption')}
                  newPlaceholder={t('taxonomy.newCategoryPlaceholder')}
                  onChange={(value) => setCategory(value)}
                  onAddNew={(name) => {
                    try {
                      return addCategory('ingredient', name, user?.id ?? 'seed-editor').id;
                    } catch {
                      return null;
                    }
                  }}
                />
                <TaxonomyManager kind="ingredient" />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="ing-unit">
                  {t('editor.ingredientUnit')}
                </label>
                <AddNewSelect
                  id="ing-unit"
                  selectClassName={styles.select}
                  value={unit}
                  options={[
                    { value: '', label: '—' },
                    ...units.map((u) => ({ value: u, label: u })),
                    ...(unit && !units.includes(unit) ? [{ value: unit, label: unit }] : []),
                  ]}
                  addOptionLabel={t('taxonomy.addUnitOption')}
                  newPlaceholder={t('taxonomy.newUnitPlaceholder')}
                  onChange={(value) => setUnit(value)}
                  onAddNew={(name) => {
                    addUnit(name);
                    return name.trim();
                  }}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="ing-desc">
                  {t('editor.ingredientDescription')}
                </label>
                <textarea
                  id="ing-desc"
                  className={styles.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="..."
                />
              </div>

              <div className={styles.field}>
                <FileUpload
                  label={t('editor.ingredientImage')}
                  options={{
                    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
                    maxSizeMB: 2,
                  }}
                  value={fileAttachment}
                  onChange={(attachment) =>
                    setImage(attachment ? attachment.dataUrl : undefined)
                  }
                  onError={(_code, msg) => setFormError(msg)}
                  compact
                />
              </div>

              <div className={styles.formActions}>
                <Button type="submit">
                  {editingId ? t('editor.saveIngredient') : t('editor.addIngredient')}
                </Button>
                {editingId ? (
                  <Button variant="secondary" onClick={resetForm}>
                    {t('editor.cancelEdit')}
                  </Button>
                ) : null}
              </div>
            </form>
          </div>

          <div className={styles.listCard}>
            <div className={styles.listHeader}>
              <div className={styles.listTitleWrap}>
                <h2 className={styles.listTitle}>{t('editor.ingredientList')}</h2>
                <span className={styles.badgeCount}>{filteredIngredients.length}</span>
              </div>
            </div>

            <div className={styles.listControls}>
              <input
                type="search"
                className={styles.searchInput}
                placeholder={t('editor.searchIngredient')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className={styles.filterSelect}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
              >
                <option value="all">{t('editor.filterAll')}</option>
                <option value="has-image">{t('editor.filterHasImage')}</option>
                <option value="emoji-only">{t('editor.filterEmojiOnly')}</option>
              </select>
            </div>

            {filteredIngredients.length === 0 ? (
              <p className={styles.emptyNotice}>{t('editor.noIngredients')}</p>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>{t('editor.ingredientEmoji')}</th>
                      <th className={styles.th}>{t('editor.ingredientName')}</th>
                      <th className={styles.th}>{t('editor.ingredientCategory')}</th>
                      <th className={styles.th}>{t('editor.ingredientUnit')}</th>
                      <th className={styles.th}>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIngredients.map((item) => {
                      const usage = isIngredientUsed(item.id);
                      return (
                        <tr key={item.id}>
                          <td className={`${styles.td} ${styles.emojiCell}`}>
                            {item.fallbackEmoji}
                          </td>
                          <td className={styles.td}>
                            <div className={styles.nameCell}>
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className={styles.tableThumb}
                                />
                              ) : null}
                              <span>{item.name}</span>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <span className={styles.categoryBadge}>
                              {ingredientCategoryLabel(item.category)}
                            </span>
                          </td>
                          <td className={styles.td}>
                            {item.unit ? (
                              item.unit
                            ) : (
                              <span className={styles.dimText}>—</span>
                            )}
                          </td>
                          <td className={styles.td}>
                            <div className={styles.rowActions}>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => handleStartEdit(item)}
                              >
                                {t('common.edit')}
                              </button>
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                onClick={() => handleRequestDelete(item)}
                                title={
                                  usage.used
                                    ? t('errors.ingredientInUse', {
                                        recipes: usage.recipeNames.join(', '),
                                      })
                                    : t('common.delete')
                                }
                              >
                                {t('common.delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Confirmation for Delete */}
        <Modal
          title={t('editor.confirmDeleteTitle')}
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          footer={
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={handleConfirmDelete}>
                {t('common.delete')}
              </Button>
            </div>
          }
        >
          <div className={styles.modalContent}>
            {deleteTarget
              ? t('editor.confirmDeleteMessage', { name: deleteTarget.name })
              : null}
          </div>
        </Modal>

        {/* Toast notification */}
        {toast ? (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        ) : null}
      </div>
    </EditorShell>
  );
}
