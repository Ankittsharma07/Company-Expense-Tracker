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
      textStyle: { color: '#1f2937', fontSize: 13 },
      formatter: (params: any) => {
        const param = params[0];
        return `<div style="padding: 12px 16px; background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%); backdrop-filter: blur(12px); border-radius: 12px; box-shadow: 0 8px 32px rgba(102,126,234,0.15), 0 0 0 1px rgba(255,255,255,0.5); border: 1px solid rgba(168,85,247,0.2);">
          <div style="font-weight: 600; margin-bottom: 6px; color: #0f172a; font-size: 13px;">${param.name}</div>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; font-size: 16px;">$${param.value.toLocaleString()}</div>
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
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 4,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#667eea' },
              { offset: 0.5, color: '#764ba2' },
              { offset: 1, color: '#a855f7' }
            ]
          },
          shadowColor: 'rgba(102, 126, 234, 0.4)',
          shadowBlur: 12,
          shadowOffsetY: 4
        },
        itemStyle: {
          color: '#667eea',
          borderColor: '#fff',
          borderWidth: 3,
          shadowColor: 'rgba(102, 126, 234, 0.5)',
          shadowBlur: 10
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
              { offset: 0.5, color: 'rgba(118, 75, 162, 0.2)' },
              { offset: 1, color: 'rgba(168, 85, 247, 0.05)' }
            ]
          }
        },
        data: values,
        showSymbol: true,
        emphasis: {
          scale: true,
          scaleSize: 12,
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(102, 126, 234, 0.7)'
          }
        }
      },
    ],
  };

  return (
    <div style={{ position: 'relative', height: '320px' }}>
      <ReactECharts option={option} style={{ height: '100%' }} />
    </div>
  );
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

  const colors = [
    { color: ['#667eea', '#764ba2'], name: 'Purple' },
    { color: ['#4facfe', '#00f2fe'], name: 'Blue' },
    { color: ['#f093fb', '#f5576c'], name: 'Pink' },
    { color: ['#fa709a', '#fee140'], name: 'Orange' },
    { color: ['#a855f7', '#9333ea'], name: 'Violet' },
    { color: ['#3b82f6', '#2563eb'], name: 'Sky' }
  ];

  const option = {
    tooltip: {
      trigger: 'item',
      className: 'echarts-tooltip',
      confine: false, // Allow tooltip to overflow to header
      position: function(_point: any, _params: any, _dom: any, _rect: any, size: any) {
        // Position tooltip in the CardHeader area (above the chart)
        const chartWidth = size.viewSize[0];
        const tooltipWidth = size.contentSize[0];

        // Negative top value to move tooltip into CardHeader
        // CardHeader height is approximately 60px, CardContent padding is 24px
        return [
          chartWidth - tooltipWidth - 16, // 16px from right edge
          -84 // Move up into CardHeader (60px header + 24px padding)
        ];
      },
      formatter: (params: any) => {
        return `<div style="padding: 12px 16px; background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%); backdrop-filter: blur(12px); border-radius: 12px; box-shadow: 0 8px 32px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.5); border: 1px solid rgba(148,163,184,0.2); min-width: 200px;">
          <div style="font-weight: 600; margin-bottom: 6px; color: #0f172a; font-size: 13px;">${params.name}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${params.color};"></div>
            <div style="font-weight: 700; font-size: 16px; color: #0f172a;">$${params.value.toLocaleString()}</div>
            <div style="color: #64748b; font-size: 12px;">(${params.percent}%)</div>
          </div>
        </div>`;
      }
    },
    legend: {
      bottom: '5%',
      left: 'center',
      icon: 'circle',
      itemGap: 24,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: 500
      }
    },
    series: [
      {
        name: 'Category',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 4,
          shadowBlur: 12,
          shadowColor: 'rgba(0, 0, 0, 0.08)'
        },
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold',
            color: '#0f172a',
            textShadowBlur: 4,
            textShadowColor: 'rgba(0, 0, 0, 0.1)'
          },
          scale: true,
          scaleSize: 8,
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(0, 0, 0, 0.15)'
          }
        },
        data: data.map((c, i) => {
          const colorPair = colors[i % colors.length];
          return {
            value: c.total,
            name: c.category,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: colorPair.color[0] },
                  { offset: 1, color: colorPair.color[1] }
                ]
              }
            }
          };
        }),
      },
    ],
  };

  return <ReactECharts key={Date.now()} option={option} style={{ height: '320px' }} notMerge={true} lazyUpdate={false} />;
};
