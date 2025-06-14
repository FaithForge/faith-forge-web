import { ColorType } from '@/libs/common-types/constants/theme';
import React from 'react';

type StepsProps = {
  colorType: ColorType;
  steps: { value: number; label: string }[];
  currentStep: number;
};

const Steps: React.FC<StepsProps> = ({ colorType, steps, currentStep }) => {
  const stepsThemes: Record<ColorType, string> = {
    success: 'step-success',
    error: 'step-error',
    warning: 'step-warning',
    info: 'step-info',
  };

  const confirmStepsTheme = stepsThemes[colorType];

  return (
    <div className="p-2">
      <ul className="steps w-full">
        {steps
          ? steps.map((step) => (
              <li className={`step ${currentStep >= step.value && confirmStepsTheme}`}>
                {step.label}
              </li>
            ))
          : null}
      </ul>
    </div>
  );
};

export default Steps;
