import { RouteStep as RouteStepType } from '../types';

interface Props {
  step: RouteStepType;
  isRestricted: boolean;
}

const MANEUVER_ICONS: Record<string, string> = {
  'turn-left':             'turn_left',
  'turn-right':            'turn_right',
  'turn-sharp-left':       'turn_sharp_left',
  'turn-sharp-right':      'turn_sharp_right',
  'turn-slight-left':      'turn_slight_left',
  'turn-slight-right':     'turn_slight_right',
  'straight':              'straight',
  'ramp-left':             'ramp_left',
  'ramp-right':            'ramp_right',
  'merge':                 'merge',
  'fork-left':             'fork_left',
  'fork-right':            'fork_right',
  'ferry':                 'directions_boat',
  'roundabout-left':       'roundabout_left',
  'roundabout-right':      'roundabout_right',
  'uturn-left':            'u_turn_left',
  'uturn-right':           'u_turn_right',
};

function getIcon(maneuver: string | null): string {
  if (!maneuver) return 'navigation';
  return MANEUVER_ICONS[maneuver] ?? 'navigation';
}

export default function RouteStep({ step, isRestricted }: Props) {
  return (
    <div className={`gc-step${isRestricted ? ' restricted' : ''}`}>
      <span className="material-icons-round gc-step-icon">
        {getIcon(step.maneuver)}
      </span>
      <div className="gc-step-content">
        <div
          className="gc-step-instr"
          dangerouslySetInnerHTML={{ __html: step.instruction }}
        />
        <div className="gc-step-meta">
          <span>{step.distance.text}</span>
          <span>·</span>
          <span>{step.duration.text}</span>
          {isRestricted && <span className="gc-restricted-tag">⚠ Restringido</span>}
        </div>
      </div>
    </div>
  );
}
