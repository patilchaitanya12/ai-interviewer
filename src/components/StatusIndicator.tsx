import type { InterviewStatus } from '../types/interview.types'

interface Props {
  status: InterviewStatus
}

const STATUS_CONFIG: Record<InterviewStatus, { label: string; color: string; pulse: boolean }> = {
  idle:        { label: 'Ready',      color: 'var(--muted)',   pulse: false },
  loading:     { label: 'Thinking…',  color: 'var(--warning)', pulse: true  },
  capturing:   { label: 'Capturing',  color: 'var(--accent)',  pulse: true  },
  questioning: { label: 'Speaking',   color: 'var(--primary)', pulse: true  },
  listening:   { label: 'Listening',  color: 'var(--success)', pulse: true  },
  evaluating:  { label: 'Evaluating', color: 'var(--warning)', pulse: true  },
  complete:    { label: 'Complete',   color: 'var(--success)', pulse: false },
}

export function StatusIndicator({ status }: Props) {
  const config = STATUS_CONFIG[status]
  return (
    <div className="status-indicator">
      <span
        className={`status-dot ${config.pulse ? 'pulse' : ''}`}
        style={{ background: config.color, boxShadow: `0 0 8px ${config.color}` }}
      />
      <span className="status-label" style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  )
}
