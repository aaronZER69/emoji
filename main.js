// main.js
// ========================================
// CONFIGURATION ET INITIALISATION
// ========================================

console.log('🎭 Emoji Code Mood - Version Sécurisée v2.0');

// Vérification stricte de la configuration Supabase
if (!window.PRIVATE_CONFIG || !window.PRIVATE_CONFIG.supabaseUrl || !window.PRIVATE_CONFIG.supabaseAnonKey) {
    alert('❌ ERREUR : La configuration Supabase est manquante.\nVérifiez que le fichier private-config.js est bien injecté avant main.js.');
    throw new Error('Configuration Supabase manquante.');
}

const CONFIG = { ...window.PRIVATE_CONFIG };
console.log('✅ Configuration Supabase détectée - Mode Supabase activé');

// Variables globales
let supabase = null;
let moods = [];
let selectedEmoji = '';
let sessionStartTime = new Date();

// ========================================
// INITIALISATION SUPABASE VIA MODULE
// ========================================
import { getSupabaseClient } from './supabaseClient.js';

async function initSupabase() {
    // Charger dynamiquement la lib si besoin (pour navigateur)
    if (!window.supabaseLib) {
        window.supabaseLib = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
    }
    try {
        supabase = getSupabaseClient();
        // Test de connexion
        const { error } = await supabase.from('moods').select('count').limit(1);
        if (error) {
            throw error;
        }
        console.log('🚀 Supabase connecté avec succès');
        await loadMoodsFromSupabase();
        setupRealtimeSubscription();
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion Supabase :', error.message || error);
        alert('Connexion à Supabase impossible. Vérifiez la configuration.');
        return false;
    }
}

async function loadMoodsFromSupabase() {
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('moods')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        moods = data || [];
        updateDisplay();
        console.log(`📊 ${moods.length} mood codes chargés depuis Supabase`);
    } catch (error) {
        console.error('❌ Erreur chargement Supabase:', error);
    }
}

function setupRealtimeSubscription() {
    if (!supabase) return;

    supabase
        .channel('moods_realtime')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'moods' },
            (payload) => {
                console.log('🔄 Changement temps réel:', payload.eventType);

                if (payload.eventType === 'INSERT') {
                    moods.unshift(payload.new);
                    updateDisplay();

                    // Animation d'arrivée
                    setTimeout(() => {
                        const newItem = document.querySelector('.mood-item');
                        if (newItem) newItem.style.animation = 'slideIn 0.5s ease';
                    }, 100);
                } else if (payload.eventType === 'DELETE') {
                    loadMoodsFromSupabase();
                }
            }
        )
        .subscribe((status) => {
            console.log('📡 Realtime status:', status);
        });
}

// ========================================
// MODE LOCAL SUPPRIMÉ : L'application fonctionne uniquement avec Supabase
// ========================================

// ========================================
// GESTION DES MOOD CODES
// ========================================

async function addMood(mood) {
    mood.created_at = new Date().toISOString();

    if (CONFIG.mode === 'supabase' && supabase) {
        try {
            // Vérifier si un mood identique existe déjà (prénom, emoji, langage, commentaire)
            const { data: existing, error: selectError } = await supabase
                .from('moods')
                .select('*')
                .eq('name', mood.name)
                .eq('emoji', mood.emoji)
                .eq('language', mood.language)
                .eq('comment', mood.comment || null)
                .limit(1);

            if (selectError) throw selectError;
            if (existing && existing.length > 0) {
                alert('Ce code humeur a déjà été enregistré.');
                return false;
            }

            const { data, error } = await supabase
                .from('moods')
                .insert([mood])
                .select();

            if (error) throw error;
            console.log('✅ Mood ajouté à Supabase');
            return true;
        } catch (error) {
            console.error('❌ Erreur ajout Supabase:', error);
            return false;
        }
    }
    return false;
}

// ========================================
// INTERFACE UTILISATEUR
// ========================================

function setupEventListeners() {
    // Gestion de la sélection d'emoji
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedEmoji = btn.dataset.emoji;
        });
    });

    // Gestion du formulaire
    document.getElementById('moodForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitMood();
    });

    // Timer de session
    setInterval(() => {
        const minutes = Math.floor((new Date() - sessionStartTime) / 60000);
        document.getElementById('sessionTime').textContent = minutes;
    }, 60000);
}

