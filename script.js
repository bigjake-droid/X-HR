// --- 1. STATE MANAGEMENT (X-HR ISOLATED STORAGE) ---
let state = {
    incidents: [], 
    radar: { protectedActs: [], adverseActions: [] },
    evidence: [],
    boundaries: [] // The new offensive module
};

const STORAGE_KEY = 'xhrDefenseState';

// --- 2. INITIALIZATION & WIRING ---
window.onload = () => {
    loadData();
    injectUIComponents();
    wireButtons();
    updateUI();
};

function injectUIComponents() {
    const header = document.querySelector('.header-dark');
    if(header) {
        const exportBtn = document.createElement('button');
        exportBtn.innerHTML = "⬇ EXPORT DEFENSE DOSSIER";
        exportBtn.style.cssText = "margin-top: 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--emerald); color: var(--emerald); padding: 8px 15px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; border-radius: 4px; transition: all 0.2s; font-size: 0.8rem; letter-spacing: 1px;";
        exportBtn.onmouseover = () => { exportBtn.style.background = "var(--emerald)"; exportBtn.style.color = "#fff"; };
        exportBtn.onmouseout = () => { exportBtn.style.background = "rgba(16, 185, 129, 0.1)"; exportBtn.style.color = "var(--emerald)"; };
        exportBtn.onclick = generateHRDossier;
        header.appendChild(exportBtn);
    }

    // Inject display areas for the first 4 modules
    const cards = document.querySelectorAll('.card');
    if(cards.length >= 5) {
        cards.forEach((card, index) => {
            if(index < 4) { 
                const displayArea = document.createElement('div');
                displayArea.id = `displayArea-${index}`;
                displayArea.style.cssText = "margin-top: 20px; border-top: 1px solid rgba(16, 185, 129, 0.3); padding-top: 20px;";
                card.appendChild(displayArea);
            }
        });
    }
}

function wireButtons() {
    const buttons = document.querySelectorAll('.btn-charcoal');
    if(buttons.length >= 5) {
        buttons[0].addEventListener('click', openJournalModal);
        buttons[1].addEventListener('click', openRadarModal);
        buttons[2].addEventListener('click', openVaultModal);
        buttons[3].addEventListener('click', openBoundaryModal); // Module 4
        buttons[4].addEventListener('click', openDocumentEngine); // Module 5
    }
}

// --- 3. CORE LOGIC ---
function logIncident(date, aggressor, desc, witnesses) {
    state.incidents.unshift({ date, aggressor, desc, witnesses: witnesses || "None", loggedAt: new Date().toLocaleString() });
    saveData(); updateUI();
}

function logRadarEvent(type, date, desc) {
    const event = { date, desc, loggedAt: new Date().toLocaleDateString() };
    if(type === 'protected') {
        state.radar.protectedActs.push(event);
        state.radar.protectedActs.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
        state.radar.adverseActions.push(event);
        state.radar.adverseActions.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    saveData(); updateUI();
}

function logEvidence(filename, desc) {
    const exhibitLetter = String.fromCharCode(65 + state.evidence.length); 
    state.evidence.push({ id: `Exhibit ${exhibitLetter}`, filename, desc, date: new Date().toLocaleDateString() });
    saveData(); updateUI();
}

function logBoundary(date, aggressor, boundary, breach) {
    state.boundaries.unshift({ date, aggressor, boundary, breach: breach || "None recorded yet.", loggedAt: new Date().toLocaleString() });
    saveData(); updateUI();
}

// --- 4. DATA PERSISTENCE & UI UPDATES ---
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved) {
        state = JSON.parse(saved);
        if(!state.radar) state.radar = { protectedActs: [], adverseActions: [] };
        if(!state.boundaries) state.boundaries = [];
    }
}

