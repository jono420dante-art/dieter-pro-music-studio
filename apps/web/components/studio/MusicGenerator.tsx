// apps/web/components/studio/MusicGenerator.tsx
// Main AI Music Generation component
// Handles genre selection, mood grid, duration slider, and generation

'use client'

import { useState, useTransition } from 'react'
import { generateTrack } from '@/lib/actions/generateTrack'

const GENRES = [
  'Afro House', 'Cinematic', 'Lo-Fi', 'EDM', 'Hip-Hop',
  'Jazz', 'Ambient', 'Pop', 'Techno', 'Trap',
  'R&B', 'Soul', 'Indie', 'Metal', 'Classical', 'Reggae'
]

const MOODS = [
  { label: 'Energetic', icon: 'Mixer Board' },
  { label: 'Calm', icon: 'Equalizer' },
  { label: 'Uplifting', icon: 'Microphone' },
  { label: 'Dark', icon: 'Headphones' },
  { label: 'Melancholic', icon: 'Synthesizer' },
  { label: 'Joyful', icon: 'Guitar' },
  { label: 'Mysterious', icon: 'Drums' },
  { label: 'Dreamy', icon: 'Sheet Music' },
  { label: 'Aggressive', icon: 'Amplifier' },
  { label: 'Peaceful', icon: 'Speaker' },
  { label: 'Epic', icon: 'Orchestra' },
  { label: 'Ambient', icon: 'Reverb' },
  { label: 'Funky', icon: 'Trumpet' },
  { label: 'Romantic', icon: 'Violin' },
  { label: 'Cinematic', icon: 'Film Score' },
  { label: 'Psychedelic', icon: 'Effects Pedal' },
  { label: 'Minimalist', icon: 'Sine Wave' },
  { label: 'Tribal', icon: 'Percussion' },
  { label: 'Ethereal', icon: 'Pad Synth' },
  { label: 'Industrial', icon: 'Synthesizer' },
]

export function MusicGenerator() {
  const [prompt, setPrompt] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedMood, setSelectedMood] = useState('')
  const [duration, setDuration] = useState(30)
  const [quality, setQuality] = useState('320kbps')
  const [compression, setCompression] = useState(50)
  const [reverb, setReverb] = useState(30)
  const [delay, setDelay] = useState(20)
  const [generatedTrack, setGeneratedTrack] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const handleGenerate = () => {
    if (!selectedGenre || !selectedMood) {
      alert('Please select a genre and mood')
      return
    }

    startTransition(async () => {
      try {
        const result = await generateTrack({
          prompt,
          genre: selectedGenre,
          mood: selectedMood,
          duration,
          quality,
          effects: { compression, reverb, delay }
        })
        setGeneratedTrack(result)
      } catch (error) {
        console.error('Generation failed:', error)
      }
    })
  }

  return (
    <div className="flex h-full">
      {/* Left Panel: AI Director + Tools */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-4">
        <div>
          <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">AI Director</h3>
          
          {/* Suggestion Card */}
          <div className="bg-gray-800 rounded-lg p-3 mb-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400 text-xs">💡 SUGGESTION</span>
            </div>
            <p className="text-xs text-gray-400">
              {selectedGenre && selectedMood
                ? `Try adding a 808 bass with ${selectedMood.toLowerCase()} ${selectedGenre} elements`
                : 'Select a genre and mood to get AI suggestions'
              }
            </p>
          </div>

          {/* Quality & Tools */}
          <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3 mt-4">Quality & Tools</h3>
          
          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">Audio Quality</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            >
              <option value="128kbps">128kbps</option>
              <option value="256kbps">256kbps</option>
              <option value="320kbps">320kbps</option>
              <option value="wav">WAV (Lossless)</option>
            </select>
          </div>

          {/* Sliders */}
          {[{ label: 'Compression', value: compression, setter: setCompression },
            { label: 'Reverb', value: reverb, setter: setReverb },
            { label: 'Delay', value: delay, setter: setDelay }].map(({ label, value, setter }) => (
            <div key={label} className="mb-3">
              <div className="flex justify-between mb-1">
                <label className="text-xs text-gray-400">{label}</label>
                <span className="text-xs text-gray-400">{value}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={value}
                onChange={(e) => setter(Number(e.target.value))}
                className="w-full accent-green-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Main Studio */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl">
          <h1 className="text-2xl font-bold mb-1">Music Generation Studio</h1>
          <p className="text-gray-400 text-sm mb-6">
            Create professional tracks with AI-powered production tools
          </p>

          {/* Prompt Input */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Describe Your Music</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A dreamy lo-fi beat with soft piano, vinyl crackle, and a chill jazz saxophone solo in the background..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 resize-none h-20 focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Genre Selection */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Genre</h3>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre === selectedGenre ? '' : genre)}
                  className={`px-3 py-1 rounded-full text-sm border transition-all ${
                    selectedGenre === genre
                      ? 'bg-green-500 border-green-500 text-black font-medium'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Grid */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Studio Mood Grid</h3>
            <div className="grid grid-cols-5 gap-3">
              {MOODS.map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => setSelectedMood(label === selectedMood ? '' : label)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedMood === label
                      ? 'bg-green-500/20 border-green-500 text-green-400'
                      : 'bg-gray-900 border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-gray-500">{icon}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Duration Slider */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Duration</h3>
              <span className="text-sm text-gray-400">{duration}s</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600">10s</span>
              <input
                type="range" min={10} max={120} value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex-1 accent-green-500"
              />
              <span className="text-xs text-gray-600">120s</span>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isPending || !selectedGenre || !selectedMood}
            className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isPending ? (
              <><span className="animate-spin">⚙</span> Generating...</>
            ) : (
              <><span>✦</span> Generate Track</>
            )}
          </button>

          {/* Generated Track Result */}
          {generatedTrack && (
            <div className="mt-6 bg-gray-900 border border-green-500/30 rounded-lg p-4">
              <h3 className="text-green-400 font-bold mb-2">Track Generated!</h3>
              <p className="text-sm text-gray-400 mb-3">{generatedTrack.title}</p>
              <audio controls src={generatedTrack.url} className="w-full" />
              <div className="flex gap-2 mt-3">
                <a href={generatedTrack.downloadUrl} download
                  className="flex-1 text-center bg-green-500 text-black font-bold py-2 rounded">
                  Download
                </a>
                <button className="flex-1 border border-gray-700 py-2 rounded text-sm">
                  Add to Library
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
