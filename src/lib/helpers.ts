export const guessColorHex = (colorName: string, existingHex?: string): string => {
  if (existingHex && existingHex !== '#000000' && existingHex !== '#ccc' && existingHex !== '#cccccc') {
    return existingHex;
  }
  
  if (!colorName) return '#cccccc';
  
  const name = colorName.toLowerCase();
  
  // Specific multi-colors or special names
  if (name.includes('ocean')) return '#0d9488'; // Teal for Oceans Embrace
  if (name.includes('tri color') || name.includes('tricolor')) return '#8b5cf6'; // Purple-ish as a fallback for multi-color
  if (name.includes('rainbow') || name.includes('tęcza') || name.includes('tęczow')) return '#ec4899'; // Pinkish
  if (name.includes('kość') || name.includes('bone')) return '#fef3c7'; // Warm off-white/cream
  if (name.includes('silk') && !name.includes('czarn') && !name.includes('biał')) return '#fbbf24'; // Gold/Yellowish default for silk if no other color matches
  
  // Standard colors
  if (name.includes('czarn') || name.includes('black')) return '#222222';
  if (name.includes('biał') || name.includes('white')) return '#f8f9fa';
  if (name.includes('czerwon') || name.includes('red')) return '#ef4444';
  if (name.includes('niebiesk') || name.includes('blue')) return '#3b82f6';
  if (name.includes('zielon') || name.includes('green')) return '#22c55e';
  if (name.includes('żółt') || name.includes('yellow')) return '#eab308';
  if (name.includes('pomarańcz') || name.includes('orange')) return '#f97316';
  if (name.includes('szar') || name.includes('grey') || name.includes('gray') || name.includes('silver') || name.includes('srebrn')) return '#9ca3af';
  if (name.includes('fiolet') || name.includes('purple')) return '#a855f7';
  if (name.includes('różow') || name.includes('pink')) return '#ec4899';
  if (name.includes('złot') || name.includes('gold')) return '#ca8a04';
  if (name.includes('brąz') || name.includes('brown') || name.includes('oak') || name.includes('dąb') || name.includes('wood') || name.includes('drewn')) return '#8b5a2b';
  if (name.includes('przezroczyst') || name.includes('clear') || name.includes('transparent')) return '#e0f2fe';
  
  return existingHex || '#cccccc';
};

export const getColorStyle = (colorHex?: string, isMultiColor?: boolean, colorHexes?: string[]) => {
  if (isMultiColor && colorHexes && colorHexes.length > 1) {
    return { background: `linear-gradient(135deg, ${colorHexes.join(', ')})` };
  }
  return { backgroundColor: colorHex || (colorHexes && colorHexes[0]) || '#cccccc' };
};

export const getBrandLogo = (brandName: string, existingLogo?: string): string | null => {
  if (existingLogo && existingLogo.trim() !== '') return existingLogo;
  
  const name = brandName.toLowerCase();
  
  const createSvg = (text: string, color: string, fontStyle = 'normal', fontWeight = '900') => 
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="35" font-weight="${fontWeight}" font-style="${fontStyle}" fill="%23${color}">${text}</text></svg>`;

  if (name.includes('jayo')) return createSvg('JAYO', 'E60012');
  if (name.includes('esun')) return createSvg('eSUN', '0055A4', 'italic');
  if (name.includes('professional lab') || name.includes('imagine')) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><text x="50%" y="30" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="%23000000">PROFESSIONAL</text><text x="50%" y="65" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="45" font-weight="900" fill="none" stroke="%23000000" stroke-width="2">LAB</text></svg>';
  }
  if (name.includes('smart print')) return createSvg('Smart Print', '222222', 'normal', 'bold');
  if (name.includes('fiberlogy')) return createSvg('Fiberlogy', '000000');
  if (name.includes('rosa3d')) return createSvg('Rosa3D', 'E3000F');
  if (name.includes('devil design')) return createSvg('Devil Design', 'E3000F');
  if (name.includes('spectrum')) return createSvg('Spectrum', '000000');
  if (name.includes('bambu lab')) return createSvg('Bambu Lab', '00A651');
  if (name.includes('prusament') || name.includes('prusa')) return createSvg('Prusament', 'FA6831');
  if (name.includes('polymaker')) return createSvg('Polymaker', '00AEEF');
  if (name.includes('sunlu')) return createSvg('SUNLU', '000000');
  if (name.includes('anycubic')) return createSvg('ANYCUBIC', '0055A4');
  if (name.includes('creality')) return createSvg('Creality', '00B050');
  
  return null;
};
