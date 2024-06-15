import React, { useEffect } from 'react';
import { auth } from '../firebase/firebase.ts';
import { getSchoolId } from '../db/studentCollection';
import { getExamId } from '../db/examMappingCollection';
import { setExamID } from '../state_data/examDetailsSlice';
import { useDispatch } from 'react-redux';

interface FormSetupProps {
    hasFormLoaded: boolean;
    setFormLoaded: React.Dispatch<React.SetStateAction<boolean>>;
}

const FormSetup: React.FC<FormSetupProps> = ({hasFormLoaded, setFormLoaded}) => {
  const dispatch = useDispatch();
  const user_id = auth.currentUser?.uid || "11111";

  useEffect(() => {
    const fetchFormLink = async () => {
      if (!user_id) return;

      try {
        // Fetch school ID based on user ID
        const schoolId = await getSchoolId(user_id);

        // Fetch form link based on school ID
        const exam_id = await getExamId(schoolId) as string;
        dispatch(setExamID({ examId: exam_id }));
        setFormLoaded(true);
      } catch (error: any) {
        dispatch(setExamID({ examId: "mOGkN8" }));
        setFormLoaded(true);
      }
    };
    if(!hasFormLoaded){
        fetchFormLink();
    }
    // eslint-disable-next-line
  }, [user_id, dispatch, setFormLoaded]);
  return (
    null
  );
};

export default FormSetup;