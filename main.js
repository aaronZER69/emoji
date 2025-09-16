// =========================
// Suivi de Symptômes Médicaux
// =========================

// --- Variables globales ---
let symptomes = [];
let currentPatient = null;

// =========================
// Soumission d'un symptôme
// =========================
async function submitSymptome(selectedEmoji) {
    const patientNom = document.getElementById('patientName')?.value?.trim();
    const symptomePrincipal = document.getElementById('mainSymptom')?.value;
    const intensite = document.getElementById('severityLevel')?.value;
    const commentaire = document.getElementById('comment')?.value?.trim();

    if (!patientNom) {
        alert("Veuillez entrer le nom du patient");
        return;
    }

    const symptome = {
        patient_nom: patientNom,
        symptome: symptomePrincipal,
        intensite: intensite,
        emoji: selectedEmoji,
        commentaire: commentaire || null
    };

    await addSymptome(symptome);

    // Réinitialiser le formulaire
    document.getElementById('symptomForm')?.reset();
    currentPatient = patientNom;
}

// =========================
// Ajout d'un symptôme (DB)
// =========================
async function addSymptome(symptome) {
    try {
        const { data, error } = await supabase
            .from('symptome')
            .insert([symptome]);

        if (error) throw error;

        if (data && data.length > 0) {
            updateSymptomList([data[0]]);
        }
    } catch (err) {
        console.error("Erreur lors de l'ajout du symptôme :", err);
        alert("Impossible d'ajouter le symptôme");
    }
}

// =========================
// Chargement initial
// =========================
async function loadSymptomesFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('symptome')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        symptomes = data || [];
        updateSymptomList(symptomes);
    } catch (err) {
        console.error("Erreur lors du chargement des symptômes :", err);
    }
}

// =========================
// Affichage de la liste
// =========================
function updateSymptomList(symptomesToRender) {
    const symptomList = document.getElementById('symptomList');
    if (!symptomList) return;

    symptomList.innerHTML = symptomesToRender.map(symptome => {
        const createdAt = new Date(symptome.created_at);
        const timeDisplay = createdAt.toLocaleString();

        const isRecent = (Date.now() - createdAt.getTime()) < 5000;
        if (isRecent) {
            setTimeout(() => {
                const el = document.getElementById(`symptome-${symptome.id}`);
                if (el) el.classList.remove('new-post');
            }, 5000);
        }

        return `
            <div id="symptome-${symptome.id}" class="symptome-item ${isRecent ? 'new-post' : ''}">
                <div class="symptome-header">
                    <div class="patient-info">
                        <span class="patient-name">${escapeHtml(symptome.patient_nom)}</span>
                        <span class="patient-emoji">${symptome.emoji || '❓'}</span>
                        <span class="symptome-type">${escapeHtml(symptome.symptome || 'Non précisé')}</span>
                        <span class="symptome-intensite">Intensité: ${escapeHtml(symptome.intensite || 'N/A')}</span>
                    </div>
                    <span class="symptome-time">${timeDisplay}</span>
                </div>
                <div class="symptome-content">
                    ${symptome.commentaire ? `<div class="symptome-comment">"${escapeHtml(symptome.commentaire)}"</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    updateVisualization(symptomesToRender);
}

// =========================
// Visualisations
// =========================
function updateVisualization(symptomesToRender) {
    const symptomCounts = {};
    const intensiteCounts = {};

    symptomesToRender.forEach(s => {
        symptomCounts[s.symptome] = (symptomCounts[s.symptome] || 0) + 1;
        intensiteCounts[s.intensite] = (intensiteCounts[s.intensite] || 0) + 1;
    });

    const topSymptomes = Object.entries(symptomCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([symptome, count]) => `<div>${escapeHtml(symptome)}: ${count}</div>`)
        .join('');

    const intensiteStats = Object.entries(intensiteCounts)
        .map(([level, count]) => `<div>Intensité ${escapeHtml(level)}: ${count}</div>`)
        .join('');

    document.getElementById('top-symptoms').innerHTML = topSymptomes || "<div>Aucun symptôme pour l'instant</div>";
    document.getElementById('symptom-intensity').innerHTML = intensiteStats || "<div>Aucune donnée d'intensité</div>";
}

// =========================
// Helpers
// =========================
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =========================
// Initialisation
// =========================
document.addEventListener('DOMContentLoaded', async () => {
    await loadSymptomesFromSupabase();

    // Écoute en temps réel
    supabase
        .channel('symptome-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'symptome' }, payload => {
            if (payload.new) {
                updateSymptomList([payload.new, ...symptomes]);
            }
        })
        .subscribe();

    // Boutons d'emoji (ressenti)
    document.querySelectorAll('.emoji-btn').forEach(button => {
        button.addEventListener('click', () => submitSymptome(button.textContent));
    });

    // Soumission du formulaire
    const form = document.getElementById('symptomForm');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            submitSymptome('🩺'); // emoji par défaut
        });
    }
});
