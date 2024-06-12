import React from "react";
import SignUpForm from "./SignUpForm";
import WaitlistForm from "./WaitlistForm";

interface SecondStepFormProps {
    userData: string;
}

const SecondStepForm: React.FC<SecondStepFormProps> = ({ userData }) => {
    return userData !== "" ? <SignUpForm userData={userData} /> : <WaitlistForm />;
};

export default SecondStepForm;