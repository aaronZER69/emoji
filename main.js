// main.js - Version Cabinet Médical
// ========================================

console.log('🏥 Cabinet Médical - Gestion Symptômes v2.3');

// Variables globales
let supabase = null;
let symptomes = [];
let selectedSymptomeEmoji = '';
let sessionStartTime = new Date();
let autoRefreshInterval = null;
let isConnected = false;
let realtimeChannel = null;

// Configuration auto-actualisation
const AUTO_REFRESH_INTERVAL = 30000; // 30 secondes
const CONNECTION_CHECK_INTERVAL = 10000; // 10 secondes

// ========================================
// INITIALISATION SUPABASE
// ========================================

async function initSupabase() {
    try {
        console.log('🔧 Initialisation Supabase pour cabinet médical...');
        const { getSupabaseClient, checkSupabaseStatus } = await import('./supabaseClient.js');
        const status = checkSupabaseStatus();
        console.log('🔍 État Supabase:', status);

        supabase = await getSupabaseClient();
        console.log('Client Supabase:', supabase);

        const { data, error } = await supabase.from('symptome').select('count').limit(1);
        if (error) throw new Error(`Erreur table symptome: ${error.message}`);

        console.log('🚀 Supabase connecté');
        isConnected = true;
        updateConnectionStatus(true);

        await loadSymptomesFromSupabase();
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

    const errorContainer = document.createElement('div');
    errorContainer.className = 'connection-error';
    errorContainer.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #ffebee; border: 2px solid #f44336; border-radius: 8px;
        padding: 20px; max-width: 600px; z-index: 10000; font-family: system-ui, sans-serif;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    errorContainer.innerHTML = `
        <h3 style="color:#d32f2f;">❌ Erreur connexion Supabase</h3>
        <p>${error.message}</p>
        <button onclick="window.location.reload()" style="background:#f44336;color:white;padding:8px 16px;border:none;border-radius:4px;cursor:pointer;">🔄 Recharger</button>
        <button onclick="this.parentElement.remove()" style="background:#757575;color:white;padding:8px 16px;border:none;border-radius:4px;cursor:pointer;">Fermer</button>
    `;
    document.body.insertBefore(errorContainer, document.body.firstChild);
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
            text.textContent = 'Connecté - Synchronisation automatique';
        } else {
            indicator.style.background = '#ffebee';
            indicator.style.color = '#d32f2f';
            icon.textContent = '🔌';
            text.textContent = 'Erreur de connexion';
        }
    }
}

// ========================================
// CHARGEMENT DES SYMPTOMES
// ========================================

async function loadSymptomesFromSupabase() {
    if (!supabase || !isConnected) return;

    try {
        console.log('📥 Chargement des symptômes...');
        const { data, error } = await supabase.from('symptome').select('*').order('created_at', { ascending: false }).limit(100);
        if (error) throw error;

        symptomes = data || [];
        updateDisplay();
        console.log(`📊 ${symptomes.length} symptômes chargés`);
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

    realtimeChannel = supabase
        .channel('symptome_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'symptome' }, payload => {
            console.log('🔄 Changement temps réel:', payload.eventType);

            if (payload.eventType === 'INSERT') {
                symptomes.unshift(payload.new);
                updateDisplay();
            } else if (payload.eventType === 'DELETE') {
                loadSymptomesFromSupabase();
            }
        })
        .subscribe(status => {
            console.log('📡 Statut temps réel:', status);
            isConnected = status === 'SUBSCRIBED';
            updateConnectionStatus(isConnected);
        });
}

function startAutoRefresh() {
    autoRefreshInterval = setInterval(loadSymptomesFromSupabase, AUTO_REFRESH_INTERVAL);

    setInterval(async () => {
        if (!isConnected && supabase) {
            console.log('🔌 Tentative reconnexion...');
            try {
                const { error } = await supabase.from('symptome').select('count').limit(1);
                if (!error) {
                    isConnected = true;
                    updateConnectionStatus(true);
                    await loadSymptomesFromSupabase();
                    console.log('✅ Reconnexion réussie');
                }
            } catch {}
        }
    }, CONNECTION_CHECK_INTERVAL);
}

// ========================================
// GESTION UI
// ========================================

function setupEventListeners() {
    console.log('🔧 Setup interactions UI');

    const emojiButtons = document.querySelectorAll('.emoji-btn');
    emojiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            emojiButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedSymptomeEmoji = btn.dataset.emoji;
            console.log('✅ Emoji sélectionné:', selectedSymptomeEmoji);
        });
    });

    const form = document.getElementById('symptomeForm');
    if (form) form.addEventListener('submit', e => { e.preventDefault(); submitSymptome(); });
}

// ========================================
// GESTION DES SYMPTOMES
// ========================================

async function submitSymptome() {
    const patientName = document.getElementById('patientName')?.value?.trim();
    const commentaire = document.getElementById('comment')?.value?.trim();
    const submitBtn = document.getElementById('submitBtn');

    if (!selectedSymptomeEmoji) return alert('Sélectionne un symptôme !');
    if (!patientName) return alert('Nom du patient requis !');

    submitBtn.disabled = true;
    submitBtn.textContent = '🔄 Envoi...';

    const symptome = {
        nom: patientName,
        emoji: selectedSymptomeEmoji,
        commentaire: commentaire || null
    };

    const success = await addSymptome(symptome);

    if (success) {
        resetForm();
        submitBtn.textContent = '✅ Envoyé !';
        setTimeout(() => { submitBtn.textContent = 'Partager symptôme'; submitBtn.disabled = false; }, 2000);
    } else {
        submitBtn.textContent = '❌ Erreur';
        setTimeout(() => { submitBtn.textContent = 'Partager symptôme'; submitBtn.disabled = false; }, 2000);
    }
}

async function addSymptome(symptome) {
    if (!supabase) return alert('Connexion non établie !'), false;

    try {
        const cinqMinutes = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: existing } = await supabase.from('symptome')
            .select('*')
            .eq('nom', symptome.nom)
            .eq('emoji', symptome.emoji)
            .gte('created_at', cinqMinutes)
            .limit(1);

        if (existing && existing.length > 0) return alert('Symptôme déjà enregistré récemment !'), false;

        const { error } = await supabase.from('symptome').insert([symptome]);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Erreur ajout symptôme:', error);
        alert(`Erreur: ${error.message}`);
        return false;
    }
}

function resetForm() {
    document.getElementById('symptomeForm')?.reset();
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
    selectedSymptomeEmoji = '';
}

// ========================================
// AFFICHAGE
// ========================================

function updateDisplay() {
    updateStats();
    updateSymptomeList();
}

function updateStats() {
    document.getElementById('totalPatients')?.textContent = symptomes.length;
}

function updateSymptomeList() {
    const container = document.getElementById('symptomeList');
    if (!container) return;

    if (symptomes.length === 0) {
        container.innerHTML = `<p>🤖 Aucun symptôme enregistré pour l'instant.</p>`;
        return;
    }

    container.innerHTML = symptomes.map(s => `
        <div class="symptome-item">
            <span class="symptome-name">${escapeHtml(s.nom)}</span>
            <span class="symptome-emoji">${s.emoji}</span>
            ${s.commentaire ? `<span class="symptome-comment">"${escapeHtml(s.commentaire)}"</span>` : ''}
        </div>
    `).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// INITIALISATION
// ========================================

async function initApp() {
    setupEventListeners();
    const supabaseSuccess = await initSupabase();
    if (supabaseSuccess) updateDisplay();
}

function startApp() {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
    else initApp();
}

startApp();