async function submitMood() {
    const name = document.getElementById('studentName').value.trim();
    const language = document.getElementById('language').value;
    const comment = document.getElementById('comment').value.trim();
    const submitBtn = document.getElementById('submitBtn');

    // Empêcher double soumission
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;

    // Validations
    if (!selectedEmoji) {
        alert('N\'oublie pas de choisir un emoji ! 😊');
        submitBtn.disabled = false;
        return;
    }

    if (name.length < 2) {
        alert('Le prénom doit contenir au moins 2 caractères');
        submitBtn.disabled = false;
        return;
    }

    const mood = {
        name: name,
        emoji: selectedEmoji,
        language: language,
        comment: comment || null
    };

    // Animation de chargement
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '🔄 Envoi en cours...';

    const success = await addMood(mood);

    if (success) {
        resetForm();
        submitBtn.textContent = '✅ Envoyé avec succès !';
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2500);
    } else {
        submitBtn.textContent = '❌ Erreur - Réessayer';
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 3000);
    }
}

function resetForm() {
    document.getElementById('moodForm').reset();
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
    selectedEmoji = '';
}

// ========================================
// AFFICHAGE ET VISUALISATION
// ========================================

function updateDisplay() {
    updateStats();
    updateMoodList();
    updateVisualization();
}

function updateStats() {
    document.getElementById('totalParticipants').textContent = moods.length;

    const uniqueEmojis = new Set(moods.map(m => m.emoji));
    document.getElementById('moodVariety').textContent = uniqueEmojis.size;

    const minutes = Math.floor((new Date() - sessionStartTime) / 60000);
    document.getElementById('sessionTime').textContent = minutes;
}

function updateMoodList() {
    const listContainer = document.getElementById('moodList');

    if (moods.length === 0) {
        listContainer.innerHTML = `
            <div class="loading">
                <p>🤖 En attente des premiers codes mood...</p>
                <p style="font-size: 0.9em; margin-top: 10px; color: #666;">Synchronisation temps réel active</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = moods.map(mood => {
        const codeSnippet = generateCodeSnippet(mood);
        const timeDisplay = formatTime(mood.created_at);

        return `
            <div class="mood-item">
                <div class="mood-header">
                    <span class="student-name">${escapeHtml(mood.name)}</span>
                    <span class="timestamp">${timeDisplay}</span>
                </div>
                <div class="code-display">
                    <div class="language-tag">${mood.language}</div>
                    ${codeSnippet}
                </div>
            </div>
        `;
    }).join('');
}

function generateCodeSnippet(mood) {
    const templates = {
        javascript: `let mood = "${mood.emoji}";${mood.comment ? ` <span class="comment">// ${escapeHtml(mood.comment)}</span>` : ''}`,
        typescript: `const mood: string = "${mood.emoji}";${mood.comment ? ` <span class="comment">// ${escapeHtml(mood.comment)}</span>` : ''}`,
        python: `humeur = "${mood.emoji}"${mood.comment ? `  <span class="comment"># ${escapeHtml(mood.comment)}</span>` : ''}`,
        java: `String mood = "${mood.emoji}";${mood.comment ? ` <span class="comment">// ${escapeHtml(mood.comment)}</span>` : ''}`,
        csharp: `string mood = "${mood.emoji}";${mood.comment ? ` <span class="comment">// ${escapeHtml(mood.comment)}</span>` : ''}`,
        php: `$mood = "${mood.emoji}";${mood.comment ? ` <span class="comment">// ${escapeHtml(mood.comment)}</span>` : ''}`,
        cpp: `std::string mood = "${mood.emoji}";${mood.comment ? ` <span class="comment">// ${escapeHtml(mood.comment)}</span>` : ''}`,
        rust: `let mood = "${mood.emoji}";${mood.comment ? ` <span class="comment">// ${escapeHtml(mood.comment)}</span>` : ''}`,
        go: `mood := "${mood.emoji}"${mood.comment ? ` <span class="comment">// ${escapeHtml(mood.comment)}</span>` : ''}`
    };

    return templates[mood.language] || `mood = "${mood.emoji}";${mood.comment ? ` // ${escapeHtml(mood.comment)}` : ''}`;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h${diffMinutes % 60 > 0 ? diffMinutes % 60 + 'min' : ''}`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateVisualization() {
    const container = document.getElementById('moodVisualization');

    if (moods.length === 0) {
        container.innerHTML = '';
        return;
    }

    const emojiCounts = {};
    moods.forEach(mood => {
        emojiCounts[mood.emoji] = (emojiCounts[mood.emoji] || 0) + 1;
    });

    container.innerHTML = Object.entries(emojiCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([emoji, count]) => `
            <div class="mood-bubble">
                <span>${emoji}</span>
                <span class="mood-count">${count}</span>
            </div>
        `).join('');
}

// ========================================
// CONTRÔLES ENSEIGNANT
// ========================================

window.loadMoods = async function() {
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '🔄 Actualisation...';
    btn.disabled = true;

    try {
        await loadMoodsFromSupabase();
        btn.textContent = '✅ Actualisé';
    } catch (error) {
        btn.textContent = '❌ Erreur';
        console.error('Erreur actualisation:', error);
    }

    setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    }, 2000);
};

