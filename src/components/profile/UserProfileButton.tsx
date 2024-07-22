import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon } from 'lucide-react';

const UserProfileButton: React.FC = () => {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate('/profile');
    };

    return (
        <div>
            <div className="flex items-center cursor-pointer" onClick={handleNavigate}>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
            </div>
        </div>
    );
};

export default UserProfileButton;
