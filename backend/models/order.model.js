import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    }, // Purchase-time snapshot price
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    image: {
      type: String,
    },
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },
    street: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (items) => Array.isArray(items) && items.length > 0,
        "Order must contain at least one item",
      ],
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      default: "Razorpay",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    status: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "PLACED",
        "CONFIRMED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PENDING_PAYMENT",
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validation sync hook between user/customer & addressLine1/street/pincode/postalCode
orderSchema.pre("validate", function () {
  if (this.user && !this.customer) {
    this.customer = this.user;
  }
  if (this.customer && !this.user) {
    this.user = this.customer;
  }
  if (this.shippingAddress) {
    if (this.shippingAddress.addressLine1 && !this.shippingAddress.street) {
      this.shippingAddress.street = this.shippingAddress.addressLine1;
    } else if (this.shippingAddress.street && !this.shippingAddress.addressLine1) {
      this.shippingAddress.addressLine1 = this.shippingAddress.street;
    }
    if (this.shippingAddress.pincode && !this.shippingAddress.postalCode) {
      this.shippingAddress.postalCode = this.shippingAddress.pincode;
    } else if (this.shippingAddress.postalCode && !this.shippingAddress.pincode) {
      this.shippingAddress.pincode = this.shippingAddress.postalCode;
    }
  }
  if (this.totalAmount && this.subtotal === undefined) {
    this.subtotal = this.totalAmount;
  }
});


const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
