import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import type { ChartConfiguration } from 'chart.js';

interface MiniChartProps {
  config: ChartConfiguration;
  height?: number;
}

export default function MiniChart({ config, height = 120 }: MiniChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Destroy any existing chart on this canvas before creating a new one
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config)]);

  return (
    <div style={{ height: `${height}px`, position: 'relative', width: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
