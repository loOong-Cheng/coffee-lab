import { useI18n } from '../../i18n';
import { EmptyState } from '../../ui/primitives/misc';
import { DiagnoseView } from './DiagnoseView';
import { ExplainView } from './ExplainView';
import { IdentifyView } from './IdentifyView';
import { ParameterLabView } from './ParameterLabView';
import { GuidedPracticePreview, SpatialPracticeCard } from './PracticeCards';
import { QuizView } from './QuizView';
import { ReflectView } from './ReflectView';
import { SequenceView } from './SequenceView';
import { S } from './strings';
import type { ActivityProps } from './types';
import './activities.css';

/** Picks the 2D view for an activity kind. Unknown kinds degrade to a friendly message (never a crash). */
export function ActivityRenderer(props: ActivityProps) {
  const { t } = useI18n();
  const { activity } = props;
  switch (activity.kind) {
    case 'explain':
      return <ExplainView {...props} activity={activity} />;
    case 'identify':
      return <IdentifyView {...props} activity={activity} />;
    case 'sequence':
      return <SequenceView {...props} activity={activity} />;
    case 'quiz':
      return <QuizView {...props} activity={activity} />;
    case 'parameter-lab':
      return <ParameterLabView {...props} activity={activity} />;
    case 'diagnose':
      return <DiagnoseView {...props} activity={activity} />;
    case 'reflect':
      return <ReflectView {...props} activity={activity} />;
    case 'guided-practice':
      return <GuidedPracticePreview {...props} activity={activity} />;
    case 'spatial-practice':
      return <SpatialPracticeCard {...props} activity={activity} />;
    default:
      return <EmptyState title={t(S.unknownKind)} />;
  }
}
