import React from 'react';
import { XCircle, CheckCircle, PlusCircle, Replace, SkipForward, History, RotateCcw } from 'lucide-react';

// It's highly recommended to move SET_TYPES and formatSetTarget to a shared utility file
// and import them here and in App.js to avoid duplication.
const SET_TYPES = {
    STANDARD: 'standard',
    WARMUP: 'warmup',
    DROPSET: 'dropset',
    AMRAP: 'amrap',
    TIMED: 'timed',
};

// Placeholder for formatRepRange if not imported, used by formatSetTarget
const formatRepRange = (min, max) => {
    const minReps = parseInt(min, 10);
    const maxReps = parseInt(max, 10);
    if (!isNaN(minReps) && !isNaN(maxReps) && minReps !== maxReps) {
        return `${minReps}-${maxReps} reps`;
    } else if (!isNaN(minReps)) {
        return `${minReps} reps`;
    } else if (!isNaN(maxReps)) {
        return `${maxReps} reps`;
    }
    return 'reps';
};

const formatSetTarget = (exercise) => {
    switch (exercise.setType) {
        case SET_TYPES.TIMED:
            return `${exercise.targetDuration || 'N/A'}s`;
        case SET_TYPES.DROPSET:
            return `Drop Set (${(exercise.drops || []).length} drops)`;
        case SET_TYPES.AMRAP:
            return `AMRAP`;
        case SET_TYPES.WARMUP:
        case SET_TYPES.STANDARD:
        default:
            return formatRepRange(exercise.targetRepsMin, exercise.targetRepsMax);
    }
};


