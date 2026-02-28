import type { Experience, HeadphoneSignature, CustomCategoryDef } from '../data/types';
import ExperienceCard from './ExperienceCard';

interface Props {
  experiences: Experience[];
  headphoneSignatures?: Record<string, HeadphoneSignature>;
  customCategories?: CustomCategoryDef[];
}

export default function ExperienceMap({ experiences, headphoneSignatures, customCategories }: Props) {
  return (
    <section>
      <div className="section-header">
        <span>experience map</span>
        <span className="section-header-accent">{'\u25C8 \u25C8 \u25C8'}</span>
      </div>
      {experiences.map((exp) => (
        <ExperienceCard
          key={exp.headphone.id}
          experience={exp}
          headphoneSignature={headphoneSignatures?.[exp.headphone.id]}
          customCategories={customCategories}
        />
      ))}
    </section>
  );
}
