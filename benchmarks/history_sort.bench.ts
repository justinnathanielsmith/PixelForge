
import { bench, describe } from 'vitest';

// Simulate GeneratedArt interface
interface GeneratedArt {
  id: string;
  timestamp: number;
  // ... other fields irrelevant for sorting
}

// Generate test data
const count = 10000;
const data: GeneratedArt[] = Array.from({ length: count }, (_, i) => ({
  id: `id-${i}`,
  timestamp: Math.random() * 1000000000,
}));

// Pre-sorted data (simulating DB index return in ascending order)
const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

describe('History Retrieval Performance', () => {
  // Baseline: Get all data (unsorted from DB perspective, though here it's random) and sort in memory
  bench('Memory Sort (Baseline)', () => {
    const items = [...data];
    items.sort((a, b) => b.timestamp - a.timestamp);
  });

  // Optimized: Get sorted data from DB (simulated) and reverse it
  bench('Index Retrieval + Reverse (Optimized)', () => {
    // We assume the DB returns 'sortedData' (ascending)
    // In a real DB, retrieving from index is efficient.
    // Here we simulate the post-retrieval processing: reversing to get descending.
    const items = [...sortedData];
    items.reverse();
  });
});
