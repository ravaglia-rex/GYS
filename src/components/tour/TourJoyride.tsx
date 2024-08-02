import React from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useLocation } from 'react-router-dom';
import CardCarousel from './CardCarousel';

const steps: Step[] = [
    {
        title: 'Exams Dashboard',
        target: '.exams-dashboard',
        content: 'This is the exams dashboard. Here you can view all exams assigned to you as well as appear for them.',
        disableBeacon: true,
    },
    {
        title: 'Payments Dashboard',
        target: '.payments-dashboard',
        content: 'This is the payments dashboard. Here you can view all your payments and their details.'
    },
    {
        title: 'Exam Cards',
        target: '.exam-cards-group',
        content: (
            <div>
                <p>These are the exam cards. You can hover on any card to view more details.</p>
                <CardCarousel />
            </div>
        )
    },
    {
        title: 'Payments Tabs',
        target: '.payments-tabs',
        content: 'These are the payments tabs. You can view and manage your payments here.'
    },
    {
        title: 'User Profile',
        target: '.user-profile',
        content: 'This is your profile. You can view and edit your profile details here as well as sign out.'
    }
];


const uncommon_steps: Step[] = [
    {
        title: 'Profile Page',
        target: '.profile-settings',
        content: 'This is your profile page. You can view and edit your profile details here.',
        disableBeacon: true,
    },
    {
        title: 'About Me',
        target: '.about-info',
        content: 'This is the about me section. You can view and edit your personal details here.'
    },
    {
        title: 'Parent Info',
        target: '.parent-info',
        content: 'This is the parent information section. You can view and edit your parent details here.'
    },
    {
        title: 'School Info',
        target: '.school-info',
        content: 'This is the school info section. You can view and edit your school details here.'
    },
    {
        title: 'Save your changes',
        target: '.save-button',
        content: 'Don\'t forget to save your changes before leaving the page! 😅'
    }
];

interface TourJoyrideProps {
    run: boolean;
    setRun: (run: boolean) => void;
}

const TourJoyride: React.FC<TourJoyrideProps> = ({ run, setRun }) => {
    const location = useLocation();

    const filteredSteps = location.pathname === '/profile' ? uncommon_steps : steps.filter(step => {
        if (location.pathname === '/dashboard' && step.target === '.payments-tabs') return false;
        if (location.pathname === '/payments' && step.target === '.exam-cards-group') return false;
        return true;
    });

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;

        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            setRun(false);
        }
    };

    return (
        <Joyride
            steps={filteredSteps}
            run={run}
            showProgress
            showSkipButton
            continuous={true}
            scrollToFirstStep={false}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    backgroundColor: '#fff',
                    primaryColor: '#1e90ff',
                    textColor: '#000',
                    overlayColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1000,
                },
            }}
        />
    );
};

export default TourJoyride;
