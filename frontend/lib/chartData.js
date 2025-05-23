function randomRGBA(alpha = 0.7) {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function processPieData(transfers) {
  if (!Array.isArray(transfers) || transfers.length === 0) {
    return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
  }

  const labels = transfers.map((t) => t.token);
  const data = transfers.map((t) => t.amount);

  // Generate one random color per label
  const backgroundColor = labels.map(() => randomRGBA(0.7));

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderColor: '#ffffff',
        borderWidth: 1,
      },
    ],
  };
}