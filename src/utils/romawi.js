// Konversi bulan (1-12) ke angka Romawi
const bulanRomawi = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI',
  'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
];

const keRomawi = (bulan) => {
  const b = parseInt(bulan, 10);
  if (isNaN(b) || b < 1 || b > 12) return '';
  return bulanRomawi[b];
};

module.exports = { keRomawi };