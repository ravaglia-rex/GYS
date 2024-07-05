import axios from "axios";
import { RAZORPAY_ORDER_EXAM } from "../../constants/constants";

export const handleOrderExam = async (amount: number, currency: string, form_id: string) => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_API_GATEWAY_ROUTE}${RAZORPAY_ORDER_EXAM}`, {
      amount,
      currency,
      form_id
    });
    return response.data;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error; // Rethrow the error or handle it as needed
  }
};