import axios from "axios";
import { RAZORPAY_APIS, CREATE_RAZORPAY_CUSTOMER, CREATE_RAZORPAY_ORDER } from "../../constants/constants";

export const handleCreateCustomer = async (
  payee_name: string, 
  payee_email: string, 
  payee_contact: string,
  payee_gstin: string
  ) => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${RAZORPAY_APIS}${CREATE_RAZORPAY_CUSTOMER}`, {
      name: payee_name,
      email: payee_email,
      contact: payee_contact,
      gstin: payee_gstin
    });
    return response.data;
  } catch (error) {
    console.error("Error creating Razorpay customer:", error);
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
    const response = await axios.post(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${RAZORPAY_APIS}${CREATE_RAZORPAY_ORDER}`, {
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
        userID: userID,
        formID: formID,
        examTitle: examTitle
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
};