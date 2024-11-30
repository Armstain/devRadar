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
  Legend
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import BlurFade from '@/components/ui/blur-fade';

const DashboardCharts = ({ stats }) => {
  // Transform application stats to show pipeline progress
  const pipelineData = [
    {
      name: 'Applications Pipeline',
      "Total Submitted": stats?.applications.total || 0,
      "In Process": (stats?.applications.applied || 0) + (stats?.applications.interviewing || 0),
      "Interviewing": stats?.applications.interviewing || 0,
      "Offers": stats?.applications.offered || 0,
    }
  ];

  // GitHub activity data
  const githubData = [
    {
      name: 'GitHub Activity',
      Repositories: stats?.github?.publicRepos || 0,
      "Community Size": (stats?.github?.followers || 0) + (stats?.github?.following || 0),
    }
  ];

  return (
    <div className="space-y-6">
      <BlurFade delay={0.7}>
        <Card>
          <CardHeader>
            <CardTitle>Application Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={pipelineData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="Total Submitted" 
                    stackId="1" 
                    fill="#94a3b8" 
                    stroke="#64748b"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="In Process" 
                    stackId="2" 
                    fill="#93c5fd" 
                    stroke="#3b82f6"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Interviewing" 
                    stackId="3" 
                    fill="#86efac" 
                    stroke="#22c55e"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Offers" 
                    stackId="4" 
                    fill="#fde047" 
                    stroke="#eab308"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </BlurFade>

      <BlurFade delay={0.8}>
        <Card>
          <CardHeader>
            <CardTitle>GitHub Presence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={githubData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Repositories" fill="#3b82f6" />
                  <Bar dataKey="Community Size" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
};

export default DashboardCharts;