function updateUI() {
    // 0: Journal
    const journalArea = document.getElementById('displayArea-0');
    if(journalArea) {
        if(state.incidents.length === 0) {
            journalArea.innerHTML = `<p style="font-size:0.85rem; color:#6b7280;">No incidents logged.</p>`;
        } else {
            journalArea.innerHTML = state.incidents.slice(0,2).map(inc => `
                <div style="margin-bottom: 10px; padding: 12px; background: rgba(0,0,0,0.3); border-left: 3px solid #10b981; border-radius: 4px;">
                    <strong style="font-size:0.9rem; color: #fff;">${inc.date} | ${inc.aggressor}</strong>
                    <p style="font-size:0.85rem; margin: 5px 0 0 0; color: #9ca3af;">${inc.desc}</p>
                </div>
            `).join('') + (state.incidents.length > 2 ? `<p style="font-size:0.8rem; text-align:center; color: #10b981;">+${state.incidents.length - 2} more securely logged.</p>` : '');
        }
    }

    // 1: Radar
    const radarArea = document.getElementById('displayArea-1');
    if(radarArea) {
        let radarHTML = '';
        if(state.radar.protectedActs.length > 0 && state.radar.adverseActions.length > 0) {
            const firstProtected = new Date(state.radar.protectedActs[0].date);
            const firstAdverse = new Date(state.radar.adverseActions[0].date);
            const diffDays = Math.ceil((firstAdverse - firstProtected) / (1000 * 60 * 60 * 24));
            
            if(diffDays >= 0) {
                radarHTML += `
                <div style="background: rgba(220, 38, 38, 0.1); border: 1px solid #DC2626; padding: 12px; margin-bottom: 15px; border-radius: 6px;">
                    <strong style="color: #ef4444; font-size:0.9rem;">⚠️ CAUSAL GAP DETECTED: ${diffDays} DAYS</strong>
                    <p style="font-size:0.8rem; color: #fca5a5; margin-top:4px;">High probability of retaliation.</p>
                </div>`;
            }
        }
        radarHTML += `<div style="display:flex; gap:10px; font-size: 0.85rem; color: #e5e7eb;">`;
        radarHTML += `<div style="flex:1;"><strong>Protected:</strong> ${state.radar.protectedActs.length}</div>`;
        radarHTML += `<div style="flex:1;"><strong>Adverse:</strong> ${state.radar.adverseActions.length}</div>`;
        radarHTML += `</div>`;
        radarArea.innerHTML = radarHTML;
    }

    // 2: Vault
    const vaultArea = document.getElementById('displayArea-2');
    if(vaultArea) {
        if(state.evidence.length === 0) {
            vaultArea.innerHTML = `<p style="font-size:0.85rem; color:#6b7280;">No exhibits secured.</p>`;
        } else {
            vaultArea.innerHTML = state.evidence.slice(0,3).map(ex => `
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding: 8px 0; border-bottom: 1px dashed #374151;">
                    <span style="color:#e5e7eb;"><strong style="color: #10b981;">${ex.id}:</strong> ${ex.desc}</span>
                    <span style="color:#6b7280; font-size: 0.75rem;">${ex.date}</span>
                </div>
            `).join('');
        }
    }

    // 3: Boundaries
    const boundArea = document.getElementById('displayArea-3');
    if(boundArea) {
        if(state.boundaries.length === 0) {
            boundArea.innerHTML = `<p style="font-size:0.85rem; color:#6b7280;">No boundaries established yet.</p>`;
        } else {
            boundArea.innerHTML = state.boundaries.slice(0,2).map(b => `
                <div style="margin-bottom: 10px; padding: 12px; background: rgba(0,0,0,0.3); border-left: 3px solid #f59e0b; border-radius: 4px;">
                    <strong style="font-size:0.9rem; color: #fff;">${b.date} | Target: ${b.aggressor}</strong>
                    <p style="font-size:0.8rem; margin: 5px 0; color: #9ca3af;"><strong>Boundary:</strong> ${b.boundary}</p>
                    <p style="font-size:0.8rem; margin: 0; color: #ef4444;"><strong>Breach:</strong> ${b.breach}</p>
                </div>
            `).join('');
        }
    }
}

