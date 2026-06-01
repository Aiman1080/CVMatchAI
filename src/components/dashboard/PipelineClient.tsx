'use client'

import { useState } from 'react'
import { KanbanView } from './KanbanView'

// Full-page pipeline (kanban) view. Holds the candidate list locally so drag-and-drop
// updates are reflected instantly; KanbanView persists each move via PATCH, so the
// change is shared with the Candidates list (both read the same database).
export function PipelineClient({ initialCandidates }: { initialCandidates: any[] }) {
  const [candidates, setCandidates] = useState(initialCandidates)
  return <KanbanView candidates={candidates} onCandidatesChange={setCandidates} />
}
