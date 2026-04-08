/**
 * Calculates whether black or white text should be used on a given background color
 */
export const getContrastColor = (hexcolor: string) => {
  let color = hexcolor.replace('#', '');
  if (color.length === 3) {
    color = color.split('').map(char => char + char).join('');
  }
  
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
};
