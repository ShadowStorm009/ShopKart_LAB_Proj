import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, ShoppingBag, ShieldCheck, Calendar, CreditCard, MapPin } from 'lucide-react';
import { getOrderById } from '../services/api';

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(id);
        if (data.success && data.order) {
          setOrder(data.order);
        }
      } catch (err) {
        setError(err.message || 'Unable to retrieve order confirmation details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto my-20 px-4 text-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading order confirmation...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm text-center">
        {/* Animated Success Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
          Payment Confirmed
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Order Placed Successfully!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Thank you for shopping with ShopKart. Your payment has been verified and your order is now confirmed.
        </p>

        {/* Order Details Card */}
        <div className="mt-8 bg-slate-50/70 rounded-2xl border border-slate-200 p-6 text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                ShopKart Order ID
              </p>
              <p className="text-xs sm:text-sm font-mono font-bold text-slate-900 mt-0.5 break-all">
                {id}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs">
                Status: {order?.status || 'PLACED'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                Payment: {order?.paymentStatus || 'PAID'}
              </span>
            </div>
          </div>

          {order && (
            <>
              {/* Item Snapshot summary */}
              <div className="space-y-2 py-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Purchased Items Snapshot ({order.items?.length || 0})
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {order.items?.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className="flex items-center justify-between text-xs py-1 text-slate-700"
                    >
                      <span className="font-medium truncate mr-2">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-bold text-slate-900 shrink-0">
                        ₹{Number(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Shipping info */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {order.shippingAddress && (
                  <div className="text-xs text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      Delivering to {order.shippingAddress.fullName}, {order.shippingAddress.city} ({order.shippingAddress.pincode})
                    </span>
                  </div>
                )}
                <div className="text-right">
                  <span className="text-xs text-slate-400 mr-2">Total Amount:</span>
                  <span className="text-base font-black text-slate-900">
                    ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/orders"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>View My Orders</span>
          </Link>
          <Link
            to="/products"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
