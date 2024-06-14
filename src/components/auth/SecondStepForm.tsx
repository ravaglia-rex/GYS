import React from "react";
import SignUpForm from "./SignUpForm";
import WaitlistForm from "./WaitlistForm";

interface UserObj {
    uid: string;
    parentEmail: string;
}

interface SecondStepFormProps {
    userData: string;
    setUserObj: (userObj: UserObj) => void;
}

const SecondStepForm: React.FC<SecondStepFormProps> = ({ userData, setUserObj }) => {
    return userData !== "" ? <SignUpForm userData={userData} setUserObj={setUserObj} /> : <WaitlistForm />;
};

export default SecondStepForm;