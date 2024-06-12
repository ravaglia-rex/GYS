import React, {useState} from 'react';
import {Step, Stepper} from '../ui/stepper';
import UIDValidationForm from './UIDValidationForm';
import SecondStepForm from './SecondStepForm';
import {useStepper} from '../ui/stepper';

const steps = [
    {label: 'Step 1', content: 'UID Validation'},
    {label: 'Step 2', content: 'Waitlist/Registration'}
];

const StepperForm: React.FC = () => {
    const [userData, setUserData] = useState<string>("");

    return (
        <div className="flex items-center justify-center min-h-screen bg-cover bg-no-repeat"
            style={{ backgroundImage: `url(/assets/sign-up-background.jpg)` }}
        >
            <div className="bg-white bg-opacity-75 backdrop-filter backdrop-blur-lg p-8 rounded-lg shadow-md w-full max-w-md">
                <Stepper variant="circle-alt" initialStep={0} steps={steps}>
                    {steps.map((stepProps, index) => {
                        if (index === 0) {
                            return (
                                <Step key={stepProps.label} {...stepProps}>
                                    <UIDValidationForm setUserData={setUserData} />
                                </Step>
                            );
                        }
                        return (
                            <Step key={stepProps.label} {...stepProps}>
                                <SecondStepForm userData={userData} />
                            </Step>
                        );
                    })}
                </Stepper>
            </div>
        </div>
    );
};

export default StepperForm;
