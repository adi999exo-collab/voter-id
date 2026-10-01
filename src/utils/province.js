export async function getProvinceFromCoordinates(lat, lon) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`, {
      headers: {
        'User-Agent': 'VoterApp/1.0 (contact@voterapp.local)'
      }
    });
    const data = await response.json();

    if (data && data.address) {
      const state = (data.address.state || data.address.region || '').toLowerCase();

      if (state.includes('aceh')) return { name: 'Aceh', code: 'ACH' };
      if (state.includes('sumatera utara')) return { name: 'Sumatera Utara', code: 'SMU' };
      if (state.includes('sumatera barat')) return { name: 'Sumatera Barat', code: 'SMB' };
      if (state.includes('riau') && !state.includes('kepulauan')) return { name: 'Riau', code: 'RIA' };
      if (state.includes('jambi')) return { name: 'Jambi', code: 'JAM' };
      if (state.includes('sumatera selatan')) return { name: 'Sumatera Selatan', code: 'SMS' };
      if (state.includes('bengkulu')) return { name: 'Bengkulu', code: 'BKL' };
      if (state.includes('lampung')) return { name: 'Lampung', code: 'LMP' };
      if (state.includes('bangka belitung')) return { name: 'Bangka Belitung', code: 'BBL' };
      if (state.includes('kepulauan riau')) return { name: 'Kepulauan Riau', code: 'KPR' };
      if (state.includes('jakarta') || state.includes('dki')) return { name: 'DKI Jakarta', code: 'DKI' };
      if (state.includes('jawa barat')) return { name: 'Jawa Barat', code: 'JBR' };
      if (state.includes('jawa tengah')) return { name: 'Jawa Tengah', code: 'JTG' };
      if (state.includes('yogyakarta') || state.includes('jogja')) return { name: 'DI Yogyakarta', code: 'DIY' };
      if (state.includes('jawa timur')) return { name: 'Jawa Timur', code: 'JTM' };
      if (state.includes('banten')) return { name: 'Banten', code: 'BTN' };
      if (state.includes('bali')) return { name: 'Bali', code: 'BAL' };
      if (state.includes('nusa tenggara barat')) return { name: 'Nusa Tenggara Barat', code: 'NTB' };
      if (state.includes('nusa tenggara timur')) return { name: 'Nusa Tenggara Timur', code: 'NTT' };
      if (state.includes('kalimantan barat')) return { name: 'Kalimantan Barat', code: 'KLB' };
      if (state.includes('kalimantan tengah')) return { name: 'Kalimantan Tengah', code: 'KLT' };
      if (state.includes('kalimantan selatan')) return { name: 'Kalimantan Selatan', code: 'KLS' };
      if (state.includes('kalimantan timur')) return { name: 'Kalimantan Timur', code: 'KTM' };
      if (state.includes('kalimantan utara')) return { name: 'Kalimantan Utara', code: 'KLU' };
      if (state.includes('sulawesi utara')) return { name: 'Sulawesi Utara', code: 'SLU' };
      if (state.includes('sulawesi tengah')) return { name: 'Sulawesi Tengah', code: 'SLT' };
      if (state.includes('sulawesi selatan')) return { name: 'Sulawesi Selatan', code: 'SLS' };
      if (state.includes('sulawesi tenggara')) return { name: 'Sulawesi Tenggara', code: 'STG' };
      if (state.includes('gorontalo')) return { name: 'Gorontalo', code: 'GOR' };
      if (state.includes('sulawesi barat')) return { name: 'Sulawesi Barat', code: 'SLB' };
      if (state.includes('maluku utara')) return { name: 'Maluku Utara', code: 'MLU' };
      if (state.includes('maluku')) return { name: 'Maluku', code: 'MLK' };
      if (state.includes('papua barat daya')) return { name: 'Papua Barat Daya', code: 'PBD' };
      if (state.includes('papua barat')) return { name: 'Papua Barat', code: 'PRB' };
      if (state.includes('papua tengah')) return { name: 'Papua Tengah', code: 'PPT' };
      if (state.includes('papua pegunungan')) return { name: 'Papua Pegunungan', code: 'PPG' };
      if (state.includes('papua selatan')) return { name: 'Papua Selatan', code: 'PPS' };
      if (state.includes('papua')) return { name: 'Papua', code: 'PAP' };
    }
  } catch (error) {
    console.error('Failed to retrieve geolocation data:', error.message);
  }

  return { name: 'Indonesia', code: 'INDO' };
}
