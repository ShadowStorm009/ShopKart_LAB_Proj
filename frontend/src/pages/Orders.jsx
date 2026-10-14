import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  CreditCard,
  Truck,
  ExternalLink,
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { getOrders, updateOrderStatus } from '../services/api';

const STATUS_STEPS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrders();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserOrders();
  }, []);

  // Quick dev action for Bonus: update status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await updateOrderStatus(orderId, newStatus);
      // Update locally
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SHIPPED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'CONFIRMED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PLACED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPaymentBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // State 1: Loading
  if (loading && orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-base font-bold text-slate-800">Loading your orders...</h2>
        <p className="text-xs text-slate-400 mt-1">Retrieving order history from database</p>
      </div>
    );
  }

  // State 2: Error
  if (error && orders.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 bg-white rounded-3xl border border-rose-200 shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Unable to load orders</h2>
        <p className="text-xs text-slate-500 mt-2">{error}</p>
        <button
          onClick={fetchUserOrders}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  // State 3: Empty State (Task 8)
  if (!loading && orders.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4 text-center">
        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-slate-900">
            You have not placed any orders yet.
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Your completed purchases and delivery tracking will appear here once you place an order.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Start Shopping →</span>
          </Link>
        </div>
      </div>
    );
  }

  // State 4: Populated Orders List
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-slate-200 gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Order History</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track current shipments, view snapshot details, and see payment statuses
          </p>
        </div>

        <button
          onClick={fetchUserOrders}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {orders.map((order) => {
          const currentStepIndex = STATUS_STEPS.indexOf(order.status);

          return (
            <div
              key={order._id}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Order Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Order
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      #{order._id}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {order.razorpayPaymentId && (
                    <p className="text-[11px] text-slate-400 font-mono">
                      Payment ID: {order.razorpayPaymentId}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getPaymentBadge(
                      order.paymentStatus
                    )}`}
                  >
                    💳 {order.paymentStatus || 'PENDING'}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    🚚 {order.status}
                  </span>
                </div>
              </div>

              {/* Items Snapshot Preview */}
              <div className="py-4 space-y-3">
                {order.items?.map((item, idx) => (
                  <div
                    key={item._id || idx}
                    className="flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
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
                        <p className="font-bold text-slate-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <p className="font-extrabold text-slate-900 shrink-0">
                      ₹{Number(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bonus Challenge: Status Progression Tracker */}
              {order.status !== 'CANCELLED' && (
                <div className="my-4 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Delivery Progress (Bonus Feature)
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {STATUS_STEPS.map((step, idx) => {
                      const isComplete = currentStepIndex >= idx;
                      const isCurrent = currentStepIndex === idx;

                      return (
                        <div key={step} className="text-center">
                          <div
                            className={`h-2 rounded-full mb-1 transition-all ${
                              isComplete
                                ? 'bg-indigo-600'
                                : 'bg-slate-200'
                            }`}
                          />
                          <span
                            className={`text-[10px] font-bold block truncate ${
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

              {/* Card Footer: Summary & Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Total Amount</span>
                    <span className="text-base font-black text-slate-900">
                      ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Dev / TA Progression Simulator for Bonus */}
                  <div className="border-l border-slate-200 pl-4 hidden md:block">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">
                      Simulate Status (TA Demo)
                    </label>
                    <select
                      value={order.status}
                      disabled={updatingId === order._id}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-medium bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {STATUS_STEPS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/orders/${order._id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
