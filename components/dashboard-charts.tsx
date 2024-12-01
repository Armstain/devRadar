import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
  Pie,
  PieChart
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import BlurFade from '@/components/ui/blur-fade';

const DashboardCharts = ({ stats }) => {
  // Transform application stats for the bar chart
  const statusData = [
    {
      name: "Total Submitted",
      value: stats?.applications.total || 0,
      color: "#94a3b8"
    },
    {
      name: "In Process",
      value: stats?.applications.applied || 0,
      color: "#93c5fd"
    },
    {
      name: "In Progress",
      value: stats?.applications.interviewing || 0,
      color: "#86efac"
    },
    {
      name: "Offers",
      value: stats?.applications.offered || 0,
      color: "#fde047"
    },
    
  ];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            Count: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  // GitHub activity data
  // const languagesData = stats?.github?.languages?.map((lang: any) => ({
  //   name: lang.language,
  //   value: lang.percentage
  // })).slice(0, 5) || []; // Top 5 languages

  const currentStreak = stats?.github?.contributions?.currentStreak || 0;
  const averagePerDay = stats?.github?.contributions?.averagePerDay || 0;
  
  // const languageColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Celebration messages for streak milestones
  const getStreakMessage = (streak: number) => {
    if (streak >= 100) return "Legendary streak! 🏆";
    if (streak >= 50) return "Unstoppable! 🚀";
    if (streak >= 30) return "You're on fire! 🔥";
    return `${30 - streak} days to reach 30`;
  };


  // Celebration messages for commit averages
  const getCommitMessage = (avg: number) => {
    if (avg >= 10) return "Code master! 👑";
    if (avg >= 7) return "Crushing it! 💪";
    if (avg >= 5) return "Excellent pace! ⭐";
    return "Aim for 5 commits/day";
  };

  return (
    <div className="space-y-6">
      {/* Application Pipeline chart */}
      <BlurFade delay={0.7}>
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Application Pipeline</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Current status distribution</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis 
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-4">
              {statusData.map((status, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-2 text-sm"
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-muted-foreground">{status.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </BlurFade>

      {/* GitHub Stats */}
      <BlurFade delay={0.8}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Streak Card */}
          <Card className={`hover:shadow-lg transition-all duration-300 ${
            currentStreak >= 30 
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 animate-pulse'
              : 'bg-gradient-to-br from-purple-500 to-indigo-600'
          }`}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-white mb-2">
                <span className="text-5xl font-bold">{currentStreak}</span>
                <span className="text-xl ml-2">days</span>
                {currentStreak >= 30 && <span className="ml-2 text-2xl">🏆</span>}
              </div>
              <p className="text-white/80 text-sm font-medium">
                Current Streak {currentStreak >= 30 ? '🔥🔥🔥' : '🔥'}
              </p>
              <div className="mt-4 w-full bg-white/20 h-1.5 rounded-full">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    currentStreak >= 30 ? 'bg-amber-300 animate-pulse' : 'bg-white'
                  }`}
                  style={{ width: `${Math.min((currentStreak / 30) * 100, 100)}%` }}
                />
              </div>
              <p className={`text-xs mt-2 ${
                currentStreak >= 30 ? 'text-amber-100' : 'text-white/60'
              }`}>
                {getStreakMessage(currentStreak)}
              </p>
            </CardContent>
          </Card>

          {/* Average Commits Card */}
          <Card className={`hover:shadow-lg transition-all duration-300 ${
            averagePerDay >= 5 
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse'
              : 'bg-gradient-to-br from-green-500 to-emerald-600'
          }`}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-white mb-2">
                <span className="text-5xl font-bold">{averagePerDay}</span>
                {averagePerDay >= 5 && <span className="ml-2 text-2xl">⭐</span>}
              </div>
              <p className="text-white/80 text-sm font-medium">
                Avg Commits/Day {averagePerDay >= 5 ? '📈📈📈' : '📈'}
              </p>
              <div className="mt-4 w-full bg-white/20 h-1.5 rounded-full">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    averagePerDay >= 5 ? 'bg-emerald-300 animate-pulse' : 'bg-white'
                  }`}
                  style={{ width: `${Math.min((averagePerDay / 5) * 100, 100)}%` }}
                />
              </div>
              <p className={`text-xs mt-2 ${
                averagePerDay >= 5 ? 'text-emerald-100' : 'text-white/60'
              }`}>
                {getCommitMessage(averagePerDay)}
              </p>
            </CardContent>
          </Card>
        </div>
      </BlurFade>
    </div>
  );
};

export default DashboardCharts;