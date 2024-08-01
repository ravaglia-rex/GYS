import React, { useState } from 'react';
import { Step, Stepper } from '../ui/stepper';
import PersonalInformation from './PersonalInformation';
import SchoolInfoForm from './SchoolInfoForm';
import ParentInfoForm from './ParentInfoForm';
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
    const [parentName, setParentName] = useState<string>("");
    const [parentEmail, setParentEmail] = useState<string>("");
    const [parentPhone, setParentPhone] = useState<string>("");
    const [examID, setExamID] = useState<string>("");
    const [isQualified, setIsQualified] = useState<boolean | null>(null);
    const [eligibleDateTime, setEligibilityDateTime] = useState<string>("");

    const steps: StepData[] = [
        { label: 'Step 1', content: 'Personal Information' },
        { label: 'Step 2', content: 'School Information' },
        {
            label: 'Step 3',
            content: 'Parent Contact Information',
            condition: () => isQualified !== null,
        },
        { 
            label: isQualified === null ? 'Step 3' : 'Step 4', 
            content: isQualified === null ? 'TnC and Password' : 'TnC and Password', // Adjust content based on your actual requirements
        },
    ];

    return (
        <div className="bg-white bg-opacity-75 backdrop-filter backdrop-blur-lg p-8 rounded-lg shadow-md w-full max-w-md">
            <Stepper variant="circle-alt" initialStep={0} steps={steps}>
                {steps
                    .filter(step => !step.condition || step.condition())
                    .map((step, index) => {
                        let stepContent;
                        switch (index) {
                            case 0:
                                stepContent = (
                                    <PersonalInformation
                                        setFirstName={setFirstName}
                                        setLastName={setLastName}
                                        setExamID={setExamID}
                                        setIsQualified={setIsQualified}
                                        setEligibilityDateTime={
                                            setEligibilityDateTime
                                        }
                                    />
                                );
                                break;
                            case 1:
                                stepContent = (
                                    <SchoolInfoForm
                                        email={email}
                                        setSchool={setSchool}
                                        setGrade={setGrade}
                                        isQualified={isQualified}
                                    />
                                );
                                break;
                            case 2:
                                stepContent = isQualified === null ? (
                                    <TnCPassForm
                                        first_name={firstName}
                                        last_name={lastName}
                                        school={school}
                                        grade={grade}
                                        parent_name={parentName}
                                        parent_email={parentEmail}
                                        parent_phone={parentPhone}
                                        email={email}
                                        examID={examID}
                                        isQualified={isQualified}
                                        eligibleDateTime={eligibleDateTime}
                                        setEmailExists={setEmailExists}
                                    />
                                ) : (
                                    <ParentInfoForm
                                        setParentName={setParentName}
                                        setParentEmail={setParentEmail}
                                        setParentPhone={setParentPhone}
                                    />
                                );
                                break;
                            case 3:
                                stepContent = (
                                    <TnCPassForm
                                        first_name={firstName}
                                        last_name={lastName}
                                        school={school}
                                        grade={grade}
                                        parent_name={parentName}
                                        parent_email={parentEmail}
                                        parent_phone={parentPhone}
                                        email={email}
                                        examID={examID}
                                        isQualified={isQualified}
                                        eligibleDateTime={eligibleDateTime}
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
