import React from 'react';
import { Play, Pause, StopCircle } from 'lucide-react';

const TimerDisplay = React.memo(({
    timerActive,
    timerSeconds,
    timerPaused,
    onResumeTimer,
    onPauseTimer,
    onStopTimer,
    formatTime // This is passed from App.js
}) => {
    if (!timerActive) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 border-t-2 border-pink-500 shadow-2xl z-50">
            <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
                <div className="text-center sm:text-left mb-2 sm:mb-0">
                    <p className="text-sm text-gray-400">Rest Timer</p>
                    <p className="text-4xl font-bold text-pink-400">{formatTime(timerSeconds)}</p>
                </div>
                <div className="flex space-x-2">
                    {timerPaused ? (
                        <button onClick={onResumeTimer} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center">
                            <Play size={18} className="mr-1"/> Resume
                        </button>
                    ) : (
                        <button onClick={onPauseTimer} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center">
                            <Pause size={18} className="mr-1"/> Pause
                        </button>
                    )}
                    <button onClick={onStopTimer} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center">
                        <StopCircle size={18} className="mr-1"/> Stop
                    </button>
                </div>
            </div>
        </div>
    );
});

export default TimerDisplay;