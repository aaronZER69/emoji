// main.js - Version corrigée complète
// ========================================
// CONFIGURATION ET INITIALISATION
// ========================================

console.log('🎭 Emoji Code Humeur - Version Module Corrigé v2.4');

let supabase = null;
let humeurs = [];
let selectedEmoji = '';
let sessionStartTime = new Date();
let autoRefreshInterval = null;
let connectionCheckInterval = null;
let isConnected = false;
let realtimeChannel = null;
let appInitialized = false;

const AUTO_REFRESH_INTERVAL = 30000; // 30s
const CONNECTION_CHECK_INTERVAL = 10000; // 10s

// ========================================
// INITIALISATION SUPABASE
// ========================================

async function initSupabase() {
    try {
        console.log('🔧 Initialisation Supabase...');
        const { getSupabaseClient, checkSupabaseStatus } = await import('./supabaseClient.js');
        const status = checkSupabaseStatus();
        console.log('🔍 État Supabase:', status);

        supabase = await getSupabaseClient();
        console.log('Client Supabase:', supabase);

        // Test de connexion simple
        const { data, error } = await supabase.from('humeur').select('*').limit(1);
        if (error) throw new Error(`Erreur table 'humeur': ${error.message}`);

        console.log('🚀 Supabase connecté avec succès');
        console.log('📊 URL configurée:', window.PRIVATE_CONFIG?.supabaseUrl);

        isConnected = true;
        updateConnectionStatus(true);

        await loadHumeursFromSupabase();
        setupRealtimeSubscription();
        startAutoRefresh();

        return true;

    } catch (error) {
        console.error('❌ Erreur init Supabase:', error);
        showConnectionError(error);
        isConnected = false;
        updateConnectionStatus(false);
        return false;
    }
}

function showConnectionError(error) {
    const existingError = document.querySelector('.connection-error');
    if (existingError) existingError.remove();

    const container = document.createElement('div');
    container.className = 'connection-error';
    container.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #ffebee; border: 2px solid #f44336; border-radius: 8px; padding: 20px;
        max-width: 600px; z-index: 10000; font-family: system-ui, sans-serif;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    container.innerHTML = `
        <h3 style="color:#d32f2f; margin:0 0 10px 0;">❌ Erreur de connexion Supabase</h3>
        <p style="margin:0 0 10px 0;"><strong>Détails :</strong> ${error.message}</p>
        <details style="margin:10px 0;">
            <summary style="cursor:pointer;color:#1976d2;">🔍 Diagnostic détaillé</summary>
            <div style="margin-top:10px; padding:10px; background:#f5f5f5; border-radius:4px; font-size:12px;">
                • URL Supabase : ${window.PRIVATE_CONFIG?.supabaseUrl || '❌ Manquant'}<br>
                • Clé Supabase : ${window.PRIVATE_CONFIG?.supabaseAnonKey ? '✅ Présente' : '❌ Manquante'}<br>
                • Bibliothèque : ${typeof supabase !== 'undefined' ? '✅ Chargée' : '❌ Non chargée'}<br>
                • CreateClient : ${supabase?.createClient ? '✅ Disponible' : '❌ Indisponible'}
            </div>
        </details>
        <div style="margin-top:15px;">
            <button onclick="window.location.reload()" style="background:#f44336;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;margin-right:10px;">🔄 Recharger</button>
            <button onclick="this.parentElement.parentElement.remove()" style="background:#757575;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">Fermer</button>
        </div>
    `;
    document.body.insertBefore(container, document.body.firstChild);
}

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('modeIndicator');
    const icon = document.getElementById('modeIcon');
    const text = document.getElementById('modeText');

    if (indicator && icon && text) {
        if (connected) {
            indicator.style.background = '#e3f2fd';
            indicator.style.color = '#1976d2';
            icon.textContent = '⚡';
            text.textContent = 'Connecté via module - Synchronisation automatique';
        } else {
            indicator.style.background = '#ffebee';
            indicator.style.color = '#d32f2f';
            icon.textContent = '🔌';
            text.textContent = 'Erreur de connexion - Voir détails';
        }
    }
}

