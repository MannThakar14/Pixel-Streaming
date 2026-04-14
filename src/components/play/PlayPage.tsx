import React from 'react'

export const PlayPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] bg-slate-950 text-slate-50">
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-8 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Play Game
          </h1>
          <p className="text-xl text-slate-400">
            Welcome to the play area. Get ready to experience the game!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors">
              <h2 className="text-2xl font-bold mb-4">Start Session</h2>
              <p className="text-slate-400 mb-6">Create a new game room and invite others.</p>
              <button className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-semibold transition-all">
                Create Room
              </button>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors">
              <h2 className="text-2xl font-bold mb-4">Join Session</h2>
              <p className="text-slate-400 mb-6">Join an existing room using a code.</p>
              <button className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold transition-all">
                Join Room
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
