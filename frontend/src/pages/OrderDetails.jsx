import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { getOrderById } from '../services/api';

const STATUS_STEPS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrderById(id);
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError(err.message || 'Unable to retrieve order details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 bg-white rounded-3xl border border-rose-200 shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">{error || 'Unable to load order details'}</p>
        <Link
          to="/orders"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          ← Back to My Orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
        <Link to="/orders" className="hover:text-indigo-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">Order #{order._id}</span>
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Order
              </span>
              <span className="font-mono text-base font-bold text-slate-900">
                #{order._id}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Placed on {new Date(order.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              💳 Payment: {order.paymentStatus}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              🚚 Status: {order.status}
            </span>
          </div>
        </div>

        {/* Status Progression Stepper */}
        {order.status !== 'CANCELLED' && (
          <div className="pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Shipment Tracking
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {STATUS_STEPS.map((step, idx) => {
                const isComplete = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step} className="text-center">
                    <div
                      className={`h-2.5 rounded-full mb-2 transition-all ${
                        isComplete ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    />
                    <span
                      className={`text-[11px] font-bold block ${
                        isCurrent
                          ? 'text-indigo-600'
                          : isComplete
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items Snapshot */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Items in this Order ({order.items?.length || 0})
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              Frozen Price Snapshot
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {order.items?.map((item) => (
              <div
                key={item._id}
                className="py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ₹{Number(item.price).toLocaleString('en-IN')} × {item.quantity} unit{item.quantity > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <p className="text-sm font-extrabold text-slate-900 shrink-0">
                  ₹{Number(item.price * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">
                ₹{Number(order.totalAmount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping Fee</span>
              <span className="font-bold text-emerald-600 uppercase text-[11px]">
                FREE
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 text-sm">
              <span className="font-bold text-slate-900">Grand Total</span>
              <span className="text-xl font-black text-slate-900">
                ₹{Number(order.totalAmount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Shipping & Payment Metadata */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-xs">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>Delivery Address</span>
            </div>
            <div className="pt-3 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">
                {order.shippingAddress?.fullName}
              </p>
              <p>{order.shippingAddress?.addressLine1 || order.shippingAddress?.street}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
                {order.shippingAddress?.pincode}
              </p>
              <p className="text-slate-400">
                Country: {order.shippingAddress?.country || 'India'}
              </p>
              <p className="pt-2 text-slate-800 font-medium">
                📞 {order.shippingAddress?.phone}
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-xs">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Payment Information</span>
            </div>
            <div className="pt-3 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="font-bold text-slate-900">
                  {order.paymentMethod || 'Razorpay'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span className="font-bold text-emerald-600">
                  {order.paymentStatus}
                </span>
              </div>
              {order.razorpayOrderId && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Razorpay Order ID
                  </span>
                  <span className="font-mono text-[11px] text-slate-700 break-all">
                    {order.razorpayOrderId}
                  </span>
                </div>
              )}
              {order.razorpayPaymentId && (
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Razorpay Payment ID
                  </span>
                  <span className="font-mono text-[11px] text-slate-700 break-all">
                    {order.razorpayPaymentId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