const ActiveWorkoutScreen = React.memo(({
    activeWorkout,
    bodyWeight,
    workoutNotes,
    onSetBodyWeight,
    onSetWorkoutNotes,
    onSetInputChange,
    onAddSetToExercise,
    onLogSet,
    onUnlogSet,
    onFinishWorkout,
    onCancelWorkout,
    showBodyWeightInput,
    onHideBodyWeightInput,
    onToggleSkipExercise,
    onStartReplaceExercise,
    replacingExerciseIndex,
    onConfirmReplaceExercise,
    onCancelReplaceExercise,
    tempReplaceName,
    onSetTempReplaceName,
    onStartInSetTimer,
    inSetTimer,
    formatTime // Passed from App.js
}) => {
    if (!activeWorkout) {
        return <div className="p-4 text-center text-gray-400">No active workout. Go back to select one.</div>;
    }

    return (
        <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onCancelWorkout} className="text-pink-400 hover:text-pink-300 flex items-center">
                    <XCircle size={20} className="mr-1"/> End Workout (Discard)
                </button>
                <h1 className="text-3xl font-bold text-pink-500 text-center">{activeWorkout.name}</h1>
                <div/> {/* Spacer */}
            </div>

            {showBodyWeightInput && (
                <div className="mb-6 bg-gray-800 p-4 rounded-lg">
                    <label htmlFor="bodyWeight" className="block text-sm font-medium text-gray-300 mb-1">Current Body Weight (lbs)</label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="number"
                            id="bodyWeight"
                            value={bodyWeight}
                            onChange={(e) => onSetBodyWeight(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-pink-500 focus:border-pink-500"
                            placeholder="e.g., 167.2"
                        />
                        <button onClick={onHideBodyWeightInput} className="bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-lg"><CheckCircle size={20}/></button>
                    </div>
                </div>
            )}

            {activeWorkout.exercises.map((exercise, exIndex) => (
                <div key={exercise.id} className={`bg-gray-800 p-4 rounded-lg shadow-md mb-4 ${exercise.isSkipped ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <h2 className="text-xl font-semibold text-pink-400">{exercise.name} <span className="text-xs uppercase text-gray-500 ml-1">({exercise.setType})</span></h2>
                            {exercise.previousPerformance && (
                                <div className="text-xs text-gray-500 mt-0.5 mb-1 flex items-center">
                                    <History size={12} className="mr-1 flex-shrink-0" />Previously: {exercise.previousPerformance}
                                </div>
                            )}
                            {!exercise.previousPerformance && (
                                 <div className="text-xs text-gray-500 mt-0.5 mb-1 flex items-center">
                                    <History size={12} className="mr-1 flex-shrink-0" />No previous data for this exercise in this plan.
                                </div>
                            )}
                            <span className="text-sm text-gray-400 block">
                                Target: {exercise.targetSets}x {formatSetTarget(exercise)} {exercise.targetWeight && exercise.setType !== SET_TYPES.TIMED && exercise.setType !== SET_TYPES.DROPSET ? `@ ${exercise.targetWeight}lbs` : ''}
                            </span>
                        </div>
                        <div className="flex space-x-1 mt-1">
                            {replacingExerciseIndex !== exIndex && !exercise.isSkipped && (
                                <button onClick={() => onStartReplaceExercise(exIndex, exercise.name)} className="p-1 text-blue-400 hover:text-blue-300" title="Replace Exercise"><Replace size={16}/></button>
                            )}
                            <button onClick={() => onToggleSkipExercise(exIndex)} className={`p-1 ${exercise.isSkipped ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-gray-300'}`} title={exercise.isSkipped ? "Unskip Exercise" : "Skip Exercise"}>
                                <SkipForward size={16}/>
                            </button>
                        </div>
                    </div>

                    {replacingExerciseIndex === exIndex && (
                        <div className="my-2 p-2 bg-gray-700 rounded">
                            <input type="text" value={tempReplaceName} onChange={(e) => onSetTempReplaceName(e.target.value)} placeholder="New exercise name" className="w-full bg-gray-600 text-white p-2 rounded mb-2 text-sm" autoFocus/>
                            <div className="flex justify-end space-x-2">
                                <button onClick={onCancelReplaceExercise} className="text-xs bg-gray-500 hover:bg-gray-400 px-2 py-1 rounded">Cancel</button>
                                <button onClick={() => onConfirmReplaceExercise(exIndex)} className="text-xs bg-green-600 hover:bg-green-500 px-2 py-1 rounded">Confirm</button>
                            </div>
                        </div>
                    )}

                    {!exercise.isSkipped && exercise.loggedSets.map((set, setIndex) => (
                        <div key={`${exercise.id}-set-${setIndex}`} className={`p-3 rounded-md mb-2 ${set.completed ? 'bg-green-800 border-green-600' : 'bg-gray-700 border-gray-600'} border`}>
                            { (exercise.setType === SET_TYPES.STANDARD || exercise.setType === SET_TYPES.WARMUP || exercise.setType === SET_TYPES.AMRAP) && (
                                <div className="flex items-center space-x-2">
                                    <span className="text-gray-300 font-medium w-8 text-center">Set {setIndex + 1}</span>
                                    <input type="number" placeholder="Reps" value={set.reps} onChange={(e) => onSetInputChange(exIndex, setIndex, 'reps', e.target.value)} className="bg-gray-600 text-white border border-gray-500 rounded-full w-20 h-12 text-center text-lg"/>
                                    <span className="text-gray-400">x</span>
                                    <input type="number" placeholder="lbs" value={set.weight} onChange={(e) => onSetInputChange(exIndex, setIndex, 'weight', e.target.value)} className="bg-gray-600 text-white border border-gray-500 rounded-full w-20 h-12 text-center text-lg"/>
                                    {!set.completed && (set.reps || set.weight) && (
                                        <button onClick={() => onLogSet(exIndex, setIndex, {reps: set.reps, weight: set.weight})} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full" title="Log Set"><CheckCircle size={20} /></button>
                                    )}
                                    {set.completed && (
                                        <button onClick={() => onUnlogSet(exIndex, setIndex)} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full" title="Unlog Set"><RotateCcw size={20} /></button>
                                    )}
                                </div>
                            )}
                            {exercise.setType === SET_TYPES.TIMED && (
                                <div className="flex flex-col items-center space-y-2">
                                    <span className="text-gray-300 font-medium">Set {setIndex + 1}: Target {exercise.targetDuration}s</span>
                                    {inSetTimer && inSetTimer.exerciseIndex === exIndex && inSetTimer.setIndex === setIndex ? (
                                        <div className="text-2xl text-pink-400">{formatTime(inSetTimer.secondsLeft)}</div>
                                    ) : (
                                        <input type="number" placeholder="Actual (s)" value={set.durationAchieved || ''} onChange={(e) => onSetInputChange(exIndex, setIndex, 'durationAchieved', e.target.value)} className="bg-gray-600 text-white border border-gray-500 rounded-full w-24 h-10 text-center"/>
                                    )}
                                    {!set.completed && !(inSetTimer && inSetTimer.exerciseIndex === exIndex && inSetTimer.setIndex === setIndex) && (
                                        <button onClick={() => onStartInSetTimer(exIndex, setIndex, exercise.targetDuration)} className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-sm">Start Set Timer</button>
                                    )}
                                    {!set.completed && (set.durationAchieved) && (
                                        <button onClick={() => onLogSet(exIndex, setIndex, {durationAchieved: set.durationAchieved})} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full" title="Log Timed Set"><CheckCircle size={20} /></button>
                                    )}
                                    {set.completed && (
                                        <button onClick={() => onUnlogSet(exIndex, setIndex)} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full" title="Unlog Set"><RotateCcw size={20} /></button>
                                    )}
                                </div>
                            )}
                            {exercise.setType === SET_TYPES.DROPSET && (
                                <div className="space-y-2">
                                    <span className="text-gray-300 font-medium block text-center">Set {setIndex + 1} (Dropset)</span>
                                    {(exercise.drops || []).map((drop, dropIdx) => (
                                        <div key={dropIdx} className="flex items-center space-x-1 text-xs">
                                            <span className="text-gray-400 w-1/4">Drop {dropIdx + 1}:</span>
                                            <input type="number" placeholder="lbs" value={(set.drops && set.drops[dropIdx]?.weight) || ''} onChange={e => onSetInputChange(exIndex, setIndex, 'drops', {index: dropIdx, field: 'weight', value: e.target.value})} className="w-1/3 bg-gray-600 p-1 rounded"/>
                                            <input type="number" placeholder="reps" value={(set.drops && set.drops[dropIdx]?.reps) || ''} onChange={e => onSetInputChange(exIndex, setIndex, 'drops', {index: dropIdx, field: 'reps', value: e.target.value})} className="w-1/3 bg-gray-600 p-1 rounded"/>
                                        </div>
                                    ))}
                                    {!set.completed && (
                                        <button onClick={() => onLogSet(exIndex, setIndex, {drops: set.drops})} className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md text-sm">Log Dropset</button>
                                    )}
                                    {set.completed && (
                                        <button onClick={() => onUnlogSet(exIndex, setIndex)} className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-md text-sm">Unlog Dropset</button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {!exercise.isSkipped && (
                        <button onClick={() => onAddSetToExercise(exIndex)} className="w-full text-sm text-blue-400 hover:text-blue-300 border border-blue-500 hover:border-blue-400 rounded-lg py-1.5 px-3 mt-1 flex items-center justify-center transition-colors">
                           <PlusCircle size={16} className="mr-1"/> Add Set
                        </button>
                    )}
                </div>
            ))}
            {(activeWorkout.exercises || []).length === 0 && <p className="text-sm text-gray-400 text-center py-2">No exercises in this workout.</p>}

            <div className="my-6 bg-gray-800 p-4 rounded-lg">
                <label htmlFor="workoutNotes" className="block text-sm font-medium text-gray-300 mb-1">Workout Notes</label>
                <textarea
                    id="workoutNotes"
                    value={workoutNotes}
                    onChange={(e) => onSetWorkoutNotes(e.target.value)}
                    rows="3"
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="How did it go? Any PRs?"
                ></textarea>
            </div>

            <button 
                onClick={onFinishWorkout}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg text-lg flex items-center justify-center transition-colors"
            >
                <CheckCircle size={22} className="mr-2"/> Finish & Save Workout
            </button>
        </div>
    );
});

export default ActiveWorkoutScreen;