window.clearAllMoods = async function() {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir effacer TOUS les mood codes ?')) {
        return;
    }

    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '🗑️ Suppression...';
    btn.disabled = true;

    try {
        const { error } = await supabase
            .from('moods')
            .delete()
            .neq('id', 0);

        if (error) throw error;
        btn.textContent = '✅ Effacé';
    } catch (error) {
        btn.textContent = '❌ Erreur';
        console.error('Erreur suppression:', error);
    }

    setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    }, 2000);
};

window.exportMoods = function() {
    if (moods.length === 0) {
        alert('Aucun mood code à exporter !');
        return;
    }

    const exportData = moods.map(mood => ({
        Prénom: mood.name,
        Emoji: mood.emoji,
        Langage: mood.language,
        Commentaire: mood.comment || '',
        'Date/Heure': formatTime(mood.created_at),
        Timestamp: mood.created_at,
        Mode: CONFIG.mode
    }));

    const headers = Object.keys(exportData[0]);
    const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
            headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
    ].join('\n');

    downloadFile(csvContent, `emoji-code-mood-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
};

window.exportMoodsJSON = function() {
    if (moods.length === 0) {
        alert('Aucun mood code à exporter !');
        return;
    }

    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            mode: CONFIG.mode,
            sessionDuration: Math.floor((new Date() - sessionStartTime) / 60000),
            totalParticipants: moods.length,
            uniqueEmojis: new Set(moods.map(m => m.emoji)).size,
            version: 'secure-2.0'
        },
        moods: moods,
        analytics: generateAnalytics()
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, `emoji-code-mood-session-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
};

function generateAnalytics() {
    const emojiStats = {};
    const languageStats = {};

    moods.forEach(mood => {
        emojiStats[mood.emoji] = (emojiStats[mood.emoji] || 0) + 1;
        languageStats[mood.language] = (languageStats[mood.language] || 0) + 1;
    });

    return {
        emojiDistribution: emojiStats,
        languagePreferences: languageStats,
        topEmojis: Object.entries(emojiStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([emoji, count]) => ({ emoji, count, percentage: Math.round(count / moods.length * 100) }))
    };
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ========================================
// INITIALISATION DE L'APPLICATION
// ========================================

async function initApp() {
    console.log('🚀 Initialisation Emoji Code Mood...');

    // Configuration des event listeners d'abord
    setupEventListeners();

    // Initialisation Supabase obligatoire
    await initSupabase();

    // Mise à jour initiale de l'affichage
    updateDisplay();

    console.log('✅ Application initialisée avec succès');
    console.log('📊 Mode actuel:', CONFIG.mode);
    console.log('📈 Mood codes chargés:', moods.length);
}

// Démarrage automatique - Multiple méthodes pour assurer le chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // Le DOM est déjà chargé
    initApp();
}

// Fallback supplémentaire
window.addEventListener('load', () => {
    // Vérifier si l'app n'est pas encore initialisée
    if (moods.length === 0 && !document.querySelector('.mood-item')) {
        console.log('🔄 Initialisation fallback...');
        initApp();
    }
});




