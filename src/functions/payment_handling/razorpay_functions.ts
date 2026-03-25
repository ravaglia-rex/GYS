import axios from "axios";
import {
  RAZORPAY_APIS,
  CREATE_RAZORPAY_CUSTOMER,
  CREATE_RAZORPAY_ORDER,
  MARK_PAYMENT_PENDING,
  DEV_MODE_PAYMENT,
  STUDENTS_APIS,
  FETCH_PAYEE_DETAILS,
} from "../../constants/constants";
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
  payee_zipcode: string
) => {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${RAZORPAY_APIS}${CREATE_RAZORPAY_CUSTOMER}`,
    {
      uid,
      name: payee_name,
      email: payee_email,
      contact: payee_contact,
      notes: {
        line1: payee_address_line1,
        line2: payee_address_line2,
        city: payee_city,
        state: payee_state,
        country: payee_country,
        zipcode: payee_zipcode,
      },
    },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
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
  membership_level: number,
  userID: string
) => {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${RAZORPAY_APIS}${CREATE_RAZORPAY_ORDER}`,
    {
      amount,
      currency,
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
          zipcode: payee_zipcode,
        },
      },
      notes: {
        goods_description: `Argus membership level ${membership_level}`,
        user_id: userID,
        membership_level,
        payee_name,
        payee_email,
        address_line_1: payee_address_line1,
        city: payee_city,
        state: payee_state,
        zipcode: payee_zipcode,
      },
    },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
};

export const markPaymentPending = async (
  uid: string,
  address_line_1: string,
  amount: number,
  city: string,
  currency: string,
  email: string,
  membership_level: number,
  payee_email: string,
  payee_name: string,
  state: string,
  student_name: string,
  transaction_id: string,
  zipcode: string
) => {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${RAZORPAY_APIS}${MARK_PAYMENT_PENDING}`,
    {
      uid,
      address_line_1,
      amount,
      city,
      currency,
      email,
      membership_level,
      payee_email,
      payee_name,
      state,
      student_name,
      transaction_id,
      zipcode,
    },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
};

export const getRazorpayPayees = async (uid: string) => {
  const authToken = await authTokenHandler.getAuthToken();
  const encodedUID = encodeURIComponent(uid);
  const response = await axios.get(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${FETCH_PAYEE_DETAILS}/${encodedUID}`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
};

export const devModePayment = async (
  uid: string,
  address_line_1: string,
  amount: number,
  city: string,
  currency: string,
  email: string,
  membership_level: number,
  payee_email: string,
  payee_name: string,
  state: string,
  student_name: string,
  zipcode: string
) => {
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${RAZORPAY_APIS}${DEV_MODE_PAYMENT}`,
    {
      uid,
      address_line_1,
      amount,
      city,
      currency,
      email,
      membership_level,
      payee_email,
      payee_name,
      state,
      student_name,
      zipcode,
    },
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
};
