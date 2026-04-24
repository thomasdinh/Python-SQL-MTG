const API_BASE = 'http://localhost:8000'

function Home() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-medium text-gray-900 mb-2">
          MTG Commander Dashboard
        </h1>
        <p className="text-gray-500 max-w-lg">
          Track your Commander games, analyse deck performance, and see
          who dominates your playgroup.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-1">About</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Built with React, Tailwind CSS, and a FastAPI + MySQL backend.
          Log your Commander matches, track win rates per deck, and visualise
          your playgroup's history over time.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Getting started</h2>
        <ol className="flex flex-col gap-2">
          {[
            'Go to Players to see all registered players',
            'Click a player to view their decks and stats',
            'Add new decks and log matches from the player page',
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-500">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center flex-shrink-0 font-medium">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default Home