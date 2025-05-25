import React from 'react';
import { PlusCircle, Play, Edit3, Trash2, GripVertical } from 'lucide-react';
import { generateId } from '../utils/helpers'; // Assuming helpers.js is in src/utils/

// It's highly recommended to move SET_TYPES, formatRepRange, and formatSetTarget
// to a shared utility file (e.g., src/utils/helpers.js or src/utils/constants.js)
// and import them here if they are not already there.
// For this standalone component, I'm defining them here for clarity if not already moved.
const SET_TYPES = {
    STANDARD: 'standard',
    WARMUP: 'warmup',
    DROPSET: 'dropset',
    AMRAP: 'amrap',
    TIMED: 'timed',
};

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


const HomeScreen = React.memo(({
    workouts,
    onStartWorkout,
    onEditWorkoutTemplate,
    onDeleteWorkoutTemplate,
    onCreateNewWorkout,
    onWorkoutPlanDragStart,
    onWorkoutPlanDragOver,
    onWorkoutPlanDrop,
    onWorkoutPlanDragEnd,
    // Touch handlers for reordering workout plans
    onWorkoutPlanTouchStart,
    onWorkoutPlanTouchMove,
    onWorkoutPlanTouchEnd
}) => (
    <div className="p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-pink-500">My Workouts</h1>
        <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 workout-plan-container"
            // onTouchMove and onTouchEnd are handled by document listeners set up in App.js's onTouchStart handlers
        >
            {workouts.map((workout, index) => (
                <div
                    key={workout.id}
                    id={`workout-plan-${workout.id}`} 
                    draggable="true"
                    onDragStart={(e) => onWorkoutPlanDragStart(e, index)}
                    onDragOver={onWorkoutPlanDragOver}
                    onDrop={(e) => onWorkoutPlanDrop(e, index)}
                    onDragEnd={onWorkoutPlanDragEnd}
                    onTouchStart={(e) => onWorkoutPlanTouchStart(e, index)}
                    className="workout-plan-item bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-grab active:cursor-grabbing relative flex flex-col"
                >
                    <div className="absolute top-2 right-2 text-gray-500 opacity-50 hover:opacity-100 cursor-grab touch-none">
                        <GripVertical size={20} />
                    </div>
                    <h2 className="text-xl font-semibold mb-2 text-pink-400">{workout.name}</h2>
                    <ul className="text-sm text-gray-400 mb-3 list-disc list-inside flex-grow">
                        {(workout.exercises || []).slice(0, 3).map(ex => (
                            <li key={ex.id || generateId()}> {/* generateId is now imported */}
                                {ex.name} ({ex.targetSets}x {formatSetTarget(ex)} {ex.targetWeight && ex.setType !== SET_TYPES.TIMED && ex.setType !== SET_TYPES.DROPSET ? `@ ${ex.targetWeight}lbs` : ''})
                            </li>
                        ))}
                        {(workout.exercises || []).length > 3 && <li>...and more</li>}
                    </ul>
                    <div className="flex justify-between items-center mt-auto pt-2">
                        <button
                            onClick={() => onStartWorkout(workout)}
                            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center transition-colors"
                        >
                            <Play size={18} className="mr-2" /> Start
                        </button>
                        <div>
                            <button onClick={() => onEditWorkoutTemplate(workout)} className="text-blue-400 hover:text-blue-300 mr-2 p-1"><Edit3 size={18}/></button>
                            <button onClick={() => onDeleteWorkoutTemplate(workout.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={18}/></button>
                        </div>
                    </div>
                </div>
            ))}
            {workouts.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No workout plans yet. Create one to get started!</p>}
        </div>
        <button
            onClick={onCreateNewWorkout}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center text-lg transition-colors"
        >
            <PlusCircle size={22} className="mr-2" /> Create New Workout Plan
        </button>
    </div>
));

export default HomeScreen;
