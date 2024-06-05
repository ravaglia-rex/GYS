// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import { RootState } from '../../state_data/reducer';

// const Protected: React.FC = ({ children }) => {
//   const navigate = useNavigate();
//   const user = useSelector((state: RootState) => state.user);
//   if (!user) {
//     navigate('/login');
//   }
//   return <>{children}</>;
// }