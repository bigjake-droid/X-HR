// --- 1. STATE MANAGEMENT (X-HR ISOLATED STORAGE) ---
// We use a unique key so it never overwrites your CaseForge or Ledger data.
let state = {
    incidents: [], 
    radar: {
        protectedActs: [],
        adverseActions: []
    },
    evidence: [] 
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
    // 1. Inject an Export Button into the header
    const header = document.querySelector('.header');
    if(header) {
        const exportBtn = document.createElement('button');
        exportBtn.innerText = "EXPORT DEFENSE DOSSIER";
        exportBtn.style.cssText = "margin-top: 15px; background: transparent; border: 2px solid var(--charcoal); color: var(--charcoal); padding: 8px 15px; font-weight: 700; cursor: pointer; border-radius: 4px; transition: all 0.2s;";
        exportBtn.onmouseover = () => { exportBtn.style.background = "var(--charcoal)"; exportBtn.style.color = "#fff"; };
        exportBtn.onmouseout = () => { exportBtn.style.background = "transparent"; exportBtn.style.color = "var(--charcoal)"; };
        exportBtn.onclick = generateHRDossier;
        header.appendChild(exportBtn);
    }

    // 2. Inject Display Containers into the existing HTML Cards
    const cards = document.querySelectorAll('.card');
    if(cards.length >= 3) {
        cards.forEach((card, index) => {
            const displayArea = document.createElement('div');
            displayArea.id = `displayArea-${index}`;
            displayArea.style.cssText = "margin-top: 20px; border-top: 1px solid var(--charcoal-light); padding-top: 15px;";
            card.appendChild(displayArea);
        });
    }
}

function wireButtons() {
    const buttons = document.querySelectorAll('.btn-charcoal');
    if(buttons.length >= 3) {
        buttons[0].addEventListener('click', openJournalModal);
        buttons[1].addEventListener('click', openRadarModal);
        buttons[2].addEventListener('click', openVaultModal);
    }
}

// --- 3. CORE LOGIC ---
function logIncident(date, aggressor, desc, witnesses) {
    state.incidents.unshift({ 
        date: date, 
        aggressor: aggressor, 
        desc: desc, 
        witnesses: witnesses || "None",
        loggedAt: new Date().toLocaleString() // The crucial "contemporaneous" timestamp
    });
    saveData();
    updateUI();
}

function logRadarEvent(type, date, desc) {
    const event = { date: date, desc: desc, loggedAt: new Date().toLocaleDateString() };
    if(type === 'protected') {
        state.radar.protectedActs.push(event);
        state.radar.protectedActs.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
        state.radar.adverseActions.push(event);
        state.radar.adverseActions.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    saveData();
    updateUI();
}

function logEvidence(filename, desc) {
    const exhibitLetter = String.fromCharCode(65 + state.evidence.length); 
    state.evidence.push({
        id: `Exhibit ${exhibitLetter}`,
        filename: filename,
        desc: desc,
        date: new Date().toLocaleDateString()
    });
    saveData();
    updateUI();
}

// --- 4. DATA PERSISTENCE & UI UPDATES ---
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved) {
        state = JSON.parse(saved);
        if(!state.radar) state.radar = { protectedActs: [], adverseActions: [] };
    }
}

function updateUI() {
    // Update Journal (Card 0)
    const journalArea = document.getElementById('displayArea-0');
    if(journalArea) {
        if(state.incidents.length === 0) {
            journalArea.innerHTML = `<p style="font-size:0.85rem; color:var(--charcoal-light);">No incidents logged.</p>`;
        } else {
            journalArea.innerHTML = state.incidents.slice(0,3).map(inc => `
                <div style="margin-bottom: 10px; padding: 10px; background: var(--bg-warm-white); border-left: 3px solid var(--charcoal);">
                    <strong style="font-size:0.9rem;">${inc.date} | Aggressor: ${inc.aggressor}</strong>
                    <p style="font-size:0.85rem; margin: 5px 0 0 0;">${inc.desc}</p>
                </div>
            `).join('') + (state.incidents.length > 3 ? `<p style="font-size:0.8rem; text-align:center; font-weight: 700;">+${state.incidents.length - 3} more entries securely logged.</p>` : '');
        }
    }

    // Update Radar (Card 1)
    const radarArea = document.getElementById('displayArea-1');
    if(radarArea) {
        let radarHTML = '';
        
        // Causal Gap Math Engine
        if(state.radar.protectedActs.length > 0 && state.radar.adverseActions.length > 0) {
            const firstProtected = new Date(state.radar.protectedActs[0].date);
            const firstAdverse = new Date(state.radar.adverseActions[0].date);
            const diffTime = firstAdverse - firstProtected;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if(diffDays >= 0) {
                radarHTML += `
                <div style="background: #FFF0F0; border: 1px solid #b91c1c; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
                    <strong style="color: #b91c1c; font-size:0.9rem;">⚠️ CAUSAL GAP DETECTED: ${diffDays} DAYS</strong>
                    <p style="font-size:0.8rem; color: #b91c1c; margin-top:3px;">Between protected act and adverse action. High probability of retaliation.</p>
                </div>`;
            }
        }

        radarHTML += `<div style="display:flex; gap:10px;">`;
        radarHTML += `<div style="flex:1;"><strong>Protected Acts (${state.radar.protectedActs.length})</strong></div>`;
        radarHTML += `<div style="flex:1;"><strong>Adverse Actions (${state.radar.adverseActions.length})</strong></div>`;
        radarHTML += `</div>`;
        radarArea.innerHTML = radarHTML;
    }

    // Update Vault (Card 2)
    const vaultArea = document.getElementById('displayArea-2');
    if(vaultArea) {
        if(state.evidence.length === 0) {
            vaultArea.innerHTML = `<p style="font-size:0.85rem; color:var(--charcoal-light);">No exhibits secured.</p>`;
        } else {
            vaultArea.innerHTML = state.evidence.map(ex => `
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding: 5px 0; border-bottom: 1px dashed #ccc;">
                    <span><strong>${ex.id}:</strong> ${ex.desc}</span>
                    <span style="color:var(--charcoal-light);">${ex.date}</span>
                </div>
            `).join('');
        }
    }
}

