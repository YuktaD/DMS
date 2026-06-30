import { PayPalButtons } from "@paypal/react-paypal-js";

const PayPalCheckout = ({ amount, onSuccess }) => {
  return (
    <PayPalButtons
      style={{ layout: "vertical" }}
      createOrder={(data, actions) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: amount,
              },
            },
          ],
        });
      }}
      onApprove={async (data, actions) => {
        const details = await actions.order.capture();
        console.log("Payment Successful:", details);

        // Notify parent (unlock PDF)
        onSuccess(details);
      }}
      onError={(err) => {
        console.error("PayPal Error:", err);
        alert("Payment failed. Please try again.");
      }}
    />
  );
};

export default PayPalCheckout;
