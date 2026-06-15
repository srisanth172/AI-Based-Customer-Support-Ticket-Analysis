// src/components/Dashboard/ChartsSection.jsx
import React from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const ChartsSection = ({ tickets }) => {
  const sentimentData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      data: [
        tickets.filter(t => t.sentiment === 'positive').length,
        tickets.filter(t => t.sentiment === 'neutral').length,
        tickets.filter(t => t.sentiment === 'negative').length
      ],
      backgroundColor: ['#22C55E', '#6B7280', '#EF4444'],
      borderWidth: 0
    }]
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
      <div className="w-full max-w-xs mx-auto">
        <Doughnut data={sentimentData} options={{ responsive: true }} />
      </div>
    </div>
  );
};

export default ChartsSection;