// ========================================
// CHARGEMENT HUMEURS
// ========================================

async function loadHumeursFromSupabase() {
    if (!supabase || !isConnected) return;

    try {
        console.log('📥 Chargement des humeurs...');
        const { data, error } = await supabase.from('humeur').select('*').order('created_at', { ascending:false }).limit(100);
        if (error) throw error;

        humeurs = data || [];
        updateDisplay();
        if (!isConnected) { isConnected = true; updateConnectionStatus(true); }

    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        isConnected = false;
        updateConnectionStatus(false);

        setTimeout(() => initSupabase(), 5000);
    }
}

// ========================================
// TEMPS RÉEL
// ========================================

function setupRealtimeSubscription() {
    if (!supabase) return;

    console.log('📡 Configuration temps réel...');
    realtimeChannel = supabase.channel('humeur_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'humeur' }, payload => {
            console.log('🔄 Changement temps réel:', payload.eventType);
            if (payload.eventType === 'INSERT') {
                humeurs.unshift(payload.new);
                updateDisplay();
            } else if (payload.eventType === 'DELETE') {
                loadHumeursFromSupabase();
            }
        })
        .subscribe();
}

// ========================================
// AUTO REFRESH ET RECONNEXION
// ========================================

function startAutoRefresh() {
    console.log('⏰ Démarrage auto-refresh...');
    autoRefreshInterval = setInterval(() => loadHumeursFromSupabase(), AUTO_REFRESH_INTERVAL);

    connectionCheckInterval = setInterval(async () => {
        if (!isConnected && supabase) {
            try {
                const { data, error } = await supabase.from('humeur').select('*').limit(1);
                if (!error) {
                    isConnected = true;
                    updateConnectionStatus(true);
                    await loadHumeursFromSupabase();
                    console.log('✅ Reconnexion réussie');
                }
            } catch {}
        }
    }, CONNECTION_CHECK_INTERVAL);
}

// ========================================
// SOUMISSION HUMEURS
// ========================================

async function submitMood() {
    const nom = document.getElementById('studentName')?.value?.trim();
    const langagePrefere = document.getElementById('favoriteLanguage')?.value;
    const autrePreference = document.getElementById('otherPreference')?.value;
    const commentaire = document.getElementById('comment')?.value?.trim();
    const submitBtn = document.getElementById('submitBtn');

    if (!selectedEmoji || !langagePrefere || !autrePreference) {
        alert('Remplis tous les champs et choisis un emoji !');
        return;
    }

    if (submitBtn) { submitBtn.disabled=true; submitBtn.textContent='🔄 Envoi...'; }

    const humeur = { nom, emoji:selectedEmoji, langage_prefere:langagePrefere, autre_preference:autrePreference || null, commentaire:commentaire || null };

    const success = await addHumeur(humeur);
    if (success) resetForm();
    if (submitBtn) {
        submitBtn.textContent = success ? '✅ Envoyé !' : '❌ Erreur';
        setTimeout(() => { submitBtn.textContent='🚀 Partager mon humeur'; submitBtn.disabled=false; }, 2500);
    }
}

async function addHumeur(humeur) {
    if (!supabase) { alert('Erreur : Supabase non connecté'); return false; }

    try {
        let query = supabase.from('humeur').select('*').eq('nom', humeur.nom).eq('emoji', humeur.emoji).eq('langage_prefere', humeur.langage_prefere);
        if (humeur.autre_preference) query = query.eq('autre_preference', humeur.autre_preference);
        else query = query.is('autre_preference', null);

        const cinqMinutesAgo = new Date(Date.now() - 5*60*1000).toISOString();
        query = query.gte('created_at', cinqMinutesAgo).limit(1);

        const { data: existing, error: selectError } = await query;
        if (selectError) throw selectError;
        if (existing?.length > 0) { alert('Doublon détecté. Attends quelques minutes.'); return false; }

        const { error } = await supabase.from('humeur').insert([humeur]);
        if (error) throw error;
        return true;

    } catch (error) {
        alert('Erreur envoi: '+error.message);
        return false;
    }
}

