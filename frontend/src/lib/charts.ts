import type { ChartConfiguration } from 'chart.js';

const CHART_COLORS = [
  '#6366f1', // indigo
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f97316', // orange
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export function barChartConfig(
  labels: string[],
  data: number[],
  label: string,
  color = CHART_COLORS[0]
): ChartConfiguration {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          backgroundColor: color + 'cc',
          borderColor: color,
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#94a3b8' },
        },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: { font: { size: 10 }, color: '#94a3b8' },
          beginAtZero: true,
        },
      },
    },
  };
}

export function lineChartConfig(
  labels: string[],
  datasets: { label: string; data: number[]; color: string }[]
): ChartConfiguration {
  return {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: ds.color + '20',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 10 } },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#94a3b8' },
        },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: { font: { size: 10 }, color: '#94a3b8' },
          beginAtZero: true,
        },
      },
    },
  };
}

export function doughnutChartConfig(
  labels: string[],
  data: number[],
  colors?: string[]
): ChartConfiguration<'doughnut'> {
  const palette = colors ?? CHART_COLORS.slice(0, labels.length);
  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: palette.map((c) => c + 'cc'),
          borderColor: palette,
          borderWidth: 1,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 8 } },
        tooltip: { enabled: true },
      },
      cutout: '65%',
    },
  };
}
