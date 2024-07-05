import axios from 'axios';
import { CREATE_EXPEDITED_SCHOOL, SCHOOLS_APIS, FETCH_SCHOOL_NAMES_AND_IDS } from "../constants/constants";

type expeditedSchool = {
    school_name: string;
}

export const createExpeditedSchool = async (school: expeditedSchool) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}${CREATE_EXPEDITED_SCHOOL}`, {
            school_name: school.school_name
        });
        const data = response.data;
        return data.id;
    } catch (e) {
        throw new Error(`Error creating ${school.school_name}. Please contact talentsearch@argus.ai`);
    }
}

// FETCH ALL SCHOOL NAMES AND IDs
export const fetchSchoolNamesAndIds = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}${FETCH_SCHOOL_NAMES_AND_IDS}`);
        const data = await response.data;
        return data;
    } catch (e) {
        throw new Error(`Error fetching schools. Please contact talentsearch@argus.ai`);
    }
};