// --- 5. TACTICAL MODALS ---
function createModalOverlay(title, innerHTML, onSave, hideSave = false) {
    const existing = document.getElementById('xhrModal');
    if(existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'xhrModal';
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(8, 12, 17, 0.9); display:flex; justify-content:center; align-items:center; z-index:10000; padding:20px; backdrop-filter: blur(8px);";
    
    let buttonsHTML = `<button onclick="document.getElementById('xhrModal').remove()" style="flex:1; padding:12px; background:transparent; border:1px solid #4b5563; color:#d1d5db; font-weight:700; border-radius:6px; cursor:pointer; font-family:'Inter', sans-serif;">${hideSave ? 'CLOSE' : 'CANCEL'}</button>`;
    if(!hideSave) {
        buttonsHTML += `<button id="modalSaveBtn" style="flex:1; padding:12px; background:#10b981; border:none; color:#fff; font-weight:700; border-radius:6px; cursor:pointer; font-family:'Inter', sans-serif; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">SAVE TO MATRIX</button>`;
    }

    overlay.innerHTML = `
        <div style="background:#151e27; border: 1px solid #10b981; border-radius:12px; padding:30px; width:100%; max-width:600px; box-shadow: 0 0 30px rgba(16,185,129,0.2); max-height: 90vh; overflow-y: auto; color: #f9fafb;">
            <h3 style="font-family:'Rajdhani', sans-serif; font-size:1.6rem; font-weight: 700; border-bottom:1px solid #374151; padding-bottom:12px; margin-bottom:20px; color:#fff;">${title}</h3>
            ${innerHTML}
            <div style="display:flex; gap:15px; margin-top:25px;">
                ${buttonsHTML}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    if(!hideSave) document.getElementById('modalSaveBtn').addEventListener('click', onSave);
}

function openBoundaryModal() {
    const html = `
        <p style="font-size:0.85rem; color:#9ca3af; margin-bottom:20px;">Use this to formally document when you told an aggressor to stop a specific behavior, and log if they crossed that line again.</p>
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px; color:#9ca3af; letter-spacing: 1px;">DATE BOUNDARY WAS SET</label>
        <input type="date" id="bDate" style="width:100%; padding:12px; margin-bottom:15px;">
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px; color:#9ca3af; letter-spacing: 1px;">AGGRESSOR NAME</label>
        <input type="text" id="bName" style="width:100%; padding:12px; margin-bottom:15px;" placeholder="Who was notified?">
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px; color:#9ca3af; letter-spacing: 1px;">WHAT WAS THE BOUNDARY?</label>
        <textarea id="bBound" style="width:100%; padding:12px; margin-bottom:15px; min-height:70px;" placeholder="e.g., 'I told John to stop commenting on my physical appearance.'"></textarea>
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px; color:#9ca3af; letter-spacing: 1px;">ANY TRANSGRESSIONS? (OPTIONAL)</label>
        <textarea id="bBreach" style="width:100%; padding:12px; margin-bottom:15px; min-height:70px;" placeholder="e.g., 'On Tuesday, he did it again.'"></textarea>
    `;
    createModalOverlay("PERIMETER DEFENSE LOG", html, () => {
        const date = document.getElementById('bDate').value;
        const name = document.getElementById('bName').value;
        const bound = document.getElementById('bBound').value;
        const breach = document.getElementById('bBreach').value;
        if(!date || !bound) { alert("Date and Boundary description are required."); return; }
        logBoundary(date, name, bound, breach);
        document.getElementById('xhrModal').remove();
    });
}

function openJournalModal() {
    const html = `
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px; color:#9ca3af; letter-spacing: 1px;">DATE OF INCIDENT</label>
        <input type="date" id="jDate" style="width:100%; padding:12px; margin-bottom:15px;">
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px; color:#9ca3af; letter-spacing: 1px;">AGGRESSOR / MANAGER NAME</label>
        <input type="text" id="jName" style="width:100%; padding:12px; margin-bottom:15px;" placeholder="Who committed the action?">
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px; color:#9ca3af; letter-spacing: 1px;">DESCRIPTION OF EVENT / THREAT</label>
        <textarea id="jDesc" style="width:100%; padding:12px; margin-bottom:15px; min-height:100px;" placeholder="Exact quotes if possible..."></textarea>
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px; color:#9ca3af; letter-spacing: 1px;">WITNESSES (IF ANY)</label>
        <input type="text" id="jWit" style="width:100%; padding:12px; margin-bottom:15px;" placeholder="Names of others present">
    `;
    createModalOverlay("LOG CONTEMPORANEOUS INCIDENT", html, () => {
        const date = document.getElementById('jDate').value;
        const name = document.getElementById('jName').value;
        const desc = document.getElementById('jDesc').value;
        const wit = document.getElementById('jWit').value;
        if(!date || !desc) { alert("Date and Description are required."); return; }
        logIncident(date, name, desc, wit);
        document.getElementById('xhrModal').remove();
    });
}

function openRadarModal() {
    const html = `
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px; color:#9ca3af; letter-spacing: 1px;">TYPE OF EVENT</label>
        <select id="rType" style="width:100%; padding:12px; margin-bottom:15px;">
            <option value="protected">Protected Activity (e.g., Reported HR, Requested FMLA)</option>
            <option value="adverse">Adverse Action (e.g., Demotion, Written Warning, Fired)</option>
        </select>
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px; color:#9ca3af; letter-spacing: 1px;">DATE OF EVENT</label>
        <input type="date" id="rDate" style="width:100%; padding:12px; margin-bottom:15px;">
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px; color:#9ca3af; letter-spacing: 1px;">DESCRIPTION</label>
        <input type="text" id="rDesc" style="width:100%; padding:12px; margin-bottom:15px;" placeholder="Brief description...">
    `;
    createModalOverlay("LOG RADAR EVENT", html, () => {
        const type = document.getElementById('rType').value;
        const date = document.getElementById('rDate').value;
        const desc = document.getElementById('rDesc').value;
        if(!date || !desc) { alert("Date and Description required."); return; }
        logRadarEvent(type, date, desc);
        document.getElementById('xhrModal').remove();
    });
}

function openVaultModal() {
    const html = `
        <p style="font-size:0.9rem; color:#d1d5db; margin-bottom:20px;">Secure external evidence before IT severs your network access.</p>
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px; color:#9ca3af; letter-spacing: 1px;">SELECT LOCAL FILE / SCREENSHOT</label>
        <input type="file" id="vFile" style="width:100%; padding:12px; margin-bottom:15px;">
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px; color:#9ca3af; letter-spacing: 1px;">EXHIBIT DESCRIPTION</label>
        <input type="text" id="vDesc" style="width:100%; padding:12px; margin-bottom:15px;" placeholder="e.g., 2024 Performance Review showing 5/5">
    `;
    createModalOverlay("SECURE OFF-GRID EVIDENCE", html, () => {
        const fileInput = document.getElementById('vFile');
        const desc = document.getElementById('vDesc').value;
        let filename = "No file selected";
        if(fileInput.files.length > 0) filename = fileInput.files[0].name;
        if(!desc) { alert("Description is required to establish chain of custody."); return; }
        logEvidence(filename, desc);
        document.getElementById('xhrModal').remove();
    });
}

// --- 6. DATA EXPORT ---
function generateHRDossier() {
    const reportData = JSON.stringify(state, null, 2);
    const blob = new Blob([reportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "XHR_Defense_Dossier.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
}

// --- 7. PRO SE DOCUMENT ENGINE ---
function openDocumentEngine() {
    let lines = '';
    for(let i = 1; i <= 28; i++) { lines += i + '<br>'; }
    let documentText = `<div style="text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 20px;">EXHIBIT 1: CONTEMPORANEOUS TIMELINE OF EVENTS</div>`;
    
    if (state.incidents.length === 0) {
        documentText += `No incidents have been securely logged to the timeline yet.`;
    } else {
        const sortedIncidents = [...state.incidents].sort((a, b) => new Date(a.date) - new Date(b.date));
        sortedIncidents.forEach(inc => {
            documentText += `<p style="text-indent: 0.5in; margin: 0;">On or about <strong>${inc.date}</strong>, the following action was taken by ${inc.aggressor}: "${inc.desc}" (Witnesses: ${inc.witnesses}). This entry was contemporaneously logged into the secure matrix on ${inc.loggedAt}.</p>`;
        });
    }

    const html = `
        <div class="pleading-paper-container">
            <div class="pleading-paper">
                <div class="line-numbers">${lines}</div>
                <div class="pleading-content">
                    <p><strong>NAME:</strong> USER<br><strong>PRO SE LITIGANT</strong></p><br><br>
                    ${documentText}
                </div>
            </div>
        </div>
        <p style="font-size: 0.85rem; color: #9ca3af; text-align: center; margin-top: 15px;">This visualizer demonstrates how X-HR translates raw logs into standard civil procedure formatting.</p>
    `;

    createModalOverlay("PRO SE DOCUMENT ASSEMBLER", html, null, true);
}