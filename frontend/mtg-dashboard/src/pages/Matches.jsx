import React from 'react'
import { useState, useEffect } from 'react'
import MatchCard from '../components/MatchCard'

const API_BASE = 'http://localhost:8000'




function Matches() {

  const [match, setMatch] = useState()

  useEffect(() => {
  fetch(`${API_BASE}/matches/1`)
    .then(response => response.json())
    .then(data => {
      // Handle the data, e.g., set it to state
      setMatch(data)
    })
    .catch(error => {
      console.error('Error fetching matches:', error)
    })
  }, []);


  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-medium text-gray-900 mb-6">Matches</h1>
      {match && (
        <MatchCard
          match={{
            match_id: match.match_id,
            group_id: match.group_id,
            date: match.date
          }}
          onMatchDeleted={() => {}}
        />
      )}
    </div>
  )
}

export default Matches


