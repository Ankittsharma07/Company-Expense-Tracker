import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { CategoryTotal, MonthlyTotal } from '../../lib/api';

const monthLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('en-US', { month: 'short' });
};

export const SpendTrendChart = ({ data }: { data: MonthlyTotal[] }) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-slate-400">
        <div className="text-center">
          <p className="text-sm">No spending data available yet</p>
          <p className="text-xs mt-1">Data will appear once expenses are added</p>
        </div>
      </div>
    );
  }

  // Sort data chronologically (oldest to newest)
  const sortedData = [...data].sort((a, b) =>
    new Date(a.month).getTime() - new Date(b.month).getTime()
  );

  // Create a map of existing data
  const dataMap = new Map(
    sortedData.map(item => [item.month.substring(0, 7), Number(item.total) || 0])
  );

  // Generate last 6 months from current month
  const now = new Date();
  const months: { month: string; total: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthISO = `${monthKey}-01T00:00:00.000Z`;

    months.push({
      month: monthISO,
      total: dataMap.get(monthKey) || 0
    });
  }

  const labels = months.map((entry) => monthLabel(entry.month));
  const values = months.map((entry) => entry.total);

  const option = {
    tooltip: {
      trigger: 'axis',
      className: 'echarts-tooltip',
      padding: 0,
      borderWidth: 0,
      textStyle: { color: '#1f2937', fontSize: 12 },
      formatter: (params: any) => {
        const param = params[0];
        return `<div style="padding: 8px 12px; background: white; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="font-weight: 600; margin-bottom: 4px;">${param.name}</div>
          <div style="color: #0ea5a4; font-weight: 600;">$${param.value.toLocaleString()}</div>
        </div>`;
      }
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '8%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 12,
        margin: 16
      },
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#e2e8f0'
        }
      },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 12,
        formatter: (value: number) => {
          if (value >= 1000) {
            return `$${(value/1000).toFixed(1)}k`;
          }
          return `$${value}`;
        }
      },
    },
    series: [
      {
        name: 'Spend',
        type: 'line',
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#0ea5a4',
          type: 'solid'
        },
        itemStyle: {
          color: '#0ea5a4',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(14, 165, 164, 0.2)' },
              { offset: 1, color: 'rgba(14, 165, 164, 0)' }
            ]
          }
        },
        data: values,
        showSymbol: true,
        emphasis: {
          scale: true,
          scaleSize: 10
        }
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '320px' }} />;
};

export const CategoryPieChart = ({ data }: { data: CategoryTotal[] }) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-slate-400">
        <div className="text-center">
          <p className="text-sm">No category data available yet</p>
          <p className="text-xs mt-1">Data will appear once expenses are added</p>
        </div>
      </div>
    );
  }

  const colors = ['#0ea5a4', '#38bdf8', '#f59e0b', '#f97316', '#a855f7', '#22c55e'];
  const option = {
    tooltip: {
      trigger: 'item',
      className: 'echarts-tooltip',
    },
    legend: {
      bottom: '5%',
      left: 'center',
      icon: 'circle',
      itemGap: 20,
      textStyle: { color: '#64748b' }
    },
    series: [
      {
        name: 'Category',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 3,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            color: '#0f172a'
          },
          scale: true,
          scaleSize: 5
        },
        data: data.map((c, i) => ({
          value: c.total,
          name: c.category,
          itemStyle: { color: colors[i % colors.length] }
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '320px' }} />;
};
