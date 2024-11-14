async function Calc_Price() {
  const getMenuItem = Xrm.Page.getAttribute("initiumc_menuitem");
  const menuItemId = getMenuItem.getValue()[0].id;
  const menuItemName = getMenuItem.getValue()[0].name;
  const quantity = Xrm.Page.getAttribute("initiumc_quantity").getValue();

  console.log("Menu Item ID: " + menuItemId);
  console.log("Menu Item Name: " + menuItemName);
  console.log("Quantity: " + quantity);

  if (getMenuItem != null) {
    try {
      const result = await Xrm.WebApi.retrieveRecord(
        "initiumc_menuitem",
        menuItemId,
        "?$select=initiumc_price"
      );
      const menuItemPrice = result.initiumc_price;
      console.log("Menu Item Price: " + menuItemPrice);

      const totalPrice = menuItemPrice * quantity;
      console.log("Total Price: " + totalPrice);

      // Set the new value of the price attribute
      Xrm.Page.getAttribute("initiumc_totalprice").setValue(totalPrice);
    } catch (error) {
      console.error("Error retrieving menu item price: " + error.message);
    }
  }
}

async function getOrderRecord() {
  try {
    const order = Xrm.Page.getAttribute("initiumc_related_order");
    const orderId = order.getValue()[0].id.replace("{", "").replace("}", "");
    const result = await Xrm.WebApi.retrieveRecord(
      "initiumc_order_ss",
      orderId
    );

    console.log("Order Record Result", result);
    console.log("Order ID: " + result.initiumc_order_ssid);

    return result;
  } catch (error) {
    console.error("Error retrieving order data: " + error.message);
  }
}

async function Finalized_Price() {
  try {
    const order = Xrm.Page.getAttribute("initiumc_related_order");
    const orderId = order.getValue()[0].id.replace("{", "").replace("}", "");

    const orderData = await getOrderRecord();
    const orderPrice = orderData.initiumc_orderprice;
    const discount = orderData.initiumc_discount;
    const orderStatus = orderData.initiumc_orderstatus;

    console.log("Order Price: " + orderPrice);
    console.log("Discount: " + discount);
    console.log("Order Status: " + orderStatus);
    console.log("Finalized_Price Order ID: " + orderId);

    const orderItems = await Xrm.WebApi.retrieveMultipleRecords(
      "initiumc_orderitem_ss",
      `?$filter=_initiumc_related_order_value eq ${orderId}`
    );

    let totalOrderPrice = 0;
    if (orderItems.entities.length > 0) {
      orderItems.entities.forEach((item) => {
        totalOrderPrice += item.initiumc_totalprice;
      });

      console.log("Total Order Price: " + totalOrderPrice);

      const orderItemQuantity =
        Xrm.Page.getAttribute("initiumc_quantity").getValue();

      const totalPrice = totalOrderPrice;

      const discountAmount = (totalPrice * discount) / 100;
      const totalPriceWithDiscount = totalPrice - discountAmount;
      const totalPriceWithDiscountandOrderPrice =
        totalPriceWithDiscount + orderPrice;
      console.log(
        "Total Price With total Discount And OrderPrice: " +
          totalPriceWithDiscountandOrderPrice
      );

      await Xrm.WebApi.updateRecord("initiumc_order_ss", orderId, {
        initiumc_orderprice: totalPriceWithDiscountandOrderPrice,
      });
      console.log(
        "Order updated successfully with new order price: " +
          totalPriceWithDiscountandOrderPrice
      );
    } else {
      const totalPrice = Xrm.Page.getAttribute(
        "initiumc_totalprice"
      ).getValue();

      const orderItemQuantity =
        Xrm.Page.getAttribute("initiumc_quantity").getValue();

      const discountAmount = (totalPrice * discount) / 100;
      const totalPriceWithDiscount = totalPrice - discountAmount;

      console.log(
        "Total Price With Discount (No Items): " + totalPriceWithDiscount
      );

      await Xrm.WebApi.updateRecord("initiumc_order_ss", orderId, {
        initiumc_orderprice: totalPriceWithDiscount,
      });
      console.log(
        "Order updated successfully with new order price: " +
          totalPriceWithDiscount
      );
    }
  } catch (error) {
    console.error("Error in Finalized_Price: " + error.message);
  }
}