// --- 5. TACTICAL MODALS ---
function createModalOverlay(title, innerHTML, onSave) {
    const existing = document.getElementById('xhrModal');
    if(existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'xhrModal';
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(250, 250, 250, 0.95); display:flex; justify-content:center; align-items:center; z-index:1000; padding:20px;";
    
    overlay.innerHTML = `
        <div style="background:#fff; border:2px solid var(--charcoal); padding:30px; width:100%; max-width:500px; border-radius:8px; box-shadow: 4px 4px 0px var(--accent-warm);">
            <h3 style="font-size:1.5rem; border-bottom:2px solid var(--charcoal); padding-bottom:10px; margin-bottom:20px;">${title}</h3>
            ${innerHTML}
            <div style="display:flex; gap:10px; margin-top:25px;">
                <button onclick="document.getElementById('xhrModal').remove()" style="flex:1; padding:12px; background:transparent; border:2px solid var(--charcoal); color:var(--charcoal); font-weight:700; cursor:pointer;">CANCEL</button>
                <button id="modalSaveBtn" style="flex:1; padding:12px; background:var(--charcoal); border:2px solid var(--charcoal); color:#fff; font-weight:700; cursor:pointer;">SAVE TO RECORD</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('modalSaveBtn').addEventListener('click', onSave);
}

function openJournalModal() {
    const html = `
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px;">DATE OF INCIDENT</label>
        <input type="date" id="jDate" style="width:100%; padding:10px; border:1px solid #ccc; margin-bottom:15px; font-family:inherit;">
        
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px;">AGGRESSOR / MANAGER NAME</label>
        <input type="text" id="jName" style="width:100%; padding:10px; border:1px solid #ccc; margin-bottom:15px; font-family:inherit;" placeholder="Who committed the action?">
        
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px;">DESCRIPTION OF EVENT / THREAT</label>
        <textarea id="jDesc" style="width:100%; padding:10px; border:1px solid #ccc; margin-bottom:15px; font-family:inherit; min-height:80px;" placeholder="Exact quotes if possible..."></textarea>
        
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px;">WITNESSES (IF ANY)</label>
        <input type="text" id="jWit" style="width:100%; padding:10px; border:1px solid #ccc; margin-bottom:15px; font-family:inherit;" placeholder="Names of others present">
    `;
    createModalOverlay("LOG CONTEMPORANEOUS INCIDENT", html, () => {
        const date = document.getElementById('jDate').value;
        const name = document.getElementById('jName').value;
        const desc = document.getElementById('jDesc').value;
        const wit = document.getElementById('jWit').value;
        if(!date || !desc) { alert("Date and Description are required for a valid record."); return; }
        logIncident(date, name, desc, wit);
        document.getElementById('xhrModal').remove();
    });
}

function openRadarModal() {
    const html = `
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px;">TYPE OF EVENT</label>
        <select id="rType" style="width:100%; padding:10px; border:1px solid #ccc; margin-bottom:15px; font-family:inherit;">
            <option value="protected">Protected Activity (e.g., Reported HR, Requested FMLA)</option>
            <option value="adverse">Adverse Action (e.g., Demotion, Written Warning, Fired)</option>
        </select>
        
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px;">DATE OF EVENT</label>
        <input type="date" id="rDate" style="width:100%; padding:10px; border:1px solid #ccc; margin-bottom:15px; font-family:inherit;">
        
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px;">DESCRIPTION</label>
        <input type="text" id="rDesc" style="width:100%; padding:10px; border:1px solid #ccc; margin-bottom:15px; font-family:inherit;" placeholder="Brief description...">
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
        <p style="font-size:0.85rem; color:var(--charcoal-light); margin-bottom:15px;">Secure external evidence before IT severs your network access.</p>
        
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px;">SELECT LOCAL FILE / SCREENSHOT</label>
        <input type="file" id="vFile" style="width:100%; padding:10px; border:1px dashed #ccc; margin-bottom:15px; font-family:inherit;">
        
        <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:5px;">EXHIBIT DESCRIPTION</label>
        <input type="text" id="vDesc" style="width:100%; padding:10px; border:1px solid #ccc; margin-bottom:15px; font-family:inherit;" placeholder="e.g., 2024 Performance Review showing 5/5">
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