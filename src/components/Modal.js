import React from 'react';
import { XCircle, MessageSquareWarning, AlertTriangle } from 'lucide-react'; // Ensure these are used or remove if not

const Modal = ({
    isOpen,
    onClose,
    title,
    children, // Content of the modal
    showCancelButton = false,
    onConfirm,
    confirmText = "OK",
    cancelText = "Cancel",
    iconType // 'info' or 'confirm' to render different icons
}) => {
    if (!isOpen) return null;

    let IconComponent;
    let iconColorClass = "";

    if (iconType === 'info') {
        IconComponent = MessageSquareWarning;
        iconColorClass = "text-yellow-400";
    } else if (iconType === 'confirm') {
        IconComponent = AlertTriangle;
        iconColorClass = "text-red-500";
    }


    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-pink-400">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
                        <XCircle size={24} />
                    </button>
                </div>
                <div className="mb-6">
                    {IconComponent && (
                        <div className="flex items-start">
                             <IconComponent size={36} className={`${iconColorClass} mr-3 flex-shrink-0 mt-1`} />
                            <div className="flex-grow">{children}</div>
                        </div>
                    )}
                    {!IconComponent && children}
                </div>
                <div className={`flex ${showCancelButton ? 'justify-between' : 'justify-end'} space-x-3`}>
                    {showCancelButton && (
                         <button
                            onClick={onClose}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm || onClose}
                        className={`${(onConfirm && iconType === 'confirm') ? 'bg-red-600 hover:bg-red-700' : (onConfirm ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700')} text-white font-semibold py-2 px-4 rounded-lg transition-colors`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;