import React, {useState} from 'react';
import {Step, Stepper} from '../ui/stepper';
import UIDValidationForm from './UIDValidationForm';
import SecondStepForm from './SecondStepForm';
import PaymentMethodForm from './PaymentMethodForm';

interface StepData {
    label: string;
    content: string;
    condition?: () => boolean;
}

interface UserObj {
    uid: string;
    parentEmail: string;
}


const StepperForm: React.FC = () => {
    const [userData, setUserData] = useState<string>("");
    const [userObj, setUserObj] = useState<UserObj>({uid: "", parentEmail: ""});
    const steps: StepData[] = [
        { label: 'Step 1', content: 'UID Validation' },
        { label: 'Step 2', content: 'Waitlist/Registration' },
        {
            label: 'Step 3',
            content: 'Payment Method',
            condition: () => userData !== ""
        }
    ];

    return (
        <div className="flex items-center justify-center min-h-screen bg-cover bg-no-repeat"
            style={{ backgroundImage: `url(/assets/sign-up-background.jpg)` }}
        >
            <div className="bg-white bg-opacity-75 backdrop-filter backdrop-blur-lg p-8 rounded-lg shadow-md w-full max-w-md">
                <Stepper 
                    variant="circle-alt" 
                    initialStep={0} 
                    steps={steps}
                >
                    {steps.filter(step => !step.condition || step.condition()).map((step, index) => {
                        let stepContent;
                        switch (index) {
                            case 0:
                                stepContent = <UIDValidationForm setUserData={setUserData} />;
                                break;
                            case 1:
                                stepContent = <SecondStepForm userData={userData} setUserObj={setUserObj}/>;
                                break;
                            case 2:
                                stepContent = <PaymentMethodForm uid={userObj.uid} parentEmail={userObj.parentEmail}/>;
                                break;
                            default:
                                stepContent = <div>Unknown step</div>;
                        }
                        return (
                            <Step key={step.label} {...step}>
                                {stepContent}
                            </Step>
                        );
                    })}
                </Stepper>
            </div>
        </div>
    );
};

export default StepperForm;
