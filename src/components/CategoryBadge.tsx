import type { HeadphoneCategory, CustomCategoryDef, BuiltInCategory } from '../data/types';
import { BUILT_IN_CATEGORIES } from '../data/categoryDefaults';

export const CATEGORY_LABELS: Record<string, string> = {
  dark: 'Dark',
  bright: 'Bright',
  balanced: 'Balanced',
  unmatched: 'Unmatched',
  'v-shaped': 'V-Shaped',
  warm: 'Warm',
  analytical: 'Analytical',
  intimate: 'Intimate',
};

export function isBuiltIn(category: string): category is BuiltInCategory {
  return (BUILT_IN_CATEGORIES as readonly string[]).includes(category);
}

interface Props {
  category: HeadphoneCategory;
  customCategories?: CustomCategoryDef[];
  variant?: 'primary' | 'secondary';
}

export default function CategoryBadge({ category, customCategories = [], variant = 'primary' }: Props) {
  const secondaryClass = variant === 'secondary' ? ' category-badge-secondary' : '';

  if (isBuiltIn(category)) {
    return (
      <span className={`category-badge category-${category}${secondaryClass}`}>
        {CATEGORY_LABELS[category]}
      </span>
    );
  }

  const custom = customCategories.find((c) => c.id === category);
  if (custom) {
    return (
      <span
        className={`category-badge${secondaryClass}`}
        style={{
          color: custom.color,
          background: `${custom.color}1f`,
          border: `1px solid ${custom.color}40`,
        }}
      >
        {custom.name}
      </span>
    );
  }

  return (
    <span className={`category-badge category-unmatched${secondaryClass}`}>
      {category}
    </span>
  );
}

interface BadgeGroupProps {
  primary: HeadphoneCategory;
  secondary?: HeadphoneCategory[];
  customCategories?: CustomCategoryDef[];
}

export function CategoryBadgeGroup({ primary, secondary = [], customCategories }: BadgeGroupProps) {
  return (
    <span className="category-badge-group">
      <CategoryBadge category={primary} customCategories={customCategories} variant="primary" />
      {secondary.map((cat) => (
        <CategoryBadge key={cat} category={cat} customCategories={customCategories} variant="secondary" />
      ))}
    </span>
  );
}
