import type { Experience, HeadphoneSignature, CustomCategoryDef } from '../data/types';
import StrengthBars from './StrengthBars';
import { CategoryBadgeGroup } from './CategoryBadge';

interface Props {
  experience: Experience;
  headphoneSignature?: HeadphoneSignature | null;
  customCategories?: CustomCategoryDef[];
}

export default function ExperienceCard({ experience, headphoneSignature, customCategories }: Props) {
  const { headphone, scheme, tagline, description, bars } = experience;

  return (
    <div
      className="experience-card"
      data-scheme={scheme}
      data-testid={`experience-card-${headphone.id}`}
    >
      <div className="hp-header">
        <div className="hp-name-row">
          <div className="hp-icon">{'\u{1F3A7}'}</div>
          <span className="hp-name">{headphone.name}</span>
        </div>
        <div className="hp-header-right">
          {headphoneSignature && (
            <CategoryBadgeGroup
              primary={headphoneSignature.category}
              secondary={headphoneSignature.secondaryCategories}
              customCategories={customCategories}
            />
          )}
          <span className="hp-specs">{headphone.specs}</span>
        </div>
      </div>
      <div className="hp-tagline">{tagline}</div>
      <div className="hp-description">{description}</div>
      <StrengthBars bars={bars} />
    </div>
  );
}
