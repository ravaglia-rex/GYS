import React, { useState } from 'react';
import { Step, Stepper } from '../ui/stepper';
import PersonalInformation from './PersonalInformation';
import SchoolInfoForm from './SchoolInfoForm';
import TnCPassForm from './TnCPassForm';

interface StepData {
    label: string;
    content: string;
    condition?: () => boolean;
}

interface SignUpProps {
    email: string;
    setEmailExists: (emailExists: boolean | null) => void;
}

const SignUpForm: React.FC<SignUpProps> = ({ email, setEmailExists }) => {
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [school, setSchool] = useState<string>("");
    const [grade, setGrade] = useState<number>(0);

    const steps: StepData[] = [
        { label: 'Step 1', content: 'Personal Information' },
        { label: 'Step 2', content: 'School Information' },
        { label: 'Step 3', content: 'TnC and Password' },
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/60 to-gray-900/40 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
            <Stepper variant="circle-alt" initialStep={0} steps={steps}>
                {steps.map((step, index) => {
                        let stepContent;
                        switch (index) {
                            case 0:
                                stepContent = (
                                    <PersonalInformation
                                        setFirstName={setFirstName}
                                        setLastName={setLastName}
                                    />
                                );
                                break;
                            case 1:
                                stepContent = (
                                    <SchoolInfoForm
                                        email={email}
                                        setSchool={setSchool}
                                        setGrade={setGrade}
                                        isQualified={null}
                                    />
                                );
                                break;
                            case 2:
                                stepContent = (
                                    <TnCPassForm
                                        first_name={firstName}
                                        last_name={lastName}
                                        school={school}
                                        grade={grade}
                                        parent_name=""
                                        parent_email=""
                                        parent_phone=""
                                        email={email}
                                        examID=""
                                        isQualified={null}
                                        eligibleDateTime=""
                                        setEmailExists={setEmailExists}
                                    />
                                );
                                break;
                            default:
                                stepContent = <div>Unknown step</div>;
                                break;
                        }
                        return (
                            <Step key={step.label} {...step}>
                                {stepContent}
                            </Step>
                        );
                    })}
            </Stepper>
        </div>
    );
};

export default SignUpForm;
