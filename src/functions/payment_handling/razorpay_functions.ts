import axios from "axios";
import { RAZORPAY_APIS, CREATE_RAZORPAY_CUSTOMER, CREATE_RAZORPAY_ORDER, GET_RAZORPAY_PAYEES, STUDENTS_APIS, MARK_PAYMENT_PENDING, DEV_MODE_PAYMENT } from "../../constants/constants";
import authTokenHandler from "../auth_token/auth_token_handler";

export const handleCreateCustomer = async (
  uid: string,
  payee_name: string, 
  payee_email: string, 
  payee_contact: string,
  payee_address_line1: string,
  payee_address_line2: string,
  payee_city: string,
  payee_state: string,
  payee_country: string,
  payee_zipcode: string,
  ) => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const config = {
      method: 'post',
      url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${RAZORPAY_APIS}${CREATE_RAZORPAY_CUSTOMER}`,
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        name: payee_name,
        email: payee_email,
        contact: payee_contact,
        notes: {
          uid: uid,
          line1: payee_address_line1,
          line2: payee_address_line2,
          city: payee_city,
          state: payee_state,
          country: payee_country,
          zipcode: payee_zipcode
        }
      }
    }
    const response = await axios.request(config);

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const handleOrderExam = async (
  amount: number, 
  currency: string, 
  payee_name: string, 
  payee_contact: string, 
  payee_email: string, 
  payee_address_line1: string, 
  payee_address_line2: string, 
  payee_city: string, 
  payee_state: string, 
  payee_zipcode: string, 
  payee_country: string,
  formID: string,
  examTitle: string, 
  userID: string
  ) => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const config = {
      method: 'post',
      url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${RAZORPAY_APIS}${CREATE_RAZORPAY_ORDER}`,
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        amount: amount,
        currency: currency,
        customer_details: {
          name: payee_name,
          contact: payee_contact,
          email: payee_email,
          shipping_address: {
            line1: payee_address_line1,
            line2: payee_address_line2,
            city: payee_city,
            state: payee_state,
            country: payee_country,
            zipcode: payee_zipcode
          }
        },
        notes: {
          goods_description: `Payment towards: ${examTitle}`, // Razorpay mandates this field
          user_id: userID,
          form_id: formID,
          exam_title: examTitle,
          payee_name: payee_name,
          payee_email: payee_email,
          address_line_1: payee_address_line1,
          address_line_2: payee_address_line2,
          city: payee_city,
          state: payee_state,
          zipcode: payee_zipcode
        }
      }
    }
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const markPaymentPending = async (
  address_line_1: string,
  amount: number,
  city: string,
  currency: string,
  email: string,
  exam_title: string,
  form_id: string,
  payee_email: string,
  payee_name: string,
  state: string,
  student_name: string,
  transaction_id: string,
  uid: string,
  zipcode: string
) => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const config = {
      method: 'post',
      url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${MARK_PAYMENT_PENDING}`,
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        address_line_1: address_line_1,
        amount: amount,
        city: city,
        currency: currency,
        email: email,
        exam_title: exam_title,
        form_id: form_id,
        payee_email: payee_email,
        payee_name: payee_name,
        state: state,
        student_name: student_name,
        transaction_id: transaction_id,
        uid: uid,
        zipcode: zipcode
      }
    };
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRazorpayPayees = async (
  uid: string,
) => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const encodedUID = encodeURIComponent(uid);
    const config = {
      method: 'get',
      url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${GET_RAZORPAY_PAYEES}/${encodedUID}`,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Dev mode payment bypass function
export const devModePayment = async (
  address_line_1: string,
  amount: number,
  city: string,
  currency: string,
  email: string,
  exam_title: string,
  form_id: string,
  payee_email: string,
  payee_name: string,
  state: string,
  student_name: string,
  uid: string,
  zipcode: string
) => {
  try {
    // Dev mode payment doesn't require auth token
    const config = {
      method: 'post',
      url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${RAZORPAY_APIS}${DEV_MODE_PAYMENT}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        address_line_1: address_line_1,
        amount: amount,
        city: city,
        currency: currency,
        email: email,
        exam_title: exam_title,
        form_id: form_id,
        payee_email: payee_email,
        payee_name: payee_name,
        state: state,
        student_name: student_name,
        uid: uid,
        zipcode: zipcode
      }
    };
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    throw error;
  }
};