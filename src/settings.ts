function getResponsiveBlockSize(): number {
  if (typeof window === 'undefined') {
    return 100;
  }
  
  const width = window.innerWidth;
  
  if (width < 480) return 60;
  if (width < 768) return 80;
  if (width < 1024) return 90;
  return 100;
}

export default {
  size: 4,
  get blockSize() {
    return getResponsiveBlockSize();
  },
  canvasBackground: "#303030",
} as const;
