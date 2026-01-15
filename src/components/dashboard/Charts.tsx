import React from 'react';
import ReactECharts from 'echarts-for-react';
import { CHART_DATA } from '../../data/mockData';

export const SpendTrendChart = () => {
  const option = {
    tooltip: {
      trigger: 'axis',
      className: 'echarts-tooltip',
      padding: 0,
      borderWidth: 0,
      textStyle: { color: '#1f2937', fontSize: 12 },
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '5%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: CHART_DATA.monthly.map(d => d.name),
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
        formatter: (value: number) => `$${value/1000}k`
      },
    },
    series: [
      {
        name: 'Spend',
        type: 'line',
        smooth: 0.35,
        symbol: 'none', // clean look
        lineStyle: { width: 3, color: '#0ea5a4' },
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
        data: CHART_DATA.monthly.map(d => d.value),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '320px' }} />;
};

export const CategoryPieChart = () => {
  const option = {
    tooltip: {
      trigger: 'item',
      className: 'echarts-tooltip',
    },
    legend: {
      bottom: '0%',
      left: 'center',
      icon: 'circle',
      itemGap: 20,
      textStyle: { color: '#64748b' }
    },
    series: [
      {
        name: 'Category',
        type: 'pie',
        radius: ['50%', '80%'],
        center: ['50%', '45%'],
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
        data: CHART_DATA.categories.map((c, i) => ({
          value: c.value,
          name: c.name,
          itemStyle: { color: ['#0ea5a4', '#38bdf8', '#f59e0b', '#f97316'][i] }
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '320px' }} />;
};
