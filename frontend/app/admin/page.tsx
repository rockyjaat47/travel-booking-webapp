'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Building2, 
  Calendar, 
  IndianRupee,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { DashboardStats } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getDashboardStats();
      setStats(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchDashboardStats} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.counts.totalUsers.toLocaleString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Bookings"
          value={stats.counts.totalBookings.toLocaleString()}
          subtitle={`${stats.counts.todayBookings} today`}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(Number(stats.revenue.total))}
          subtitle={`${formatCurrency(Number(stats.revenue.monthly))} this month`}
          icon={IndianRupee}
          color="purple"
        />
        <StatCard
          title="Pending Actions"
          value={stats.pendingActions.cancellations + stats.pendingActions.activeHolds}
          subtitle={`${stats.pendingActions.cancellations} cancellations, ${stats.pendingActions.activeHolds} holds`}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
          <Button variant="ghost" onClick={() => window.location.href = '/admin/bookings'}>
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {booking.bookingNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(booking as any).user?.firstName} {(booking as any).user?.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {booking.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(Number(booking.totalAmount))}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bookings by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bookings by Category</h2>
          <div className="space-y-4">
            {stats.bookingsByCategory.map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    item.category === 'BUS' ? 'bg-blue-500' :
                    item.category === 'AIRLINE' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`} />
                  <span className="text-gray-700">{item.category}</span>
                </div>
                <span className="font-semibold text-gray-900">{item._count.id}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/admin/partners/new'}>
              <Building2 className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/admin/cancellations'}>
              <XCircle className="w-4 h-4 mr-2" />
              Review Cancellations
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/admin/reports'}>
              <TrendingUp className="w-4 h-4 mr-2" />
              View Reports
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/admin/settings'}>
              <Clock className="w-4 h-4 mr-2" />
              Configure Holds
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}