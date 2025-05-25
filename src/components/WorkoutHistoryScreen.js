import React from 'react';
import { Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

// It's highly recommended to move SET_TYPES to a shared utility file
// and import it here (e.g., import { SET_TYPES } from '../utils/helpers';)
const SET_TYPES = {
    STANDARD: 'standard',
    WARMUP: 'warmup',
    DROPSET: 'dropset',
    AMRAP: 'amrap',
    TIMED: 'timed',
};

const WorkoutHistoryScreen = React.memo(({
    workoutLogs,
    onEditWorkoutLog,
    onDeleteWorkoutLog
}) => (
    <div className="p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-pink-500">Workout History</h1>
        {workoutLogs.length === 0 && <p className="text-gray-400 text-center">No completed workouts yet. Go crush one!</p>}
        <div className="space-y-4">
            {workoutLogs.map(log => (
                <div key={log.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="text-xl font-semibold text-pink-400">{log.name}</h2>
                            <p className="text-sm text-gray-400">
                                {log.startTime?.toDate ? new Date(log.startTime.toDate()).toLocaleDateString() : 'Date N/A'}
                                {log.startTime?.toDate && log.endTime?.toDate &&
                                    ` (${Math.round((log.endTime.toDate().getTime() - log.startTime.toDate().getTime()) / 60000)} min)`}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                            {log.bodyWeight && <p className="text-xs text-gray-300 bg-gray-700 px-2 py-0.5 rounded">Body Wt: {log.bodyWeight} lbs</p>}
                            <div className="flex space-x-1">
                                {log.templateId && (
                                    <button
                                        onClick={() => onEditWorkoutLog(log)}
                                        className="p-1 text-blue-400 hover:text-blue-300"
                                        title="Edit This Workout Log"
                                    >
                                        <Edit size={16}/>
                                    </button>
                                )}
                                <button
                                    onClick={() => onDeleteWorkoutLog(log.id)}
                                    className="p-1 text-red-400 hover:text-red-300"
                                    title="Delete This Log"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    </div>

                    {(log.exercises || []).map((ex, idx) => (
                        <details key={idx} className="mb-1 last:mb-0 group">
                            <summary className="text-md text-gray-300 cursor-pointer hover:text-pink-300 py-1 flex items-center">
                                <ChevronDown size={16} className="mr-2 group-open:hidden transition-transform" />
                                <ChevronUp size={16} className="mr-2 hidden group-open:inline transition-transform" />
                                {ex.name}
                                <span className="ml-2 text-xs bg-gray-700 px-1.5 py-0.5 rounded capitalize">{ex.setType || SET_TYPES.STANDARD}</span>
                                {ex.isSkipped ? <span className="ml-2 text-xs bg-yellow-600 px-1.5 py-0.5 rounded">Skipped</span> : ''}
                            </summary>
                            <div className="pl-6 pt-1 pb-2 text-xs text-gray-400 border-l border-gray-700 ml-2">
                                {(ex.loggedSets || []).map((s, sIdx) => {
                                    let setDisplayString;
                                    if (ex.setType === SET_TYPES.TIMED) {
                                        setDisplayString = `${s.durationAchieved || 'N/A'}s`;
                                    } else if (ex.setType === SET_TYPES.DROPSET) {
                                        const dropsText = (s.drops || [])
                                            .map(d => `${d.reps || 'N/A'}r @ ${d.weight || 'N/A'}lbs`)
                                            .join(' / ');
                                        setDisplayString = dropsText || 'N/A';
                                    } else { // Standard, Warmup, AMRAP
                                        setDisplayString = `${s.reps || 'N/A'} reps @ ${s.weight || 'N/A'} lbs`;
                                    }
                                    return (
                                        <div key={sIdx}>
                                            Set {sIdx + 1}: {setDisplayString}
                                        </div>
                                    );
                                })}
                                {(ex.loggedSets || []).length === 0 && !ex.isSkipped && <div>No sets logged for this exercise.</div>}
                            </div>
                        </details>
                    ))}
                    {log.notes && <p className="mt-2 text-sm text-gray-300 italic border-t border-gray-700 pt-2">Notes: {log.notes}</p>}
                </div>
            ))}
        </div>
    </div>
));

export default WorkoutHistoryScreen;