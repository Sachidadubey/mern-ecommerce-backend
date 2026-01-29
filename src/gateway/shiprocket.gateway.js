const axios = require("axios");

exports.createShipment = async (order) => {
  const payload = {
    order_id: order._id.toString(),
    order_date: new Date().toISOString(),
    pickup_location: "Primary",
    billing_customer_name: order.user.name,
    billing_email: order.user.email,
    billing_phone: order.user.phone,
    billing_address: order.address.line1,
    billing_city: order.address.city,
    billing_pincode: order.address.pincode,
    billing_state: order.address.state,
    billing_country: "India",
    order_items: order.items.map(item => ({
      name: item.name,
      sku: item.product.toString(),
      units: item.quantity,
      selling_price: item.price,
    })),
    payment_method: "Prepaid",
    sub_total: order.totalAmount,
  };

  const response = await axios.post(
    "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
    payload,
    {
      headers: {
        Authorization: `Bearer ${process.env.SHIPROCKET_TOKEN}`,
      },
      timeout:8000,
    }
  );

  return {
    tracking_id: response.data.tracking_id,
    courier_name: response.data.courier_name,
  };
};
