let globalData = [];
let currentSort = 'most';
let countdownInterval = null;
let isAutoRefreshActive = false;
let timeLeft = 3;
let currentLang = 'id';

const translations = {
    en: {
        title: "Device ID Blocking Log",
        mainTitle: "Blocking History Log",
        btnMost: "Most Actions",
        btnLatest: "Latest Actions",
        autoOff: "Auto Refresh: OFF",
        autoOn: "Auto Refresh: ON",
        updating: "Updating data...",
        w1: "Important Note:",
        w2: "If you enable",
        w3: "auto refresh",
        w5: "(polling new data periodically),",
        w6: "you",
        w7: "cannot",
        w8: "",
        w9: "view/open action details stably",
        w10: "because",
        w11: "the table will reset the row display (closing back",
        w12: "the detail",
        w13: "section)",
        w14: "every time new data is loaded from the server.",
        thTotal: "Total Actions",
        thActorId: "Actor ID",
        thActorIp: "Actor IP",
        thLatest: "Latest Action (Click for details)",
        loading: "Loading log data...",
        noData: "No log history available",
        failedLoad: "Failed to load log data",
        allHistory: "All Action History:",
        actionsSuffix: "Actions",
        target: "Target"
    },
    id: {
        title: "Log Pemblokiran Device ID",
        mainTitle: "Log Riwayat Pemblokiran",
        btnMost: "Paling Banyak Aksi",
        btnLatest: "Aksi Paling Baru",
        autoOff: "Refresh Otomatis: OFF",
        autoOn: "Refresh Otomatis: ON",
        updating: "Memperbarui data...",
        w1: "Catatan Penting:",
        w2: "Jika Anda mengaktifkan",
        w3: "refresh otomatis",
        w5: "(polling data baru secara berkala),",
        w6: "Anda",
        w7: "tidak bisa",
        w8: "",
        w9: "melihat/membuka detail aksi secara stabil",
        w10: "karena",
        w11: "tabel akan mereset ulang tampilan baris (menutup kembali",
        w12: "bagian",
        w13: "detail)",
        w14: "setiap kali data baru dimuat dari server.",
        thTotal: "Total Aksi",
        thActorId: "Actor ID",
        thActorIp: "Actor IP",
        thLatest: "Aksi Terakhir (Klik untuk detail)",
        loading: "Memuat data log...",
        noData: "Belum ada riwayat log",
        failedLoad: "Gagal memuat data log",
        allHistory: "Semua Riwayat Aksi:",
        actionsSuffix: "Aksi",
        target: "Target"
    }
};

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'id' : 'en';
    updateTexts();
    renderTable();
}

function updateTexts() {
    const t = translations[currentLang];
    document.getElementById('pageTitle').innerText = t.title;
    document.getElementById('mainTitle').innerText = t.mainTitle;
    document.getElementById('btnMost').innerText = t.btnMost;
    document.getElementById('btnLatest').innerText = t.btnLatest;
    
    const btn = document.getElementById('btnAutoRefresh');
    if (!isAutoRefreshActive) {
        btn.innerText = t.autoOff;
    } else {
        btn.innerText = t.updating && btn.innerText === translations[currentLang === 'id' ? 'en' : 'id'].updating ? t.updating : t.autoOn;
    }

    document.getElementById('w1').innerText = t.w1;
    document.getElementById('w2').innerText = t.w2;
    document.getElementById('w3').innerText = t.w3;
    document.getElementById('w5').innerText = t.w5;
    document.getElementById('w6').innerText = t.w6;
    document.getElementById('w7').innerText = t.w7;
    document.getElementById('w9').innerText = t.w9;
    document.getElementById('w10').innerText = t.w10;
    document.getElementById('w11').innerText = t.w11;
    document.getElementById('w12').innerText = t.w12;
    document.getElementById('w13').innerText = t.w13;
    document.getElementById('w14').innerText = t.w14;

    document.getElementById('thTotal').innerText = t.thTotal;
    document.getElementById('thActorId').innerText = t.thActorId;
    document.getElementById('thActorIp').innerText = t.thActorIp;
    document.getElementById('thLatest').innerText = t.thLatest;
    
    const loadingEl = document.getElementById('loadingText');
    if (loadingEl) {
        loadingEl.innerText = globalData.length === 0 ? t.loading : t.noData;
    }
}

