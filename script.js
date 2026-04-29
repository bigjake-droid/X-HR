// --- 1. STATE MANAGEMENT (X-HR ISOLATED STORAGE) ---
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
    
    // Wire the new tactical dossier button from the dark header
    const dossierBtn = document.getElementById('btn-export-dossier');
    if(dossierBtn) {
        dossierBtn.addEventListener('click', generateHRDossier);
    }
};

function injectUIComponents() {
    // Inject dynamic display areas into the bottom of the first 3 module cards
    const cards = document.querySelectorAll('.card');
    if(cards.length >= 4) {
        cards.forEach((card, index) => {
            if(index < 3) { 
                const displayArea = document.createElement('div');
                displayArea.id = `displayArea-${index}`;
                displayArea.style.cssText = "margin-top: 20px; border-top: 1px solid #d1d5db; padding-top: 15px;";
                card.appendChild(displayArea);
            }
        });
    }
}

function wireButtons() {
    const buttons = document.querySelectorAll('.btn-charcoal');
    if(buttons.length >= 4) {
        buttons[0].addEventListener('click', openJournalModal);
        buttons[1].addEventListener('click', openRadarModal);
        buttons[2].addEventListener('click', openVaultModal);
        buttons[3].addEventListener('click', openDocumentEngine);
    }
}

// --- 3. CORE LOGIC ---
function logIncident(date, aggressor, desc, witnesses) {
    state.incidents.unshift({ 
        date: date, 
        aggressor: aggressor, 
        desc: desc, 
        witnesses: witnesses || "None",
        loggedAt: new Date().toLocaleString()
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
    // Journal Update
    const journalArea = document.getElementById('displayArea-0');
    if(journalArea) {
        if(state.incidents.length === 0) {
            journalArea.innerHTML = `<p style="font-size:0.85rem; color:var(--charcoal-light);">No incidents logged.</p>`;
        } else {
            journalArea.innerHTML = state.incidents.slice(0,3).map(inc => `
                <div style="margin-bottom: 10px; padding: 10px; background: #f9fafb; border-left: 3px solid var(--charcoal); border-radius: 4px;">
                    <strong style="font-size:0.9rem;">${inc.date} | Aggressor: ${inc.aggressor}</strong>
                    <p style="font-size:0.85rem; margin: 5px 0 0 0;">${inc.desc}</p>
                </div>
            `).join('') + (state.incidents.length > 3 ? `<p style="font-size:0.8rem; text-align:center; font-weight: 700;">+${state.incidents.length - 3} more entries securely logged.</p>` : '');
        }
    }

    // Radar Update
    const radarArea = document.getElementById('displayArea-1');
    if(radarArea) {
        let radarHTML = '';
        if(state.radar.protectedActs.length > 0 && state.radar.adverseActions.length > 0) {
            const firstProtected = new Date(state.radar.protectedActs[0].date);
            const firstAdverse = new Date(state.radar.adverseActions[0].date);
            const diffTime = firstAdverse - firstProtected;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if(diffDays >= 0) {
                radarHTML += `
                <div style="background: #FEF2F2; border: 1px solid #DC2626; padding: 12px; margin-bottom: 15px; border-radius: 6px;">
                    <strong style="color: #DC2626; font-size:0.9rem;">⚠️ CAUSAL GAP DETECTED: ${diffDays} DAYS</strong>
                    <p style="font-size:0.8rem; color: #991B1B; margin-top:4px;">Between protected act and adverse action. High probability of retaliation.</p>
                </div>`;
            }
        }
        radarHTML += `<div style="display:flex; gap:10px;">`;
        radarHTML += `<div style="flex:1;"><strong>Protected Acts (${state.radar.protectedActs.length})</strong></div>`;
        radarHTML += `<div style="flex:1;"><strong>Adverse Actions (${state.radar.adverseActions.length})</strong></div>`;
        radarHTML += `</div>`;
        radarArea.innerHTML = radarHTML;
    }

    // Vault Update
    const vaultArea = document.getElementById('displayArea-2');
    if(vaultArea) {
        if(state.evidence.length === 0) {
            vaultArea.innerHTML = `<p style="font-size:0.85rem; color:var(--charcoal-light);">No exhibits secured.</p>`;
        } else {
            vaultArea.innerHTML = state.evidence.map(ex => `
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding: 8px 0; border-bottom: 1px dashed #d1d5db;">
                    <span><strong>${ex.id}:</strong> ${ex.desc}</span>
                    <span style="color:var(--charcoal-light);">${ex.date}</span>
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
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(31, 41, 55, 0.7); display:flex; justify-content:center; align-items:center; z-index:1000; padding:20px; backdrop-filter: blur(4px);";
    
    let buttonsHTML = `<button onclick="document.getElementById('xhrModal').remove()" style="flex:1; padding:12px; background:transparent; border:2px solid var(--charcoal); color:var(--charcoal); font-weight:700; border-radius:6px; cursor:pointer;">${hideSave ? 'CLOSE' : 'CANCEL'}</button>`;
    if(!hideSave) {
        buttonsHTML += `<button id="modalSaveBtn" style="flex:1; padding:12px; background:var(--charcoal); border:none; color:#fff; font-weight:700; border-radius:6px; cursor:pointer;">SAVE TO RECORD</button>`;
    }

    overlay.innerHTML = `
        <div style="background:#fff; border-radius:12px; padding:30px; width:100%; max-width:600px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto;">
            <h3 style="font-size:1.5rem; border-bottom:2px solid #e5e7eb; padding-bottom:12px; margin-bottom:20px; color:var(--charcoal);">${title}</h3>
            ${innerHTML}
            <div style="display:flex; gap:10px; margin-top:25px;">
                ${buttonsHTML}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    if(!hideSave) document.getElementById('modalSaveBtn').addEventListener('click', onSave);
}

function openJournalModal() {
    const html