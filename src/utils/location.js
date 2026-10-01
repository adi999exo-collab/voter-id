export function initLocationToggle(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let isFullName = false;
  
  const provinceMap = {
    'ACH': 'Aceh',
    'SMU': 'Sumatera Utara',
    'SMB': 'Sumatera Barat',
    'RIA': 'Riau',
    'JAM': 'Jambi',
    'SMS': 'Sumatera Selatan',
    'BKL': 'Bengkulu',
    'LMP': 'Lampung',
    'BBL': 'Bangka Belitung',
    'KPR': 'Kepulauan Riau',
    'DKI': 'DKI Jakarta',
    'JBR': 'Jawa Barat',
    'JTG': 'Jawa Tengah',
    'DIY': 'Daerah Istimewa Yogyakarta',
    'JTM': 'Jawa Timur',
    'BTN': 'Banten',
    'BAL': 'Bali',
    'NTB': 'Nusa Tenggara Barat',
    'NTT': 'Nusa Tenggara Timur',
    'KLB': 'Kalimantan Barat',
    'KLT': 'Kalimantan Tengah',
    'KLS': 'Kalimantan Selatan',
    'KTM': 'Kalimantan Timur',
    'KLU': 'Kalimantan Utara',
    'SLU': 'Sulawesi Utara',
    'SLT': 'Sulawesi Tengah',
    'SLS': 'Sulawesi Selatan',
    'STG': 'Sulawesi Tenggara',
    'GOR': 'Gorontalo',
    'SLB': 'Sulawesi Barat',
    'MLU': 'Maluku Utara',
    'MLK': 'Maluku',
    'PBD': 'Papua Barat Daya',
    'PRB': 'Papua Barat',
    'PPT': 'Papua Tengah',
    'PPG': 'Papua Pegunungan',
    'PPS': 'Papua Selatan',
    'PAP': 'Papua',
    'INDO': 'Indonesia'
  };

  el.style.cursor = 'pointer';
  el.title = 'Click to toggle abbreviation/full name format';

  const formatSpacing = (text) => {
    const parts = text.split(/\s*-\s*/);
    return parts.join(' - ');
  };

  const observer = new MutationObserver(() => {
    const currentText = el.innerText.trim();
    if (currentText && !currentText.includes('Connecting') && !currentText.includes('Requesting')) {
      const formatted = formatSpacing(currentText);
      if (currentText !== formatted) {
        el.innerText = formatted;
      }
    }
  });

  observer.observe(el, { childList: true, characterData: true, subtree: true });

  el.addEventListener('click', () => {
    const currentText = el.innerText.trim();
    const parts = currentText.split(/\s*-\s*/);
    const currentCode = parts[0].trim();

    if (!isFullName) {
      if (provinceMap[currentCode]) {
        parts[0] = provinceMap[currentCode];
        el.innerText = parts.join(' - ');
        isFullName = true;
      }
    } else {
      const fullName = parts[0].trim();
      let foundKey = Object.keys(provinceMap).find(key => provinceMap[key].toLowerCase() === fullName.toLowerCase());
      
      if (foundKey) {
        parts[0] = foundKey;
        el.innerText = parts.join(' - ');
        isFullName = false;
      }
    }
  });
}
