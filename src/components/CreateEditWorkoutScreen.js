import React from 'react';
import { PlusCircle, Trash2, Save, XCircle, GripVertical, Link2 } from 'lucide-react';

// It's highly recommended to move SET_TYPES to a shared utility file (e.g., src/utils/constants.js or src/utils/helpers.js)
// and import it here and in App.js to avoid duplication.
// For this standalone component, I'm defining it here for clarity if not already moved.
const SET_TYPES = {
    STANDARD: 'standard',
    WARMUP: 'warmup',
    DROPSET: 'dropset',
    AMRAP: 'amrap',
    TIMED: 'timed',
};

const CreateEditWorkoutScreen = React.memo(({
    editingWorkout,
    onWorkoutNameChange,
    onExerciseChange,
    onAddExerciseToTemplate,
    onRemoveExerciseFromTemplate,
    onSaveWorkoutTemplate,
    onCancel,
    // Props for exercise drag-and-drop
    onExerciseDragStart,
    onExerciseDragOver,
    onExerciseDrop,
    onExerciseDragEnd,
    // Props for exercise touch drag-and-drop
    onExerciseTouchStart,
    onExerciseTouchMove,
    onExerciseTouchEnd
}) => {
    if (!editingWorkout) return null;

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold mb-6 text-center text-pink-500">
                {editingWorkout.id ? 'Edit Workout Plan' : 'Create New Workout Plan'}
            </h1>
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                <div className="mb-6">
                    <label htmlFor="workoutName" className="block text-sm font-medium text-gray-300 mb-1">Workout Name</label>
                    <input
                        type="text"
                        id="workoutName"
                        value={editingWorkout.name}
                        onChange={(e) => onWorkoutNameChange(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="e.g., Pull Day, Leg Blast"
                    />
                </div>

                <h2 className="text-xl font-semibold mb-3 text-pink-400">Exercises</h2>
                <div className="exercise-list-container">
                    {(editingWorkout.exercises || []).map((exercise, index) => (
                        <div
                            key={exercise.id}
                            id={`exercise-item-${exercise.id}`} // ID for touch drag identification
                            draggable="true"
                            onDragStart={(e) => onExerciseDragStart(e, index)}
                            onDragOver={onExerciseDragOver}
                            onDrop={(e) => onExerciseDrop(e, index)}
                            onDragEnd={onExerciseDragEnd}
                            onTouchStart={(e) => onExerciseTouchStart(e, index)}
                            // onTouchMove and onTouchEnd are typically handled by document listeners set up in onTouchStart in App.js
                            className="exercise-item bg-gray-700 p-4 rounded-md mb-4 border border-gray-600 cursor-grab active:cursor-grabbing flex items-start space-x-3"
                        >
                            <div className="pt-1 text-gray-500 opacity-70 hover:opacity-100 touch-none"> {/* touch-none for drag handle */}
                                <GripVertical size={20} />
                            </div>
                            <div className="flex-grow">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-lg font-medium text-gray-200">Exercise #{index + 1}</span>
                                    <button onClick={() => onRemoveExerciseFromTemplate(exercise.id)} className="text-red-400 hover:text-red-300 p-1">
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3"> {/* Increased gap-y */}
                                    <div>
                                        <label htmlFor={`exName-${exercise.id}`} className="block text-xs text-gray-400 mb-1">Name</label>
                                        <input type="text" id={`exName-${exercise.id}`} value={exercise.name} onChange={(e) => onExerciseChange(index, 'name', e.target.value)} placeholder="Exercise Name" className="w-full bg-gray-600 border-gray-500 text-white rounded p-2 text-sm"/>
                                    </div>
                                    <div>
                                        <label htmlFor={`exSetType-${exercise.id}`} className="block text-xs text-gray-400 mb-1">Set Type</label>
                                        <select id={`exSetType-${exercise.id}`} value={exercise.setType || SET_TYPES.STANDARD} onChange={(e) => onExerciseChange(index, 'setType', e.target.value)} className="w-full bg-gray-600 border-gray-500 text-white rounded p-2 text-sm h-[34px]"> {/* Matched height */}
                                            <option value={SET_TYPES.STANDARD}>Standard</option>
                                            <option value={SET_TYPES.WARMUP}>Warm-up</option>
                                            <option value={SET_TYPES.DROPSET}>Dropset</option>
                                            <option value={SET_TYPES.AMRAP}>AMRAP</option>
                                            <option value={SET_TYPES.TIMED}>Timed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor={`exSets-${exercise.id}`} className="block text-xs text-gray-400 mb-1">Target Sets</label>
                                        <input type="number" id={`exSets-${exercise.id}`} value={exercise.targetSets} onChange={(e) => onExerciseChange(index, 'targetSets', e.target.value)} placeholder="Sets" className="w-full bg-gray-600 border-gray-500 text-white rounded p-2 text-sm"/>
                                    </div>

                                    {/* Conditional Inputs based on Set Type */}
                                    {(exercise.setType === SET_TYPES.STANDARD || exercise.setType === SET_TYPES.WARMUP || exercise.setType === SET_TYPES.AMRAP) && (
                                        <>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label htmlFor={`exRepsMin-${exercise.id}`} className="block text-xs text-gray-400 mb-1">Min Reps</label>
                                                    <input type="number" id={`exRepsMin-${exercise.id}`} value={exercise.targetRepsMin || ''} onChange={(e) => onExerciseChange(index, 'targetRepsMin', e.target.value)} placeholder="Min" className="w-full bg-gray-600 border-gray-500 text-white rounded p-2 text-sm"/>
                                                </div>
                                                <div>
                                                    <label htmlFor={`exRepsMax-${exercise.id}`} className="block text-xs text-gray-400 mb-1">Max Reps</label>
                                                    <input type="number" id={`exRepsMax-${exercise.id}`} value={exercise.targetRepsMax || ''} onChange={(e) => onExerciseChange(index, 'targetRepsMax', e.target.value)} placeholder="Max" className="w-full bg-gray-600 border-gray-500 text-white rounded p-2 text-sm"/>
                                                </div>
                                            </div>
                                            <div>
                                                <label htmlFor={`exWeight-${exercise.id}`} className="block text-xs text-gray-400 mb-1">Target Weight (lbs)</label>
                                                <input type="number" id={`exWeight-${exercise.id}`} value={exercise.targetWeight || ''} onChange={(e) => onExerciseChange(index, 'targetWeight', e.target.value)} placeholder="Weight" className="w-full bg-gray-600 border-gray-500 text-white rounded p-2 text-sm"/>
                                            </div>
                                        </>
                                    )}
                                    {exercise.setType === SET_TYPES.TIMED && (
                                        <div className="md:col-span-1"> {/* Adjusted for grid layout */}
                                            <label htmlFor={`exDuration-${exercise.id}`} className="block text-xs text-gray-400 mb-1">Duration (sec)</label>
                                            <input type="number" id={`exDuration-${exercise.id}`} value={exercise.targetDuration || ''} onChange={(e) => onExerciseChange(index, 'targetDuration', e.target.value)} placeholder="Seconds" className="w-full bg-gray-600 border-gray-500 text-white rounded p-2 text-sm"/>
                                        </div>
                                    )}
                                    {exercise.setType === SET_TYPES.DROPSET && (
                                        <div className="col-span-full mt-2">
                                            <h4 className="text-sm font-medium text-gray-300 mb-1">Drops:</h4>
                                            {(exercise.drops || []).map((drop, dropIndex) => (
                                                <div key={dropIndex} className="flex items-center space-x-2 mb-2">
                                                    <input type="number" value={drop.weight} onChange={(e) => onExerciseChange(index, 'drops', (exercise.drops || []).map((d, i) => i === dropIndex ? {...d, weight: e.target.value} : d))} placeholder="lbs" className="w-1/3 bg-gray-500 text-white rounded p-1.5 text-xs"/>
                                                    <span className="text-gray-400 text-xs">@</span>
                                                    <input type="number" value={drop.reps} onChange={(e) => onExerciseChange(index, 'drops', (exercise.drops || []).map((d, i) => i === dropIndex ? {...d, reps: e.target.value} : d))} placeholder="reps" className="w-1/3 bg-gray-500 text-white rounded p-1.5 text-xs"/>
                                                    <button type="button" onClick={() => onExerciseChange(index, 'drops', (exercise.drops || []).filter((_, i) => i !== dropIndex))} className="text-red-500 hover:text-red-400 p-0.5">
                                                        <XCircle size={16}/>
                                                    </button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => onExerciseChange(index, 'drops', [...(exercise.drops || []), {weight: '', reps: ''}])} className="text-xs text-green-400 hover:text-green-300 mt-1 border border-green-500 rounded px-2 py-1">
                                                + Add Drop
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {/* Superset Toggle Checkbox */}
                                {index < (editingWorkout.exercises || []).length - 1 && (
                                    <div className="mt-3 pt-3 border-t border-gray-600">
                                        <label htmlFor={`superset-${exercise.id}`} className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id={`superset-${exercise.id}`}
                                                checked={!!exercise.supersetWithNext}
                                                onChange={() => onExerciseChange(index, 'supersetWithNext', !exercise.supersetWithNext)}
                                                className="form-checkbox h-4 w-4 text-pink-600 bg-gray-600 border-gray-500 rounded focus:ring-pink-500"
                                            />
                                            <span>Superset with next exercise</span>
                                            {exercise.supersetWithNext && <Link2 size={16} className="text-pink-500 inline-block ml-1" />}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {(editingWorkout.exercises || []).length === 0 && <p className="text-sm text-gray-400 text-center py-2">No exercises added yet.</p>}
                </div>
                <button onClick={onAddExerciseToTemplate} className="w-full text-green-400 hover:text-green-300 border-2 border-green-500 hover:border-green-400 rounded-lg py-2 px-4 mb-6 mt-4 flex items-center justify-center transition-colors">
                    <PlusCircle size={20} className="mr-2"/> Add Exercise
                </button>
                <div className="flex justify-end space-x-3">
                    <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                    <button onClick={onSaveWorkoutTemplate} className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center">
                        <Save size={18} className="mr-2"/> Save Plan
                    </button>
                </div>
            </div>
        </div>
    );
});

export default CreateEditWorkoutScreen;