// main.js - Version Symptômes Cabinet Médical
// ========================================

console.log('🩺 Cabinet Médical - Version Module Corrigé v3.0');

// Variables globales
let supabase = null;
let symptomes = [];
let selectedSymptome = '';
let sessionStartTime = new Date();
let autoRefreshInterval = null;
let isConnected = false;
let realtimeChannel = null;

// Configuration auto-actualisation
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
        console.log('Client Supabase chargé:', supabase);

        // Test connexion table symptome
        const { data, error } = await supabase.from('symptome').select('count').limit(1);
        if (error) throw new Error(error.message);

        isConnected = true;
        updateConnectionStatus(true);

        await loadSymptomesFromSupabase();
        setupRealtimeSubscription();
        startAutoRefresh();
        return true;

    } catch (error) {
        console.error('❌ Erreur init Supabase:', error);
        isConnected = false;
        updateConnectionStatus(false);
        showConnectionError(error);
        return false;
    }
}

function showConnectionError(error) {
    const existing = document.querySelector('.connection-error');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'connection-error';
    div.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #ffebee; border: 2px solid #f44336; border-radius: 8px;
        padding: 20px; max-width: 600px; z-index: 10000; font-family: system-ui;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    div.innerHTML = `
        <h3 style="color:#d32f2f;">❌ Erreur de connexion Supabase</h3>
        <p>${error.message}</p>
        <button onclick="window.location.reload()">🔄 Recharger</button>
        <button onclick="this.parentElement.remove()">Fermer</button>
    `;
    document.body.insertBefore(div, document.body.firstChild);
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
            text.textContent = 'Connecté - Synchronisation active';
        } else {
            indicator.style.background = '#ffebee';
            indicator.style.color = '#d32f2f';
            icon.textContent = '🔌';
            text.textContent = 'Déconnecté - Vérifiez la connexion';
        }
    }
}

// ========================================
// CHARGEMENT DES SYMPTÔMES
// ========================================

async function loadSymptomesFromSupabase() {
    if (!supabase || !isConnected) return;

    try {
        const { data, error } = await supabase
            .from('symptome')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        symptomes = data || [];
        updateDisplay();

    } catch (error) {
        console.error('❌ Erreur chargement symptomes:', error);
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

    realtimeChannel = supabase
        .channel('symptome_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'symptome' },
            payload => {
                if (payload.eventType === 'INSERT') {
                    symptomes.unshift(payload.new);
                    updateDisplay();
                } else if (payload.eventType === 'DELETE') {
                    loadSymptomesFromSupabase();
                }
            }
        )
        .subscribe(status => {
            if (status === 'SUBSCRIBED') {
                isConnected = true;
                updateConnectionStatus(true);
            } else if (status === 'CHANNEL_ERROR') {
                isConnected = false;
                updateConnectionStatus(false);
            }
        });
}

// ========================================
// AUTO REFRESH
// ========================================

function startAutoRefresh() {
    autoRefreshInterval = setInterval(loadSymptomesFromSupabase, AUTO_REFRESH_INTERVAL);

    setInterval(async () => {
        if (!isConnected && supabase) {
            try {
                const { error } = await supabase.from('symptome').select('count').limit(1);
                if (!error) {
                    isConnected = true;
                    updateConnectionStatus(true);
                    await loadSymptomesFromSupabase();
                }
            } catch {}
        }
    }, CONNECTION_CHECK_INTERVAL);
}

// ========================================
// GESTION INTERACTIONS UTILISATEUR
// ========================================

function setupEventListeners() {
    const buttons = document.querySelectorAll('.symptome-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedSymptome = btn.dataset.symptome;
        });
    });

    const form = document.getElementById('symptomeForm');
    if (form) form.addEventListener('submit', e => {
        e.preventDefault();
        submitSymptome();
    });
}

// ========================================
// AJOUT SYMPTÔME
// ========================================

async function submitSymptome() {
    const nom = document.getElementById('patientName')?.value?.trim();
    const commentaire = document.getElementById('comment')?.value?.trim();
    const submitBtn = document.getElementById('submitBtn');

    if (!selectedSymptome) {
        alert('Sélectionnez un symptôme !');
        return;
    }

    if (!nom) {
        alert('Entrez le nom du patient !');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '🔄 Envoi...';
    }

    const symptomeData = {
        nom,
        symptome: selectedSymptome,
        commentaire: commentaire || null
    };

    const success = await addSymptome(symptomeData);

    if (success) {
        resetForm();
        if (submitBtn) {
            submitBtn.textContent = '✅ Envoyé';
            setTimeout(() => {
                submitBtn.textContent = '📤 Partager symptôme';
                submitBtn.disabled = false;
            }, 2000);
        }
    } else {
        if (submitBtn) {
            submitBtn.textContent = '❌ Erreur';
            setTimeout(() => {
                submitBtn.textContent = '📤 Partager symptôme';
                submitBtn.disabled = false;
            }, 2000);
        }
    }
}

async function addSymptome(symptome) {
    if (!supabase) {
        alert('Erreur : Supabase non initialisé');
        return false;
    }

    try {
        const cinqMinutes = new Date(Date.now() - 5*60*1000).toISOString();
        const { data: existing, error: selError } = await supabase.from('symptome')
            .select('*')
            .eq('nom', symptome.nom)
            .eq('symptome', symptome.symptome)
            .gte('created_at', cinqMinutes)
            .limit(1);

        if (selError) throw selError;

        if (existing && existing.length > 0) {
            alert('Ce symptôme a déjà été enregistré récemment.');
            
            return false;
        }

        const { error } = await supabase.from('symptome').insert([symptome]);
        if (error) throw error;
        return true;

    } catch (error) {
        console.error('❌ Erreur ajout symptôme:', error);
        alert('Erreur lors de l\'envoi : ' + error.message);
        return false;
    }
}

function resetForm() {
    const form = document.getElementById('symptomeForm');
    if (form) form.reset();
    document.querySelectorAll('.symptome-btn').forEach(b => b.classList.remove('selected'));
    selectedSymptome = '';
}

// ========================================
// AFFICHAGE
// ========================================

function updateDisplay() {
    updateSymptomeList();
    updateStats();
}

function updateStats() {
    const totalEl = document.getElementById('totalPatients');
    if (totalEl) totalEl.textContent = symptomes.length;
}

function updateSymptomeList() {
    const container = document.getElementById('symptomeList');
    if (!container) return;

    if (symptomes.length === 0) {
        container.innerHTML = `<p>🩺 Aucun symptôme enregistré pour l'instant...</p>`;
        return;
    }

    container.innerHTML = symptomes.map(s => `
        <div class="symptome-item">
            <strong>${escapeHtml(s.nom)}</strong> : ${escapeHtml(s.symptome)}
            ${s.commentaire ? `<em> - ${escapeHtml(s.commentaire)}</em>` : ''}
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
// INITIALISATION APP
// ========================================

async function initApp() {
    setupEventListeners();
    await initSupabase();
    updateDisplay();
}

// ========================================
// DÉMARRAGE
// ========================================

function startApp() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
}

startApp();
