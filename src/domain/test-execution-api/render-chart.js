import {init} from 'echarts';
import { createCanvas } from 'canvas';

const renderChart = () => {
  const canvas = createCanvas(800, 600);

  const chart = init(canvas);

  // setOption as normal
  chart.setOption({
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    },
    yAxis: {
      type: "value"
    },
    series: [
      {
        data: [120, 200, 150, 80, 70, 110, 130],
        type: "bar"
      }
    ]
  });

  return canvas; 
};

export default renderChart;