export function initClock(clockElementId) {
  let is12HourFormat = false;

  function updateClock() {
    const now = new Date();
    const namaBulan = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const tanggal = String(now.getDate()).padStart(2, '0');
    const bulan = namaBulan[now.getMonth()];
    const tahun = now.getFullYear();

    let rawHours = now.getHours();
    let ampm = '';
    if (is12HourFormat) {
      ampm = rawHours >= 12 ? ' PM' : ' AM';
      rawHours = rawHours % 12 || 12;
    }

    const jam = String(rawHours).padStart(2, '0');
    const menit = String(now.getMinutes()).padStart(2, '0');
    const detik = String(now.getSeconds()).padStart(2, '0');

    const offsetMinutes = -now.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const gmtHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const gmtMins = String(absOffset % 60).padStart(2, '0');
    const gmtString = `GMT${sign}${gmtHours}.${gmtMins}`;

    let tzName = '';
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'long' }).formatToParts(now);
      const tzPart = parts.find(p => p.type === 'timeZoneName');
      if (tzPart) tzName = tzPart.value;
    } catch (e) {
      tzName = '';
    }

    const timeString = `<span id="time-toggle">Time ${jam} : ${menit}<span class="time-unit">m</span> : ${detik}<span class="time-unit">d</span>${ampm}</span>`;

    const formatWaktu = `
      <div class="clock-line">
        <span class="clock-part">Today, ${tanggal} ${bulan} ${tahun}</span>
        <span class="clock-part">| ${timeString}</span>
        <span class="clock-part">${gmtString}</span>
      </div>
      ${tzName ? `<div style="font-size: 0.8em; margin-top: 2px; white-space: nowrap;">${tzName}</div>` : ''}
    `;

    const clockEl = document.getElementById(clockElementId);
    if (clockEl) clockEl.innerHTML = formatWaktu;
  }

  document.addEventListener('click', function(e) {
    if (e.target && e.target.closest('#time-toggle')) {
      is12HourFormat = !is12HourFormat;
      updateClock();
    }
  });

  setInterval(updateClock, 1000);
  updateClock();
}
