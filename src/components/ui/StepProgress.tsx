import React from 'react';
import clsx from 'clsx';

export interface StepItem {
  title: string;
}

interface StepProgressProps {
  currentStep: number;
  steps: string[] | StepItem[];
  className?: string;
}

/**
 * Reusable unified step progress component.
 * Displays current step title in primary theme color, step counter (e.g. '1 / 3'), and animated progress bar.
 *
 * @param {StepProgressProps} props - Current step index (1-based), steps list, and custom className.
 * @returns {JSX.Element}
 */
const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  steps,
  className,
}) => {
  const totalSteps = steps.length;
  const currentStepItem = steps[currentStep - 1];
  const stepTitle = typeof currentStepItem === 'string' ? currentStepItem : currentStepItem?.title || '';
  const progressPercent = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <div className={clsx('bg-white px-4 py-3.5 border-b border-gray-100 shadow-xs transition-all', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-primary truncate pr-2">
          Paso {currentStep}: {stepTitle}
        </span>
        <span className="text-xs font-semibold text-gray-400 shrink-0">
          {currentStep} / {totalSteps}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default StepProgress;
