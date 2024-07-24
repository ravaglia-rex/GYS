import React, { useEffect, useState } from 'react';
import { getStudent } from '../../db/studentCollection';
import { getSchoolDetails } from '../../db/schoolCollection';
import AboutMeForm from './AboutMeForm';
import ParentInfoForm from './ParentInfoForm';
import SchoolInfoForm from './SchoolInfoForm';
import BigSpinner from '../ui/BigSpinner';

interface UserProfileProps {
  user_id: string;
}

const UserProfile: React.FC<UserProfileProps> = ({user_id}) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedOption, setSelectedOption] = useState<string>('AboutMe');
    const [parent_name, setParentName] = useState<string>('');
    const [parent_email, setParentEmail] = useState<string>('');
    const [parent_phone, setParentPhone] = useState<string>('');
    const [first_name, setFirstName] = useState<string>('');
    const [last_name, setLastName] = useState<string>('');
    const [grade, setGrade] = useState<number>(0);
    const [school_name, setSchoolName] = useState<string>('');

    useEffect(() => {
        const fetchUserData = async () => {
            if (user_id) {
                setLoading(true);
                try {
                    const data = await getStudent(user_id);
                    const schoolData = data.school_id ? await getSchoolDetails(data.school_id) : { school_name: '' };
                    data.school_name = schoolData;
                    setFirstName(data.first_name);
                    setLastName(data.last_name);
                    setParentEmail(data.parent_email);
                    setParentName(data.parent_name);
                    setParentPhone(data.parent_phone);
                    setGrade(data.grade);
                    setSchoolName(data.school_name);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUserData();
    }, [user_id]);

    const renderForm = () => {
        switch (selectedOption) {
            case 'AboutMe':
                return <AboutMeForm user_id = {user_id} first_name={first_name} last_name={last_name} setFirstName={setFirstName} setLastName={setLastName} />;
            case 'ParentInfo':
                return <ParentInfoForm user_id = {user_id} parent_name={parent_name} parent_email={parent_email} parent_phone={parent_phone} setParentName={setParentName} setParentEmail={setParentEmail} setParentPhone={setParentPhone} />;
            case 'SchoolInfo':
                return <SchoolInfoForm grade={grade} school_name={school_name} />;
            default:
                return null;
        }
    };

    return (
      <div>
        {loading ? <BigSpinner /> : 
        (<div className="flex min-h-screen w-full flex-col">
          <div className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-semibold">Profile Settings</h1>
            </div>
            <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
              <nav className="flex md:flex-col gap-4 text-sm">
                  <button onClick={() => setSelectedOption('AboutMe')} className={`font-semibold ${selectedOption === 'AboutMe' ? 'text-primary' : ''}`}>About Me</button>
                  <button onClick={() => setSelectedOption('ParentInfo')} className={`${selectedOption === 'ParentInfo' ? 'font-semibold text-primary' : ''}`}>Parent Information</button>
                  <button onClick={() => setSelectedOption('SchoolInfo')} className={`${selectedOption === 'SchoolInfo' ? 'font-semibold text-primary' : ''}`}>School Information</button>
              </nav>
            <div className="flex-1">
                {renderForm()}
            </div>
          </div>
        </div>
        </div>)}
      </div>
    );
};

export default UserProfile;