function resetForm() {
    const form = document.getElementById('moodForm');
    if (form) form.reset();
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
    selectedEmoji = '';
}

// ========================================
// AFFICHAGE
// ========================================

function updateDisplay() { updateStats(); updateMoodList(); updateVisualization(); }

function updateStats() {
    const totalEl = document.getElementById('totalParticipants');
    const varietyEl = document.getElementById('moodVariety');
    const timeEl = document.getElementById('sessionTime');

    if (totalEl) totalEl.textContent = humeurs.length;
    if (varietyEl) varietyEl.textContent = new Set(humeurs.map(h=>h.emoji)).size;
    if (timeEl) timeEl.textContent = Math.floor((new Date()-sessionStartTime)/60000);
}

function updateMoodList() {
    const container = document.getElementById('moodList');
    if (!container) return;
    if (humeurs.length===0) { container.innerHTML='<p>🤖 En attente des retours...</p>'; return; }

    container.innerHTML = humeurs.map(h => {
        const codeSnippet = generateCodeSnippet(h);
        const timeDisplay = new Date(h.created_at).toISOString();
        return `<div class="mood-item">
            <span>${escapeHtml(h.nom)} ${h.emoji} (${h.langage_prefere})</span>
            <span>${timeDisplay}</span>
            <div>${h.commentaire||''}</div>
            <div>${h.autre_preference||''}</div>
            <pre>${codeSnippet}</pre>
        </div>`;
    }).join('');
}

function generateCodeSnippet(h) {
    const lang = h.langage_prefere || 'javascript';
    const templates = {
        javascript: `let humeur="${h.emoji}";${h.commentaire ? ' // '+escapeHtml(h.commentaire):''}`,
        python: `humeur="${h.emoji}"${h.commentaire ? '  # '+escapeHtml(h.commentaire):''}`,
        java: `String humeur="${h.emoji}";${h.commentaire ? ' // '+escapeHtml(h.commentaire):''}`
    };
    return templates[lang] || templates.javascript;
}

function escapeHtml(text) { const div=document.createElement('div'); div.textContent=text; return div.innerHTML; }

function updateVisualization() {
    const container=document.getElementById('moodVisualization');
    if(!container) return;
    const emojiCounts={};
    humeurs.forEach(h=>emojiCounts[h.emoji]=(emojiCounts[h.emoji]||0)+1);
    container.innerHTML=Object.entries(emojiCounts).map(([e,c])=>`<div>${e} x${c}</div>`).join('');
}

// ========================================
// INITIALISATION APP
// ========================================
let appInitialized = false;

function setupEventListeners() {
    console.log('🔧 Initialisation des interactions utilisateur');

    // Boutons emoji
    const emojiButtons = document.querySelectorAll('.emoji-btn');
    emojiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedEmoji = btn.dataset.emoji;
            console.log('😊 Emoji sélectionné:', selectedEmoji);
        });
    });

    // Formulaire
    const form = document.getElementById('moodForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            submitMood();
        });
        console.log('✅ Formulaire configuré');
    }

    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            toggleAdminPanel();
        }
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportMoods();
        }
        if (e.ctrlKey && e.key === 'j') {
            e.preventDefault();
            exportMoodsJSON();
        }
    });
}


async function initApp() {
    if(appInitialized) return;
    appInitialized=true;
    console.log('🚀 Initialisation App...');
    setupEventListeners();
    const success = await initSupabase();
    if(!success) console.warn('⚠️ Mode lecture seule');
    updateDisplay();
}

function startApp() {
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initApp);
    else initApp();
}

startApp();

// ========================================
// NETTOYAGE
// ========================================

window.addEventListener('beforeunload', () => {
    if(autoRefreshInterval) clearInterval(autoRefreshInterval);
    if(connectionCheckInterval) clearInterval(connectionCheckInterval);
    if(realtimeChannel && supabase) supabase.removeChannel(realtimeChannel);
});