function setSortMode(mode) {
    currentSort = mode;
    document.getElementById('btnMost').className = mode === 'most' ? 'filter-btn active' : 'filter-btn';
    document.getElementById('btnLatest').className = mode === 'latest' ? 'filter-btn active' : 'filter-btn';
    renderTable();
}

function toggleAutoRefresh() {
    isAutoRefreshActive = !isAutoRefreshActive;
    const btn = document.getElementById('btnAutoRefresh');
    const warningBox = document.getElementById('warningBox');
    const t = translations[currentLang];
    
    if (isAutoRefreshActive) {
        btn.className = 'auto-refresh-btn active';
        warningBox.style.display = 'block';
        btn.innerText = t.autoOn;
        timeLeft = 3;

        countdownInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                btn.innerText = translations[currentLang].updating;
                fetchLogs(true);
                setTimeout(() => {
                    if (isAutoRefreshActive) {
                        timeLeft = 3;
                        btn.innerText = translations[currentLang].autoOn;
                    }
                }, 800);
            }
        }, 1000);

    } else {
        btn.className = 'auto-refresh-btn';
        btn.innerText = t.autoOff;
        warningBox.style.display = 'none';
        clearInterval(countdownInterval);
        countdownInterval = null;
        timeLeft = 3;
    }
}

function getStatusClass(status) {
    if (status.includes('Success Blocked')) return 'status-blocked';
    if (status.includes('Already Blocked')) return 'status-warning';
    if (status.includes('Success Unblocked')) return 'status-unblocked';
    if (status.includes('Failed') || status.includes('Not In List')) return 'status-default';
    return 'status-default';
}

function fetchLogs(isBackground = false) {
    fetch('/api/logs')
        .then(res => res.json())
        .then(data => {
            globalData = data;
            renderTable();
        })
        .catch(err => {
            if (!isBackground) {
                const t = translations[currentLang];
                document.getElementById('logTableBody').innerHTML = `<tr><td colspan="4" style="text-align: center;" id="loadingText">${t.failedLoad}</td></tr>`;
            }
        });
}

function renderTable() {
    const tbody = document.getElementById('logTableBody');
    const t = translations[currentLang];
    if (globalData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;" id="loadingText">${t.noData}</td></tr>`;
        return;
    }

    let sortedData = [...globalData];

    if (currentSort === 'most') {
        sortedData.sort((a, b) => b.actions.length - a.actions.length);
    } else if (currentSort === 'latest') {
        sortedData.sort((a, b) => new Date(b.actions[0].time) - new Date(a.actions[0].time));
    }

    tbody.innerHTML = '';
    sortedData.forEach((group) => {
        const latestAction = group.actions[0];
        const statusClass = getStatusClass(latestAction.status);

        const mainTr = document.createElement('tr');
        mainTr.className = 'clickable-row';
        mainTr.innerHTML = `
            <td>${group.actions.length} ${t.actionsSuffix}</td>
            <td>${group.actorId}</td>
            <td>${group.actorIp}</td>
            <td>
                <div class="log-item" style="margin-bottom:0;">
                    <span class="time-badge">${latestAction.time}</span>
                    <span class="target-badge">${t.target}: ${latestAction.targetId}</span>
                    <span class="${statusClass}">${latestAction.status}</span>
                </div>
            </td>
        `;

        const detailTr = document.createElement('tr');
        detailTr.className = 'detail-row';
        
        let targetsHtml = '<div style="display: flex; flex-direction: column; gap: 6px; white-space: normal;">';
        group.actions.forEach(act => {
            const actStatusClass = getStatusClass(act.status);
            targetsHtml += `
                <div class="log-item">
                    <span class="time-badge">${act.time}</span>
                    <span class="target-badge">${t.target}: ${act.targetId}</span>
                    <span class="${actStatusClass}">${act.status}</span>
                </div>
            `;
        });
        targetsHtml += '</div>';

        detailTr.innerHTML = `
            <td colspan="4" style="background-color: #f8fbff;">
                <div style="padding-bottom: 6px; font-weight: 500;">${t.allHistory}</div>
                ${targetsHtml}
            </td>
        `;

        mainTr.addEventListener('click', () => {
            const isVisible = detailTr.style.display === 'table-row';
            detailTr.style.display = isVisible ? 'none' : 'table-row';
        });

        tbody.appendChild(mainTr);
        tbody.appendChild(detailTr);
    });
}

updateTexts();
fetchLogs();
