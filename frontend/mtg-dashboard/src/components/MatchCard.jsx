import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, Crown } from 'lucide-react'
import MatchHistory from './MatchHistory'

const API_BASE = 'http://localhost:8000'

function MatchCard({ match, onMatchDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  function handleDelete() {
    if (!confirm(`Delete Match:"${match.match_id}"?`)) return
    setDeleting(true)
    fetch(`${API_BASE}/matches/${match.match_id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to delete match')
        onMatchDeleted(match.match_id)
      })
      .catch((err) => {
        alert(err.message)
        setDeleting(false)
      })
  }



  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex gap-4 items-center">
        <div className="bg-purple-100 rounded-lg w-14 h-14 flex items-center justify-center flex-shrink-0 overflow-hidden">
    
            <Crown  size={24} />
        
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-medium text-gray-900 truncate">
            {match.match_id}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Match: {match.group_id} · {match.date}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-300 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MatchCard